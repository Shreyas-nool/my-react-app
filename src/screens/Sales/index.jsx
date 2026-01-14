import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

const [invoiceToDelete, setInvoiceToDelete] = useState(null); // the invoice user wants to delete
const [deleteMessage, setDeleteMessage] = useState(""); // success or error message
const [deleting, setDeleting] = useState(false); // loading state

  const [salesLoaded, setSalesLoaded] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [sales, setSales] = useState([]);
  const [partiesMap, setPartiesMap] = useState({});
  const [warehousesMap, setWarehousesMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const round2 = (num) =>
    Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  /* ---------- Fetch Sales ---------- */
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
      Object.entries(data).forEach(([dateKey, invoices]) => {
        Object.entries(invoices).forEach(([invoiceKey, sale]) => {
          arr.push({
            ...sale,
            _dateKey: dateKey,
            _invoiceKey: invoiceKey,
          });
        });
      });

      setSales(arr);
      setSalesLoaded(true);
    });

    return () => unsub();
  }, []);

  /* ---------- Fetch Parties ---------- */
  useEffect(() => {
    const partyRef = ref(db, "parties");
    const unsub = onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPartiesMap({});
        return;
      }
      const map = {};
      Object.entries(data).forEach(([id, details]) => {
        map[id] = {
          name: details.name || "-",
          city: details.city || "-",
        };
      });
      setPartiesMap(map);
    });
    return () => unsub();
  }, []);

  /* ---------- Fetch Warehouses ---------- */
  useEffect(() => {
    const whRef = ref(db, "warehouse");
    const unsub = onValue(whRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setWarehousesMap({});
        return;
      }
      const map = {};
      Object.entries(data).forEach(([id, details]) => {
        map[id] = details.name || "-";
      });
      setWarehousesMap(map);
    });
    return () => unsub();
  }, []);

  /* ---------- Filters ---------- */
  const filteredSales = sales.filter((sale) => {
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

  /* ---------- Sorting ---------- */
  const sortedSales = [...filteredSales].sort((a, b) => {
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

  /* ---------- Pagination ---------- */
  const totalPages = Math.ceil(sortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = sortedSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages]);

  useEffect(() => {
  if (salesLoaded && totalPages > 0) {
    setCurrentPage(totalPages);
  }
}, [salesLoaded, totalPages]);


  /* ---------- Totals ---------- */
  const filteredTotal = round2(
    sortedSales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((s, i) => s + Number(i.total || 0), 0),
      0
    )
  );

  /* ---------- Sort UI ---------- */
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  /* ---------- Delete ---------- */
  const deleteInvoice = async (sale) => {
  setDeleting(true);
  setDeleteMessage(""); // clear previous messages

  try {
    for (const item of sale.items) {
      const stockRef = ref(db, `stocks/${item.dateKey}/${item.stockId}`);
      await runTransaction(stockRef, (current) => {
        if (!current) return current;
        const piecesPerBox = Number(current.piecesPerBox) || 1;
        const soldPieces = Number(item.box || 0) * piecesPerBox;
        const currentTotalPieces =
          (Number(current.boxes) || 0) * piecesPerBox +
          (Number(current.pieces) || 0);
        const newTotalPieces = currentTotalPieces + soldPieces;
        return {
          ...current,
          boxes: Math.floor(newTotalPieces / piecesPerBox),
          pieces: newTotalPieces % piecesPerBox,
        };
      });
    }

    const delRef = ref(db, `sales/${sale._dateKey}/${sale._invoiceKey}`);
    await set(delRef, null);

    setDeleteMessage("✅ Sale deleted and stock restored!");
    setInvoiceToDelete(null);
  } catch (err) {
    console.error(err);
    setDeleteMessage("❌ Error deleting sale. Try again.");
  } finally {
    setDeleting(false);
  }
};


  /* ---------- UI ---------- */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Date Pickers */}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 flex gap-2">
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            placeholderText="From Date"
            dateFormat="dd/MM/yyyy"
            className="border rounded px-2 py-1 text-sm w-28"
            maxDate={toDate || new Date()}
          />
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            placeholderText="To Date"
            dateFormat="dd/MM/yyyy"
            className="border rounded px-2 py-1 text-sm w-28"
            minDate={fromDate}
            maxDate={new Date()}
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

      {/* Search */}
      <div className="flex justify-center relative">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2 w-64"
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="border p-3 cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date {renderSortIcon("date")}
              </th>
              <th
                className="border p-3 cursor-pointer"
                onClick={() => handleSort("invoiceNumber")}
              >
                Invoice No {renderSortIcon("invoiceNumber")}
              </th>
              <th
                className="border p-3 cursor-pointer"
                onClick={() => handleSort("party")}
              >
                Party {renderSortIcon("party")}
              </th>
              <th className="border p-3">Place</th>
              <th className="border p-3">Warehouse</th>
              <th className="border p-3">Total</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6">
                  No invoices found.
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => {
                const totalAmount = round2(
                  sale.items.reduce((sum, item) => sum + Number(item.total || 0), 0)
                );

                const party = partiesMap[sale.partyId] || {};
                const warehouseName = warehousesMap[sale.warehouseId] || "-";

                return (
                  <tr key={sale._invoiceKey} className="hover:bg-gray-50">
                    <td className="border p-3">{formatDate(sale.createdAt)}</td>
                    <td className="border p-3">
                      <button
                        className="text-blue-600 underline"
                        onClick={() =>
                          navigate("/sales/view-invoice", { state: sale })
                        }
                      >
                        {sale.invoiceNumber}
                      </button>
                    </td>
                    <td className="border p-3">{party.name || "-"}</td>
                    <td className="border p-3">{party.city || "-"}</td>
                    <td className="border p-3">{warehouseName}</td>
                    <td className="border p-3">{totalAmount.toFixed(2)}</td>
                    <td className="border p-3">
                      {invoiceToDelete?._invoiceKey === sale._invoiceKey ? (
                        <div className="flex gap-2 justify-center items-center">
                          <span>Are you sure?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteInvoice(sale)}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Yes"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInvoiceToDelete(null)}
                            disabled={deleting}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setInvoiceToDelete(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Total */}
          {paginatedSales.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="border p-3 text-right">
                  Total Amount:
                </td>
                <td className="border p-3">{filteredTotal.toFixed(2)}</td>
                <td className="border p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="px-3 py-1 border rounded">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default SalesScreen;
