import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SalesScreen = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [partiesMap, setPartiesMap] = useState({}); // partyId -> partyName
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

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
    const unsubscribe = onValue(salesRef, (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  /* ---------- Fetch Parties (FIXED) ---------- */
  useEffect(() => {
    const partyRef = ref(db, "parties");
    const unsubscribe = onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPartiesMap({});
        return;
      }

      const map = {};
      Object.entries(data).forEach(([id, details]) => {
        map[id] = details.name || "-";
      });

      setPartiesMap(map);
    });

    return () => unsubscribe();
  }, []);

  /* ---------- Filters ---------- */
  const filteredSales = sales.filter((sale) => {
    const q = searchQuery.toLowerCase();
    const partyName = partiesMap[sale.partyId]?.toLowerCase() || "";

    const matchesSearch =
      sale.invoiceNumber?.toString().includes(q) ||
      partyName.includes(q);

    const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const matchesDate = selectedDate
    ? isSameDate(new Date(sale.createdAt), selectedDate)
    : true;

    return matchesSearch && matchesDate;
  });

  /* ---------- Sorting ---------- */
  const sortedSales = [...filteredSales].sort((a, b) => {
    let aVal, bVal;

    if (sortConfig.key === "party") {
      aVal = partiesMap[a.partyId] || "";
      bVal = partiesMap[b.partyId] || "";
    } else if (sortConfig.key === "createdAt") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

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
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title */}
        <h1 className="text-xl font-semibold text-center">Sales Invoices</h1>

        {/* Create Sales Button */}
        <Button
          onClick={() => navigate("/sales/create-sales")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 h-9 text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Sales
        </Button>
      </div>


      {/* Filters */}
      <div className="flex justify-center gap-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd-MM-yyyy"
          placeholderText="Select date"
          className="border border-gray-400 rounded px-3 py-2 text-base text-center"
          isClearable
        />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2 text-base w-60"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-base">
              <th className="border p-3 cursor-pointer" onClick={() => handleSort("createdAt")}>
                Invoice Date {renderSortIcon("createdAt")}
              </th>
              <th className="border p-3 cursor-pointer" onClick={() => handleSort("invoiceNumber")}>
                Invoice No {renderSortIcon("invoiceNumber")}
              </th>
              <th className="border p-3 cursor-pointer" onClick={() => handleSort("party")}>
                Party {renderSortIcon("party")}
              </th>
              <th className="border p-3">Total</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedSales.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6">
                  No invoices found.
                </td>
              </tr>
            ) : (
              sortedSales.map((sale) => {
                const totalAmount = round2(
                  sale.items.reduce(
                    (sum, item) => sum + Number(item.total || 0),
                    0
                  )
                );

                return (
                  <tr key={sale._invoiceKey} className="hover:bg-gray-50 text-base">
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
                    <td className="border p-3">
                      {partiesMap[sale.partyId] || "-"}
                    </td>
                    <td className="border p-3">
                      {totalAmount.toFixed(2)}
                    </td>
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
    </div>
  );
};

export default SalesScreen;
