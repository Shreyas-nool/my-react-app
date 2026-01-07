import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Plus,
  Warehouse,
  Boxes,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const WareHouse = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [stockMap, setStockMap] = useState({}); // { warehouseName: totalBoxes }
  const [transferRecords, setTransferRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferRecords, setShowTransferRecords] = useState(false);
  const [filterDate, setFilterDate] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  /* ---------- Load Warehouses ---------- */
  useEffect(() => {
    const warehouseRef = ref(db, "warehouse");
    onValue(warehouseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const array = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setWarehouses(array);
      } else {
        setWarehouses([]);
      }
      setLoading(false);
    });
  }, []);

  /* ---------- Load Stock ---------- */
  useEffect(() => {
    const stockRef = ref(db, "stocks");
    onValue(stockRef, (snapshot) => {
      const map = {};
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.values(data).forEach((dateGroup) => {
          Object.values(dateGroup).forEach((item) => {
            if (!item.warehouse) return;
            map[item.warehouse] =
              (map[item.warehouse] || 0) + Number(item.boxes || 0);
          });
        });
      }
      setStockMap(map);
    });
  }, []);

  /* ---------- Load Transfer Records from wentry ---------- */
  useEffect(() => {
    const wentryRef = ref(db, "wentry");
    onValue(wentryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let records = [];

        // Iterate over each warehouse
        Object.entries(data).forEach(([warehouseName, entries]) => {
          Object.values(entries).forEach((entry) => {
            records.push({ ...entry, warehouseName });
          });
        });

        // Sort by createdAt descending
        records.sort((a, b) => b.createdAt - a.createdAt);

        // Remove duplicates by ID if present
        const uniqueRecords = Array.from(
          new Map(records.map((r) => [r.createdAt, r])).values()
        );
        setTransferRecords(uniqueRecords);
      } else {
        setTransferRecords([]);
      }
    });
  }, []);

  // Reset page when filter changes
  useEffect(() => setCurrentPage(1), [filterDate]);

  // Filter by date
  const filteredRecords = transferRecords.filter((r) => {
    if (!filterDate) return true;
    const recordDate = new Date(r.date);
    return (
      recordDate.getDate() === filterDate.getDate() &&
      recordDate.getMonth() === filterDate.getMonth() &&
      recordDate.getFullYear() === filterDate.getFullYear()
    );
  });

  // Total boxes for filtered records
  const totalBoxesFiltered = filteredRecords.reduce(
    (acc, r) => acc + Number(r.boxes || 0),
    0
  );

  // Pagination
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);

  // Format date DD MM YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd} ${mm} ${yyyy}`;
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-6 sm:mt-10 min-h-screen bg-background p-2 sm:p-4 space-y-6 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 text-center text-2xl sm:text-2xl font-semibold">
          All Warehouses
        </h1>
        <div className="hidden sm:flex gap-3">
          <Button
            onClick={() => navigate("/warehouse/add-warehouse")}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Warehouse
          </Button>
          <Button
            onClick={() => navigate("/warehouse/transfer-stock")}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Transfer Stock
          </Button>
        </div>
      </header>

      {/* Mobile Buttons */}
      <div className="flex flex-col sm:hidden gap-3">
        <Button
          onClick={() => navigate("/warehouse/add-warehouse")}
          className="w-full text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Warehouse
        </Button>
        <Button
          onClick={() => navigate("/warehouse/transfer-stock")}
          className="w-full text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Transfer Stock
        </Button>
      </div>

      {/* Warehouse Cards */}
      <main className="flex-1 overflow-y-auto pb-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading warehouses...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No warehouses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {warehouses.map((w) => (
              <div
                key={w.id}
                onClick={() =>
                  navigate("/stock", { state: { warehouseName: w.name } })
                }
                className="cursor-pointer rounded-xl border border-border/40 bg-card p-4 shadow-sm hover:shadow-md hover:bg-muted/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                    <Warehouse className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold leading-tight">{w.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Boxes className="h-3 w-3" />
                      {stockMap[w.name] || 0} boxes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transfer Stock Records Toggle + Date Picker */}
        <div className="mt-8 flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTransferRecords(!showTransferRecords)}
              className="flex items-center justify-between flex-1"
            >
              <span className="text-sm sm:text-base font-medium">
                Transfer Stock Records
              </span>
              {showTransferRecords ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {/* Inline Date Picker */}
            {showTransferRecords && (
              <DatePicker
                selected={filterDate}
                onChange={(date) => setFilterDate(date)}
                dateFormat="dd MM yyyy"
                isClearable
                placeholderText="Select date"
                className="border px-2 py-1 rounded"
              />
            )}
          </div>

          {/* Table & Total Boxes */}
          {showTransferRecords && (
            <div className="mt-4">
              <div className="mb-2 font-semibold">
                Total Boxes: {totalBoxesFiltered}
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-300">
                <table className="w-full table-auto border-collapse text-center">
                  <thead>
                    <tr className="bg-gray-100 sm:text-base">
                      <th className="border text-xl p-2">Date</th>
                      <th className="border text-xl p-2">From</th>
                      <th className="border text-xl p-2">To</th>
                      <th className="border text-xl p-2">Category</th>
                      <th className="border text-xl p-2">Product</th>
                      <th className="border text-xl p-2">Boxes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-4">
                          No stock transfers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((r) => (
                        <tr
                          key={r.createdAt}
                          className="hover:bg-gray-50 text-sm sm:text-base"
                        >
                          <td className="border p-2">{formatDate(r.date)}</td>
                          <td className="border p-2">{r.from}</td>
                          <td className="border p-2">{r.to}</td>
                          <td className="border p-2">{r.category}</td>
                          <td className="border p-2">{r.product}</td>
                          <td className="border p-2">{r.boxes}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                      Prev
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WareHouse;
