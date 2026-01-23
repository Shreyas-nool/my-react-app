import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CategoryYearGraphReport = ({ year }) => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]); // ALL categories
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedYear) return;

    setLoading(true);
    setError(null);

    const salesRef = ref(db, "sales");
    const catRef = ref(db, "categories");

    // Fetch categories
    const unsubCat = onValue(catRef, (snap) => {
      const rawCats = snap.val() || {};
      const list = Object.values(rawCats).map((c) => c.name);
      setCategories(list);
    });

    // Fetch sales
    const unsubSales = onValue(
      salesRef,
      (snap) => {
        const raw = snap.val() || {};
        const categoryMap = {};

        Object.keys(raw).forEach((dateKey) => {
          const saleYear = dateKey.split("-")[0];
          if (saleYear !== String(selectedYear)) return;

          Object.values(raw[dateKey]).forEach((invoice) => {
            const items = invoice.items || [];
            items.forEach((item) => {
              const cat = item.category || "Unknown";
              const box = Number(item.box || 0);

              if (!categoryMap[cat]) categoryMap[cat] = 0;
              categoryMap[cat] += box;
            });
          });
        });

        const chartData = Object.entries(categoryMap)
          .map(([cat, boxes]) => ({ category: cat, boxes }))
          .sort((a, b) => b.boxes - a.boxes);

        setData(chartData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubCat();
      unsubSales();
    };
  }, [selectedYear]);

  // categories NOT sold
  const notSold = useMemo(() => {
    const soldSet = new Set(data.map((d) => d.category));
    return categories.filter((c) => !soldSet.has(c));
  }, [categories, data]);

  const csvData = useMemo(() => {
    if (!data.length) return "";

    const header = "Category,Boxes\n";
    const rows = data.map((d) => `${d.category},${d.boxes}`).join("\n");

    return header + rows;
  }, [data]);

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category_year_report_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-2xl font-bold">
            Yearly Category Sales Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>

          <Button
            variant="outline"
            onClick={downloadCSV}
            disabled={!data.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline" onClick={() => setSelectedYear(selectedYear)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Chart + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 rounded-xl border bg-card p-4 shadow-sm">
          {loading ? (
            <div className="text-center py-24 text-muted-foreground">
              Loading data...
            </div>
          ) : error ? (
            <div className="text-center py-24 text-red-600">
              {error}
            </div>
          ) : !data.length ? (
            <div className="text-center py-24 text-muted-foreground">
              No sales found for {selectedYear}
            </div>
          ) : (
            <div className="w-full h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="boxes" fill="#4f46e5" animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sidebar - NOT SOLD */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Categories NOT Sold</h2>
          {notSold.length === 0 ? (
            <p className="text-muted-foreground">All categories sold in this year.</p>
          ) : (
            <ul className="space-y-2">
              {notSold.map((c) => (
                <li key={c} className="border rounded p-2 bg-muted/50">
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryYearGraphReport;
