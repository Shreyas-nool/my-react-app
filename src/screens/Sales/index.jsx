import React, { useEffect, useState } from "react";
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
import { ref, onValue, set } from "firebase/database";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 20;

const SalesScreen = () => {
  const navigate = useNavigate();

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
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

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
  const deleteInvoice = (sale) => {
    if (!window.confirm("Delete this invoice?")) return;
    const delRef = ref(db, `sales/${sale._dateKey}/${sale._invoiceKey}`);
    set(delRef, null);
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
      <div className="flex justify-center">
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
            className="absolute right-37.5 h-10"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Sales Report
          </Button>
      </div>

      {/* Search 
      <Button
        onClick={() => navigate("/sales/report")}
        className="absolute right-37.5 top-37.5 h-9 text-sm"
      >
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        Sales Report
      </Button> */}

      

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
                  sale.items.reduce(
                    (sum, item) => sum + Number(item.total || 0),
                    0
                  )
                );

                const party = partiesMap[sale.partyId] || {};
                const warehouseName = warehousesMap[sale.warehouseId] || "-";

                return (
                  <tr key={sale._invoiceKey} className="hover:bg-gray-50">
                    <td className="border p-3">
                      {formatDate(sale.createdAt)}
                    </td>
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteInvoice(sale)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
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
