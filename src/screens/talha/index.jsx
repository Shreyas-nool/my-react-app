// src/screens/talha/TalhaPurchases.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

const TalhaPurchases = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);

  const BANK_NAME = "Talha";

  useEffect(() => {
    const purchasesRef = ref(db, "phurchase/Talha");
    const paymentsRef = ref(db, "payments");

    const unsubscribe = onValue(purchasesRef, (purchaseSnap) => {
      const purchaseData = purchaseSnap.val() || {};

      onValue(paymentsRef, (paymentSnap) => {
        const paymentsData = paymentSnap.val() || {};

        const tempEntries = [];
        let pending = 0;

        // --- Process Purchases ---
        Object.entries(purchaseData).forEach(([date, purchasesByDate]) => {
          Object.entries(purchasesByDate).forEach(([purchaseKey, p]) => {
            const amount = Number(p.amountINR || 0);
            pending += amount;
            tempEntries.push({
              date: p.date || date,
              party: p.party || "Talha",
              amount,
              notes: p.notes || "-",
              key: purchaseKey,
              typeLabel: "Purchase",
            });
          });
        });

        // --- Process Payments (Scan all nodes) ---
        Object.values(paymentsData).forEach((partyNode) => {
          if (typeof partyNode !== "object") return;
          Object.values(partyNode).forEach((dateNode) => {
            if (typeof dateNode !== "object") return;
            Object.values(dateNode).forEach((p) => {
              // Only consider payments **to Talha**
              if (p.toType === "bank" && p.toName === BANK_NAME && Number(p.amount)) {
                const amount = Number(p.amount);
                pending -= amount;
                tempEntries.push({
                  date: p.date || "-",
                  party: p.fromName || "Payment",
                  amount: -amount,
                  notes: p.notes || "-",
                  key: `payment-${p.createdAt || Math.random()}`,
                  typeLabel: "Payment",
                });
              }
            });
          });
        });

        // Sort newest first
        tempEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        setEntries(tempEntries);
        setBalance(pending);
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft />
        </Button>

        <h1 className="text-lg font-semibold">Talha</h1>

        <Button
          className="bg-black text-white"
          onClick={() => navigate("/talha/add-purchase")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Purchase
        </Button>
      </header>

      {/* Total Pending */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <h2 className="text-xl font-bold">{balance}</h2>
      </div>

      {/* Purchases & Payments Table */}
      <div className="bg-white rounded-xl shadow border p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e, i) => (
                <TableRow key={e.key}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>{e.typeLabel}</TableCell>
                  <TableCell
                    className={
                      e.typeLabel === "Payment"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {e.amount}
                  </TableCell>
                  <TableCell>{e.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TalhaPurchases;
