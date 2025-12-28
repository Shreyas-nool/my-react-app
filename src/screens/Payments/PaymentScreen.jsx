import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { getDatabase, ref, onValue } from "firebase/database";

export default function PaymentScreen() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const db = getDatabase();
    const paymentsRef = ref(db, "payments");

    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setPayments([]);
        return;
      }

      const data = snapshot.val();
      let list = [];

      Object.keys(data).forEach((party) => {
        Object.keys(data[party]).forEach((date) => {
          Object.keys(data[party][date]).forEach((key) => {
            const p = data[party][date][key];

            list.push({
              id: key,
              date,
              from: p.fromName,
              to: p.toName,
              amount: Number(p.amount).toFixed(2),
              note: p.note || "-",
              createdAt: p.createdAt || "",
              type: `${p.fromType?.[0]?.toUpperCase() || "?"} - ${
                p.toType?.[0]?.toUpperCase() || "?"
              }`,
            });
          });
        });
      });

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPayments(list);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}/${
      (date.getMonth() + 1).toString().padStart(2, "0")
    }/${date.getFullYear()}`;
  };

  const filteredPayments = filterDate
    ? payments.filter((p) => p.date === filterDate)
    : payments;

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
        <input
          type="date"
          className="border rounded px-3 py-1 text-sm"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <main className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>

          <CardContent>
            {filteredPayments.length === 0 ? (
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
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-2">{formatDate(p.date)}</td>
                        <td className="px-4 py-2">{p.from}</td>
                        <td className="px-4 py-2">{p.to}</td>
                        <td className="px-4 py-2 font-medium">{p.type}</td>
                        <td className="px-4 py-2 font-semibold">{p.amount}</td>
                        <td className="px-4 py-2">{p.note}</td>
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
