import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import { AlertTriangle, Database, RefreshCcw, ArrowLeft } from "lucide-react";

/**
 * 🔐 DEV ONLY – DATABASE INSPECTOR
 * ---------------------------------
 * Features:
 * - Schema validation (structure + types)
 * - Date-key consistency check
 * - Invoice number mismatch / duplicates
 * - Cross-reference validation
 * - Logical checks (subtotal, totals)
 * - Severity-based reporting
 * - Read-only, safe-by-default
 */

// -----------------------------
// 📐 SCHEMA DEFINITION
// -----------------------------
const schema = {
  sales: {
    "*dateKey": {
      "*invoiceKey": {
        createdAt: "string",
        invoiceNumber: "number",
        partyId: "string",
        warehouseId: "string",
        items: "array",
        subtotal: "number",
        total: "number",
        dueDate: ["string", "null"],
      },
    },
  },
};

// -----------------------------
// 🔍 HELPERS
// -----------------------------
const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
const isISODate = (s) => typeof s === "string" && !isNaN(Date.parse(s));
const getDateOnly = (iso) => iso?.split("T")[0];

// -----------------------------
// 🧠 SCANNER LOGIC
// -----------------------------
function scanSales(salesNode, parties, warehouses, progressCallback) {
  const issues = [];
  const invoiceNumbers = new Map();

  const DATEKEY_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  const INV_KEY_REGEX = /^invoice-\d+$/;

  const allEntries = Object.entries(salesNode || {});
  let totalInvoices = 0;
  allEntries.forEach(([_, invoices]) => {
    totalInvoices += Object.keys(invoices || {}).length;
  });

  let scanned = 0;

  allEntries.forEach(([dateKey, invoices]) => {
    // DATEKEY FORMAT CHECK
    if (!DATEKEY_REGEX.test(dateKey)) {
      issues.push({
        severity: "warning",
        type: "DATEKEY_FORMAT",
        path: `sales/${dateKey}`,
        message: `Date key is not in ISO format (YYYY-MM-DDTHH:MM:SS).`,
      });
    }

    // SAME DATE DUPLICATE CHECK
    const invoicesByDate = new Map();

    Object.entries(invoices || {}).forEach(([invKey, inv]) => {
      scanned++;
      progressCallback(scanned, totalInvoices);

      const pathBase = `sales/${dateKey}/${invKey}`;

      // Required fields
      ["createdAt", "invoiceNumber", "partyId", "warehouseId", "items", "subtotal", "total"].forEach((k) => {
        if (!(k in inv)) {
          issues.push({
            severity: "error",
            type: "MISSING_KEY",
            path: `${pathBase}/${k}`,
            message: `Missing required key '${k}'`,
          });
        }
      });

      // Type checks
      Object.entries(schema.sales["*dateKey"]["*invoiceKey"]).forEach(([k, expected]) => {
        const actual = typeOf(inv[k]);
        const allowed = Array.isArray(expected) ? expected : [expected];
        if (inv[k] !== undefined && !allowed.includes(actual)) {
          issues.push({
            severity: "error",
            type: "TYPE_MISMATCH",
            path: `${pathBase}/${k}`,
            message: `Expected ${allowed.join(" or ")}, got ${actual}`,
          });
        }
      });

      // Date mismatch
      if (isISODate(inv.createdAt)) {
        const createdDateOnly = getDateOnly(inv.createdAt);
        const dateKeyDateOnly = dateKey.split("T")[0];

        if (createdDateOnly !== dateKeyDateOnly) {
          issues.push({
            severity: "error",
            type: "DATEKEY_CREATEDAT_MISMATCH",
            path: `sales/${dateKey}/${invKey}`,
            message: `createdAt date does not match dateKey date.`,
          });
        }

        if (inv.createdAt.endsWith("T00:00:00")) {
          issues.push({
            severity: "warning",
            type: "CREATEDAT_TIME_MISSING",
            path: `sales/${dateKey}/${invKey}`,
            message: `createdAt has default time (00:00:00). This may be incorrect.`,
          });
        }
      }

      // Invalid party/warehouse
      if (!parties[inv.partyId]) {
        issues.push({
          severity: "error",
          type: "INVALID_PARTY_ID",
          path: `sales/${dateKey}/${invKey}/partyId`,
          message: `partyId does not exist in parties table.`,
        });
      }
      if (!warehouses[inv.warehouseId]) {
        issues.push({
          severity: "error",
          type: "INVALID_WAREHOUSE_ID",
          path: `sales/${dateKey}/${invKey}/warehouseId`,
          message: `warehouseId does not exist in warehouses table.`,
        });
      }

      // Invoice key format check
      if (!INV_KEY_REGEX.test(invKey)) {
        issues.push({
          severity: "error",
          type: "INV_KEY_FORMAT",
          path: `sales/${dateKey}/${invKey}`,
          message: `Invoice key must be in format invoice-<number>.`,
        });
      }

      // Invoice key mismatch
      const num = inv.invoiceNumber;
      if (invKey !== `invoice-${num}`) {
        issues.push({
          severity: "error",
          type: "INVOICE_KEY_MISMATCH",
          path: pathBase,
          message: `Key '${invKey}' does not match invoiceNumber ${num}`,
        });
      }

      // Duplicate invoice numbers in same date
      if (!invoicesByDate.has(num)) {
        invoicesByDate.set(num, invKey);
      } else {
        issues.push({
          severity: "error",
          type: "DUPLICATE_INVOICE_SAME_DATE",
          path: `sales/${dateKey}/${invKey}`,
          message: `Same invoice number exists in this date already.`,
        });
      }

      // Duplicate invoice numbers across dates
      if (invoiceNumbers.has(num)) {
        const existingPath = invoiceNumbers.get(num);

        if (existingPath !== pathBase) {
          issues.push({
            severity: "error",
            type: "DUPLICATE_INVOICE_ACROSS_DATES",
            path: pathBase,
            message: `Invoice number exists in another date: ${existingPath}`,
          });
        }
      } else {
        invoiceNumbers.set(num, pathBase);
      }

      // Logical subtotal check
      if (Array.isArray(inv.items)) {
        const sum = inv.items.reduce((s, i) => s + Number(i.total || 0), 0);
        if (Math.round(sum * 100) !== Math.round(Number(inv.subtotal) * 100)) {
          issues.push({
            severity: "warning",
            type: "SUBTOTAL_MISMATCH",
            path: pathBase,
            message: `Subtotal ${inv.subtotal} != items sum ${sum}`,
          });
        }
      }

      // TOTAL vs SUBTOTAL check
      if (inv.total !== inv.subtotal) {
        issues.push({
          severity: "warning",
          type: "TOTAL_SUBTOTAL_MISMATCH",
          path: `sales/${dateKey}/${invKey}`,
          message: `total doesn't match subtotal.`,
        });
      }
    });
  });

  return issues;
}

// -----------------------------
// 🖥️ UI COMPONENT
// -----------------------------
const DbInspector = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState({ scanned: 0, total: 0 });

  useEffect(() => {
    const partiesRef = ref(db, "parties");
    const warehousesRef = ref(db, "warehouse");
    const salesRef = ref(db, "sales");

    // Load parties + warehouses once
    Promise.all([
      new Promise((resolve) =>
        onValue(partiesRef, (snap) => resolve(snap.val() || {}), { onlyOnce: true })
      ),
      new Promise((resolve) =>
        onValue(warehousesRef, (snap) => resolve(snap.val() || {}), { onlyOnce: true })
      ),
    ]).then(([partiesData, warehousesData]) => {
      // Now load sales and scan
      onValue(salesRef, (snap) => {
        const sales = snap.val() || {};
        const found = scanSales(sales, partiesData, warehousesData, (scanned, total) => {
          setProgress({ scanned, total });
        });
        setIssues(found);
        setLoading(false);
      });
    });
  }, []);

  const grouped = useMemo(() => {
    return {
      error: issues.filter((i) => i.severity === "error"),
      warning: issues.filter((i) => i.severity === "warning"),
    };
  }, [issues]);

  const progressPercent = progress.total ? Math.round((progress.scanned / progress.total) * 100) : 0;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft />
          </Button>
            <Database /> DB Inspector
          </h1>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Rescan
          </Button>
        </div>

        {loading ? (
          <div className="p-6 bg-white rounded shadow">
            <div className="font-bold mb-2">Scanning Database...</div>
            <div className="text-sm text-slate-500 mb-3">
              {progress.scanned} / {progress.total || "…"} invoices scanned
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg, #7c3aed, #22c55e)",
                }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-2">
              This loader matches your app vibe and shows real scan progress.
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-green-600 font-medium">✅ No structural issues found</div>
        ) : (
          <div className="space-y-4">
            {issues.map((i, idx) => (
              <div
                key={idx}
                className={`border p-4 rounded bg-white flex gap-3 ${
                  i.severity === "error" ? "border-red-300" : "border-yellow-300"
                }`}
              >
                <AlertTriangle
                  className={i.severity === "error" ? "text-red-600" : "text-yellow-600"}
                />
                <div>
                  <div className="font-semibold">{i.type}</div>
                  <div className="text-sm text-slate-600">{i.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{i.path}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DbInspector;