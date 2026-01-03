import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function PaymentScreen() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  /* ================= LOAD PAYMENTS ================= */
  useEffect(() => {
    const db = getDatabase();
    const paymentsRef = ref(db, "payments");

    const unsub = onValue(paymentsRef, (snapshot) => {
      const map = new Map(); // txnId -> payment

      if (snapshot.exists()) {
        const data = snapshot.val();

        Object.entries(data).forEach(([type, names]) => {
          Object.entries(names).forEach(([name, dates]) => {
            Object.entries(dates).forEach(([date, items]) => {
              Object.entries(items).forEach(([txnId, p]) => {
                if (!p || !p.txnId) return;

                // ✅ DEDUPE BY txnId
                if (map.has(p.txnId)) return;

                map.set(p.txnId, {
                  id: p.txnId,
                  path: `payments/${type}/${name}/${date}/${txnId}`,
                  date: p.date,
                  from: p.fromName || "-",
                  to: p.toName || "-",
                  amount: Number(p.amount),
                  note: p.note || "-",
                  createdAt: p.createdAt || 0,
                  type: `${p.fromType?.[0]?.toUpperCase()} - ${p.toType?.[0]?.toUpperCase()}`,
                });
              });
            });
          });
        });
      }

      setPayments(Array.from(map.values()));
    });

    return () => unsub();
  }, []);

  /* ================= HELPERS ================= */

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const filteredPayments = filterDate
    ? payments.filter((p) => p.date === filterDate)
    : payments;

  const sortedPayments = [...filteredPayments].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const handleDelete = async (path) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const db = getDatabase();
      await remove(ref(db, path));
      alert("Entry deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting entry");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-2 sm:p-4 space-y-4 overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center justify-between py-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg sm:text-xl font-semibold">Payments</h1>

        <Button
          onClick={() => navigate("/payment/add")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:block">Add</span>
        </Button>
      </header>

      {/* FILTER */}
      <div className="flex justify-end">
        <DatePicker
          selected={filterDate ? new Date(filterDate) : null}
          onChange={(date) => setFilterDate(date ? date.toISOString().split("T")[0] : "")}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select date"
          className="border rounded px-3 py-1 text-sm"
        />
      </div>

      {/* TABLE */}
      <main className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>

          <CardContent>
            {sortedPayments.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                No payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm text-center">
                  <thead className="bg-muted text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">From</th>
                      <th className="px-4 py-2">To</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Notes</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedPayments.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-2">{formatDate(p.date)}</td>
                        <td className="px-4 py-2">{p.from}</td>
                        <td className="px-4 py-2">{p.to}</td>
                        <td className="px-4 py-2 font-medium">{p.type}</td>
                        <td className="px-4 py-2 font-semibold">
                          {p.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{p.note}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDelete(p.path)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
