import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

const StockScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const warehouseFilter = location.state?.warehouseName || null;

  const [stock, setStock] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  /* ---------- Helpers ---------- */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const round2 = (num) =>
    Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  /* ---------- Load Stock with Live Auto-delete ---------- */
  useEffect(() => {
    const stockRef = ref(db, "stocks");

    const unsubscribe = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setStock([]);
        setCategories([]);
        return;
      }

      const finalList = [];
      const catSet = new Set();

      Object.entries(data).forEach(([dateKey, items]) => {
        Object.entries(items).forEach(([id, item]) => {
          if (Number(item.boxes || 0) <= 0) {
            const itemRef = ref(db, `stocks/${dateKey}/${id}`);
            set(itemRef, null);
            return;
          }

          if (!warehouseFilter || item.warehouse === warehouseFilter) {
            finalList.push({
              _firebaseId: id,
              dateKey,
              ...item,
            });
            if (item.category) catSet.add(item.category);
          }
        });
      });

      setStock(finalList);
      setCategories(["ALL", ...Array.from(catSet)]);
    });

    return () => unsubscribe();
  }, [warehouseFilter]);

  /* ---------- Delete Stock ---------- */
  const deleteStock = (item) => {
    if (!window.confirm("Delete this stock item?")) return;
    const delRef = ref(db, `stocks/${item.dateKey}/${item._firebaseId}`);
    set(delRef, null);
  };

  /* ---------- Filters ---------- */
  const filteredStock = stock.filter((s) => {
    const matchesCategory =
      activeCategory === "ALL" || s.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      s.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  /* ---------- Sorting ---------- */
  const sortedStock = [...filteredStock].sort((a, b) => {
    let aVal, bVal;
    if (sortConfig.key === "productName") {
      aVal = a.productName || "";
      bVal = b.productName || "";
    } else if (sortConfig.key === "date") {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    } else if (sortConfig.key === "totalValue") {
      const aTotal =
        (Number(a.boxes) * Number(a.piecesPerBox) || 0) *
        Number(a.pricePerPiece || 0);
      const bTotal =
        (Number(b.boxes) * Number(b.piecesPerBox) || 0) *
        Number(b.pricePerPiece || 0);
      aVal = aTotal;
      bVal = bTotal;
    } else {
      aVal = a[sortConfig.key] || 0;
      bVal = b[sortConfig.key] || 0;
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

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-center">
          {warehouseFilter ? `${warehouseFilter} Stock` : "Stock"}
        </h1>
        <Button
          onClick={() => navigate("/stock/create-stock")}
          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Stock
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1 rounded-full text-sm font-medium border ${
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex justify-center gap-4">
        <input
          type="text"
          placeholder="Search product or category..."
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
              <th
                className="border p-2 cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date {renderSortIcon("date")}
              </th>
              <th className="border p-2">Category</th>
              <th
                className="border p-2 cursor-pointer"
                onClick={() => handleSort("productName")}
              >
                Product {renderSortIcon("productName")}
              </th>
              <th className="border p-2">Boxes</th>
              <th className="border p-2">Pcs/Box</th>
              <th className="border p-2">Warehouse</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedStock.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6">
                  No stock found.
                </td>
              </tr>
            ) : (
              sortedStock.map((item) => (
                <tr key={item._firebaseId} className="hover:bg-gray-50">
                  <td className="border p-2">{formatDate(item.date)}</td>
                  <td className="border p-2">{item.category}</td>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">{item.boxes}</td>
                  <td className="border p-2">{item.piecesPerBox}</td>
                  <td className="border p-2">{item.warehouse || "-"}</td>
                  <td className="border p-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteStock(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockScreen;
