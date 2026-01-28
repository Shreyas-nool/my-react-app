import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import {
  AlertTriangle,
  Database,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";

/* -----------------------------
   🔍 HELPERS
----------------------------- */
const typeOf = (v) =>
  Array.isArray(v) ? "array" : v === null ? "null" : typeof v;
const isISODate = (s) => typeof s === "string" && !isNaN(Date.parse(s));
const getDateOnly = (iso) => iso?.split("T")[0];

/* -----------------------------
   🧠 SALES SCANNER
----------------------------- */
function scanSales(sales, parties, warehouses, progressCb) {
  const issues = [];
  const invoiceNumbers = new Map();

  const DATEKEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const INV_KEY_REGEX = /^invoice-\d+$/;

  const dateEntries = Object.entries(sales || {});
  const totalInvoices = dateEntries.reduce(
    (s, [, invs]) => s + Object.keys(invs || {}).length,
    0
  );

  let scanned = 0;

  dateEntries.forEach(([dateKey, invoices]) => {
    // Detect legacy keys (with time)
    const isLegacyKey = /\d{4}-\d{2}-\d{2}T/.test(dateKey);

    if (!DATEKEY_REGEX.test(dateKey)) {
      issues.push({
        severity: "warning",
        type: "DATEKEY_FORMAT",
        path: `sales/${dateKey}`,
        message: "Date key should be YYYY-MM-DD",
        hidden: isLegacyKey, // hide legacy warnings by default
      });
    }

    const seenPerDate = new Set();

    Object.entries(invoices || {}).forEach(([invKey, inv]) => {
      scanned++;
      progressCb(scanned, totalInvoices);

      const path = `sales/${dateKey}/${invKey}`;
      const keyDate = dateKey.split("T")[0]; // normalize for legacy

      /* Required fields */
      [
        "createdAt",
        "invoiceNumber",
        "partyId",
        "warehouseId",
        "items",
        "subtotal",
        "total",
      ].forEach((k) => {
        if (!(k in inv)) {
          issues.push({
            severity: "error",
            type: "MISSING_KEY",
            path: `${path}/${k}`,
            message: `Missing required field '${k}'`,
            hidden: false,
          });
        }
      });

      /* createdAt vs dateKey */
      if (inv.createdAt && new Date(inv.createdAt).toString() !== "Invalid Date") {
        if (inv.createdAt.split("T")[0] !== keyDate) {
          issues.push({
            severity: "error",
            type: "DATE_MISMATCH",
            path,
            message: "createdAt date does not match dateKey",
            hidden: isLegacyKey, // hide legacy mismatch
          });
        }
      }

      /* Invoice key validation */
      if (!INV_KEY_REGEX.test(invKey)) {
        issues.push({
          severity: "error",
          type: "INVALID_INVOICE_KEY",
          path,
          message: "Invoice key must be invoice-<number>",
          hidden: false,
        });
      }

      if (`invoice-${inv.invoiceNumber}` !== invKey) {
        issues.push({
          severity: "error",
          type: "INVOICE_KEY_MISMATCH",
          path,
          message: "invoiceNumber does not match key",
          hidden: false,
        });
      }

      /* Duplicate invoice numbers */
      if (seenPerDate.has(inv.invoiceNumber)) {
        issues.push({
          severity: "error",
          type: "DUPLICATE_INVOICE_SAME_DATE",
          path,
          message: "Duplicate invoice number on same date",
          hidden: false,
        });
      }
      seenPerDate.add(inv.invoiceNumber);

      if (invoiceNumbers.has(inv.invoiceNumber)) {
        issues.push({
          severity: "error",
          type: "DUPLICATE_INVOICE_GLOBAL",
          path,
          message: `Invoice number reused (also at ${invoiceNumbers.get(
            inv.invoiceNumber
          )})`,
          hidden: false,
        });
      } else {
        invoiceNumbers.set(inv.invoiceNumber, path);
      }

      /* Party / Warehouse */
      if (!parties[inv.partyId]) {
        issues.push({
          severity: "error",
          type: "INVALID_PARTY",
          path: `${path}/partyId`,
          message: "partyId not found",
          hidden: false,
        });
      }

      if (!warehouses[inv.warehouseId]) {
        issues.push({
          severity: "error",
          type: "INVALID_WAREHOUSE",
          path: `${path}/warehouseId`,
          message: "warehouseId not found",
          hidden: false,
        });
      }

      /* Subtotal check */
      if (Array.isArray(inv.items)) {
        const sum = inv.items.reduce((s, i) => s + Number(i.total || 0), 0);
        if (Math.round(sum * 100) !== Math.round(inv.subtotal * 100)) {
          issues.push({
            severity: "warning",
            type: "SUBTOTAL_MISMATCH",
            path,
            message: `Items sum ${sum} ≠ subtotal ${inv.subtotal}`,
            hidden: false,
          });
        }
      }

      if (inv.total !== inv.subtotal) {
        issues.push({
          severity: "warning",
          type: "TOTAL_MISMATCH",
          path,
          message: "total ≠ subtotal",
          hidden: false,
        });
      }
    });
  });

  return issues;
}

/* -----------------------------
   🖥️ UI
----------------------------- */
export default function DbInspector() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ scanned: 0, total: 0 });

  const [severity, setSeverity] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showLegacy, setShowLegacy] = useState(false); // NEW toggle

  useEffect(() => {
    const partiesRef = ref(db, "parties");
    const warehouseRef = ref(db, "warehouse");
    const salesRef = ref(db, "sales");

    Promise.all([
      new Promise((r) =>
        onValue(partiesRef, (s) => r(s.val() || {}), { onlyOnce: true })
      ),
      new Promise((r) =>
        onValue(warehouseRef, (s) => r(s.val() || {}), { onlyOnce: true })
      ),
    ]).then(([parties, warehouses]) => {
      onValue(salesRef, (snap) => {
        const found = scanSales(
          snap.val() || {},
          parties,
          warehouses,
          (scanned, total) => setProgress({ scanned, total })
        );
        setIssues(found);
        setLoading(false);
      });
    });
  }, []);

  /* Counts */
  const counts = useMemo(() => {
    const c = {};
    issues.forEach((i) => (c[i.type] = (c[i.type] || 0) + 1));
    return c;
  }, [issues]);

  /* Filtered */
  const filtered = useMemo(() => {
    return issues.filter((i) => {
      if (!showLegacy && i.hidden) return false; // hide legacy issues if toggle OFF
      if (severity !== "all" && i.severity !== severity) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (
        search &&
        !`${i.message} ${i.path}`.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [issues, severity, typeFilter, search, showLegacy]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Button variant="ghost" size="icon" onClick={() => history.back()}>
              <ArrowLeft />
            </Button>
            <Database /> DB Inspector
          </h1>
          <Button onClick={() => location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Rescan
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded shadow space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            {["all", "error", "warning"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={severity === s ? "default" : "outline"}
                onClick={() => setSeverity(s)}
              >
                {s.toUpperCase()}
              </Button>
            ))}

            {/* LEGACY TOGGLE */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium">Show Legacy</span>
              <button
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  showLegacy ? "bg-green-500" : "bg-gray-300"
                }`}
                onClick={() => setShowLegacy(!showLegacy)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    showLegacy ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={typeFilter === "all" ? "default" : "outline"}
              onClick={() => setTypeFilter("all")}
            >
              All Types
            </Button>
            {Object.entries(counts).map(([t, c]) => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? "default" : "outline"}
                onClick={() => setTypeFilter(t)}
              >
                {t} ({c})
              </Button>
            ))}
          </div>

          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Search by message or path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white p-6 rounded shadow">
            Scanning… {progress.scanned}/{progress.total}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-green-600 font-medium">
            ✅ No issues for this filter
          </div>
        ) : (
          filtered.map((i, idx) => (
            <div
              key={idx}
              className={`bg-white border-l-4 p-4 rounded shadow ${
                i.severity === "error"
                  ? "border-red-500"
                  : "border-yellow-400"
              }`}
            >
              <div className="font-semibold">{i.type}</div>
              <div className="text-sm text-slate-600">{i.message}</div>
              <div className="text-xs text-slate-400">{i.path}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}