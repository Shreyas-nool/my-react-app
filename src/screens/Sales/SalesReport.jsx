import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Boxes, ChartBar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SalesReport = () => {
  const navigate = useNavigate();

  // Load saved date from localStorage
  const savedDate = localStorage.getItem("salesReportDate");
  const initialDate = savedDate ? new Date(savedDate) : new Date();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [categories, setCategories] = useState([]);
  const [totalsMap, setTotalsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const getLocalDateKey = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Save selected date to localStorage
  useEffect(() => {
    localStorage.setItem("salesReportDate", selectedDate.toISOString());
  }, [selectedDate]);

  /* ---------- FETCH CATEGORIES & TOTALS ---------- */
  useEffect(() => {
    setLoading(true);

    const selectedDateKey = getLocalDateKey(selectedDate);
    const salesRef = ref(db, "sales");

    const unsub = onValue(salesRef, (snap) => {
      const data = snap.val() || {};

      const catSet = new Set();
      const totals = {};

      Object.values(data).forEach((timeNode) => {
        Object.values(timeNode).forEach((invoice) => {
          if (!invoice?.items || !invoice.createdAt) return;

          const invoiceDateKey = getLocalDateKey(invoice.createdAt);
          if (invoiceDateKey !== selectedDateKey) return;

          invoice.items.forEach((item) => {
            const cat = item.category;
            const box = Number(item.box) || 0;

            catSet.add(cat);
            totals[cat] = (totals[cat] || 0) + box;
          });
        });
      });

      setCategories(Array.from(catSet));
      setTotalsMap(totals);
      setLoading(false);
    });

    return () => unsub();
  }, [selectedDate]);

  return (
    <div className="flex flex-col max-w-6xl mx-auto mt-6 min-h-screen p-4 space-y-6">
      {/* Header */}
      <header className="relative border-b pb-2 flex items-center justify-between">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title */}
        <h1 className="text-xl font-semibold tracking-wide">
          Sales Report
        </h1>

        {/* Yearly Graph Button */}
        <Button
          onClick={() => navigate("/sales/report/yearly-graph")}
          className="h-9 flex items-center gap-2"
        >
          <ChartBar className="h-4 w-4" />
          Yearly Graph
        </Button>

        <Button
          onClick={() => navigate("/sales/analysis")}
          className="h-9"
        >
          Sales Analysis
        </Button>
      </header>

      {/* Date Picker Card */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <span className="text-sm text-muted-foreground">Select Date</span>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            dateFormat="dd-MM-yyyy"
            className="border px-3 py-2 rounded-md"
          />
        </div>
      </div>

      {/* Category Cards */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No sales for this date
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() =>
                navigate("/sales/report/category", {
                  state: {
                    category: cat,
                    date: getLocalDateKey(selectedDate),
                  },
                })
              }
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Boxes className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{cat}</h3>
                  <p className="text-sm text-muted-foreground">
                    Total Boxes: <span className="font-medium">{totalsMap[cat] || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesReport;
