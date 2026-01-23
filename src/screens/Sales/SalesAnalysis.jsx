import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const SalesAnalysis = () => {
  const navigate = useNavigate();  // ✅ IMPORTANT: added navigate
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    const salesRef = ref(db, "sales");

    const unsub = onValue(salesRef, (snap) => {
      const raw = snap.val() || {};

      let totalSales = 0;
      let totalInvoices = 0;

      const categoryMap = {};
      const monthMap = {};

      Object.keys(raw).forEach((dateKey) => {
        Object.values(raw[dateKey]).forEach((invoice) => {
          totalInvoices += 1;
          totalSales += Number(invoice.total || 0);

          const month = dateKey.slice(0, 7); // YYYY-MM
          monthMap[month] = (monthMap[month] || 0) + Number(invoice.total || 0);

          invoice.items?.forEach((item) => {
            const cat = item.category || "Unknown";
            const box = Number(item.box || 0);
            categoryMap[cat] = (categoryMap[cat] || 0) + box;
          });
        });
      });

      const avgInvoice = totalInvoices ? totalSales / totalInvoices : 0;

      setSummary({
        totalSales,
        totalInvoices,
        avgInvoice,
      });

      const categoryChart = Object.entries(categoryMap).map(([cat, boxes]) => ({
        category: cat,
        boxes,
      }));

      const monthlyChart = Object.entries(monthMap)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setCategoryData(categoryChart);
      setMonthlyData(monthlyChart);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Sales Analysis</h1>
        </div>

        <div className="text-center py-16 text-muted-foreground">
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      {/* BACK BUTTON */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-bold">Sales Analysis</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-sm text-muted-foreground">Total Sales</h2>
          <p className="text-xl font-bold">₹{summary.totalSales}</p>
        </div>

        <div className="p-4 border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-sm text-muted-foreground">Total Invoices</h2>
          <p className="text-xl font-bold">{summary.totalInvoices}</p>
        </div>

        <div className="p-4 border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-sm text-muted-foreground">Avg per Invoice</h2>
          <p className="text-xl font-bold">
            ₹{summary.avgInvoice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Category Chart */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Category Wise Sales (Boxes)</h2>

        {/* ✅ IMPORTANT: fixed height so Recharts doesn't warn */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="boxes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div>
        <h2 className="font-semibold mb-2">Monthly Sales Trend</h2>

        {/* ✅ IMPORTANT: fixed height so Recharts doesn't warn */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;
