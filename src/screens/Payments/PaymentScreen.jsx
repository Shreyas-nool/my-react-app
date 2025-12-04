import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

import { getDatabase, ref, onValue } from "firebase/database";

export default function PaymentScreen() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const paymentsRef = ref(db, "payments");

    // Live listener → updates instantly when data changes
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));

        // Sort by date (latest first)
        list.sort((a, b) => new Date(b.date) - new Date(a.date));

        setPayments(list);
      } else {
        setPayments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-2 sm:p-4 space-y-4 overflow-hidden">

      {/* HEADER */}
      <header className="flex items-center justify-between py-2 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Payments</h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        <Button
          onClick={() => navigate("/payment/add")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:block">Add Payment</span>
        </Button>
      </header>

      {/* PAYMENT TABLE */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Payment Records
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {payments.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                No payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Party</th>
                      <th className="px-4 py-3">Amount (₹)</th>
                      <th className="px-4 py-3">Method</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((p, index) => (
                      <tr key={p.id} className="border-b hover:bg-accent/40">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{p.date}</td>
                        <td className="px-4 py-3">{p.party}</td>
                        <td className="px-4 py-3">₹{p.amount}</td>
                        <td className="px-4 py-3">{p.bank}</td>
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
