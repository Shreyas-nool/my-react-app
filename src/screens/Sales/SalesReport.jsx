import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Boxes } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SalesReport = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState([]);
  const [totalsMap, setTotalsMap] = useState({}); // category -> total boxes
  const [loading, setLoading] = useState(true);

  const getLocalDateKey = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  /* ---------- FETCH CATEGORIES BY DATE ---------- */
  useEffect(() => {
    const salesRef = ref(db, "sales");
    const selectedDateStr = getLocalDateKey(selectedDate);

    const unsub = onValue(salesRef, (snapshot) => {
      setLoading(true);
      const data = snapshot.val();

      if (!data) {
        setCategories([]);
        setTotalsMap({});
        setLoading(false);
        return;
      }

      const catSet = new Set();
      const totals = {}; // temp totals per category

      Object.values(data).forEach((timeNode) => {
        Object.values(timeNode || {}).forEach((invoice) => {
          if (!invoice?.createdAt || !invoice.items) return;

          const invoiceDate = getLocalDateKey(invoice.createdAt);

          if (invoiceDate !== selectedDateStr) return;

          invoice.items.forEach((item) => {
            if (!item.category) return;
            catSet.add(item.category);
            const boxes = Number(item.box || 0);
            totals[item.category] = (totals[item.category] || 0) + boxes;
          });
        });
      });

      setCategories([...catSet]);
      setTotalsMap(totals);
      setLoading(false);
    });

    return () => unsub();
  }, [selectedDate]);

  return (
    <div className="flex flex-col max-w-6xl mx-auto mt-6 min-h-screen p-4 space-y-6">
      {/* Header */}
      <header className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute left-0 h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Sales Report</h1>
      </header>

      {/* Date Picker */}
      <div className="flex justify-center">
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="dd-MM-yyyy"
          className="border px-3 py-2 rounded"
        />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() =>
                navigate("/sales/report/category", {
                  state: {
                    category: cat,
                    date: selectedDate.toISOString().slice(0, 10),
                  },
                })
              }
              className="cursor-pointer rounded-xl border border-border/40 bg-card p-4 shadow-sm hover:shadow-md hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                  <Boxes className="h-6 w-6 text-primary" />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold leading-tight">
                    {cat}
                  </h3>
                  <span className="text-sm text-muted-foreground mt-1">
                    Total Boxes: {totalsMap[cat] || 0}
                  </span>
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
