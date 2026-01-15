import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue, set, runTransaction } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 20;

const SalesScreen = () => {
  const navigate = useNavigate();

  const [pageInitialized, setPageInitialized] = useState(false);
  const [sales, setSales] = useState([]);
  const [salesLoaded, setSalesLoaded] = useState(false);

  const [partiesMap, setPartiesMap] = useState({});
  const [warehousesMap, setWarehousesMap] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  // DELETE STATES
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const round2 = (num) =>
    Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  /* ---------- FETCH SALES ---------- */
  useEffect(() => {
    const salesRef = ref(db, "sales");

    const unsub = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setSales([]);
        setSalesLoaded(true);
        return;
      }

      const arr = [];

      Object.entries(data || {}).forEach(([parentKey, invoices]) => {
  Object.entries(invoices || {}).forEach(([invoiceKey, sale]) => {
    const d = new Date(sale.createdAt);
    const pureDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    arr.push({
      ...sale,
      _dateKey: pureDateKey,          // for UI grouping & sorting
      _firebaseDateKey: parentKey,    // actual Firebase node path
      _invoiceKey: invoiceKey,
    });
  });
});


      setSales(arr);
      setSalesLoaded(true);
    });

    return () => unsub();
  }, []);

  /* ---------- FETCH PARTIES ---------- */
  useEffect(() => {
    const refP = ref(db, "parties");
    return onValue(refP, (snap) => {
      const data = snap.val() || {};
      const map = {};
      Object.entries(data).forEach(([id, p]) => {
        map[id] = { name: p.name || "-", city: p.city || "-" };
      });
      setPartiesMap(map);
    });
  }, []);

  /* ---------- FETCH WAREHOUSES ---------- */
  useEffect(() => {
    const refW = ref(db, "warehouse");
    return onValue(refW, (snap) => {
      const data = snap.val() || {};
      const map = {};
      Object.entries(data).forEach(([id, w]) => {
        map[id] = w.name || "-";
      });
      setWarehousesMap(map);
    });
  }, []);

  /* ---------- FILTER ---------- */
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const q = searchQuery.toLowerCase();
      const party = partiesMap[sale.partyId] || {};

      const saleDate = new Date(sale.createdAt);
      if (fromDate) {
        const f = new Date(fromDate);
        f.setHours(0, 0, 0, 0);
        if (saleDate < f) return false;
      }
      if (toDate) {
        const t = new Date(toDate);
        t.setHours(23, 59, 59, 999);
        if (saleDate > t) return false;
      }

      return (
        sale.invoiceNumber?.toString().includes(q) ||
        party.name?.toLowerCase().includes(q) ||
        party.city?.toLowerCase().includes(q)
      );
    });
  }, [sales, searchQuery, fromDate, toDate, partiesMap]);

  /* ---------- SORT ---------- */
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let aVal, bVal;

      if (sortConfig.key === "party") {
        aVal = partiesMap[a.partyId]?.name || "";
        bVal = partiesMap[b.partyId]?.name || "";
      } else if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortConfig.key === "date") {
        aVal = a._dateKey;
        bVal = b._dateKey;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortConfig, partiesMap]);

  /* ---------- DATE-AWARE PAGINATION ---------- */
  const pages = useMemo(() => {
    const grouped = {};
    sortedSales.forEach((sale) => {
      if (!grouped[sale._dateKey]) grouped[sale._dateKey] = [];
      grouped[sale._dateKey].push(sale);
    });

    const result = [];
    Object.keys(grouped)
      .sort()
      .forEach((dateKey) => {
        const list = grouped[dateKey];
        for (let i = 0; i < list.length; i += ITEMS_PER_PAGE) {
          result.push({ dateKey, invoices: list.slice(i, i + ITEMS_PER_PAGE) });
        }
      });

    return result;
  }, [sortedSales]);

  const totalPages = pages.length;
  const paginatedSales = pages[currentPage - 1]?.invoices || [];

  /* ---------- DEFAULT LAST PAGE ---------- */
  useEffect(() => {
    if (salesLoaded && totalPages > 0) setCurrentPage(totalPages);
  }, [salesLoaded, totalPages]);

  useEffect(() => {
    if (!pageInitialized && salesLoaded && totalPages > 0) {
      setCurrentPage(totalPages);
      setPageInitialized(true);
    }
  }, [salesLoaded, totalPages, pageInitialized]);

  /* ---------- TOTAL ---------- */
  const filteredTotal = round2(
    paginatedSales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((s, i) => s + Number(i.total || 0), 0),
      0
    )
  );

  /* ---------- SORT UI ---------- */
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const renderSortIcon = (key) =>
    sortConfig.key === key ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="inline h-4 w-4 ml-1" />
      ) : (
        <ChevronDown className="inline h-4 w-4 ml-1" />
      )
    ) : null;

  /* ---------- DELETE ---------- */
  const deleteInvoice = async (sale) => {
    setDeleting(true);
    try {
      // 1️⃣ Restore stock first
      for (const item of sale.items) {
        const stockRef = ref(db, `stocks/${item.dateKey}/${item.stockId}`);
        await runTransaction(stockRef, (current) => {
          if (!current) return current;
          const p = Number(current.piecesPerBox) || 1;
          const sold = Number(item.box || 0) * p;
          const total = (current.boxes || 0) * p + (current.pieces || 0);
          const newTotal = total + sold;
          return { ...current, boxes: Math.floor(newTotal / p), pieces: newTotal % p };
        });
      }

      // 2️⃣ Delete invoice using the correct Firebase key
      await set(ref(db, `sales/${sale._firebaseDateKey}/${sale._invoiceKey}`), null);

      setInvoiceToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="absolute left-12 flex gap-2">
          <DatePicker
            selected={fromDate}
            onChange={setFromDate}
            placeholderText="From"
            className="border px-2 py-1 text-sm w-28"
          />
          <DatePicker
            selected={toDate}
            onChange={setToDate}
            placeholderText="To"
            className="border px-2 py-1 text-sm w-28"
          />
        </div>

        <h1 className="text-xl font-semibold">Sales Invoices</h1>

        <Button
          onClick={() => navigate("/sales/create-sales")}
          className="absolute right-0 h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Sales
        </Button>
      </div>

      {/* SEARCH */}
      <div className="flex justify-center relative">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search invoices..."
          className="border rounded px-3 py-2 w-64"
        />
        <Button
          size="sm"
          onClick={() => navigate("/sales/report")}
          className="absolute right-0 h-10"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Sales Report
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 cursor-pointer" onClick={() => handleSort("date")}>
                Date {renderSortIcon("date")}
              </th>
              <th className="border p-2 cursor-pointer" onClick={() => handleSort("invoiceNumber")}>
                Invoice {renderSortIcon("invoiceNumber")}
              </th>
              <th className="border p-2 cursor-pointer" onClick={() => handleSort("party")}>
                Party {renderSortIcon("party")}
              </th>
              <th className="border p-2">Place</th>
              <th className="border p-2">Warehouse</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No invoices found
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => {
                const party = partiesMap[sale.partyId] || {};
                const invoiceTotal = round2(sale.items.reduce((sum, i) => sum + Number(i.total || 0), 0));

                return (
                  <tr key={sale._invoiceKey} className="hover:bg-gray-50">
                    <td className="border p-2">{formatDate(sale.createdAt)}</td>
                    <td
                      className="border p-2 text-blue-600 underline cursor-pointer"
                      onClick={() => navigate("/sales/view-invoice", { state: sale })}
                    >
                      {sale.invoiceNumber}
                    </td>
                    <td className="border p-2">{party.name || "-"}</td>
                    <td className="border p-2">{party.city || "-"}</td>
                    <td className="border p-2">{warehousesMap[sale.warehouseId] || "-"}</td>
                    <td className="border p-2 font-medium">{invoiceTotal.toFixed(2)}</td>
                    <td className="border p-2">
                      {invoiceToDelete?._invoiceKey === sale._invoiceKey ? (
                        <div className="flex gap-2 justify-center items-center">
                          <span>Are you sure?</span>
                          <Button size="sm" variant="destructive" onClick={() => deleteInvoice(sale)} disabled={deleting}>
                            {deleting ? "Deleting..." : "Yes"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setInvoiceToDelete(null)} disabled={deleting}>
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => setInvoiceToDelete(sale)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3">
          <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default SalesScreen;
