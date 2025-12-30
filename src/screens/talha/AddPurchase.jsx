// src/screens/talha/AddPurchase.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, push, onValue, off, serverTimestamp } from "firebase/database";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function AddPurchase() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountINR, setAmountINR] = useState("");
  const [notes, setNotes] = useState("");
  const [balance, setBalance] = useState(0);

  const BANK_NAME = "Talha";

  // Helper → always show 2 decimals
  const formatAmount = (num) => Number(num).toFixed(2);

  // --------------------------
  // FETCH CURRENT BALANCE (PURCHASES - PAYMENTS)
  // --------------------------
  useEffect(() => {
    const purchaseRef = ref(db, "phurchase/Talha");
    const paymentRef = ref(db, "payments");

    const calculateBalance = (purchaseSnap, paymentSnap) => {
      const purchases = purchaseSnap.val() || {};
      const payments = paymentSnap.val() || {};

      let total = 0;

      // ---------------- Purchases subtract ----------------
      Object.values(purchases).forEach((dateNode) => {
        Object.values(dateNode || {}).forEach((p) => {
          total -= Number(p.amountINR || 0); // Deduct purchase
        });
      });

      // ---------------- Payments add ----------------
      Object.values(payments).forEach((partyNode) => {
        Object.values(partyNode || {}).forEach((dateNode) => {
          Object.values(dateNode || {}).forEach((p) => {
            if (p.toType === "account" && p.toName === BANK_NAME) {
              total += Number(p.amount || 0); // Add payment
            }
          });
        });
      });

      // Round to 2 decimals
      total = Math.round((total + Number.EPSILON) * 100) / 100;

      setBalance(total);
    };

    const unsubPurchases = onValue(purchaseRef, (pSnap) => {
      onValue(paymentRef, (paySnap) => {
        calculateBalance(pSnap, paySnap);
      });
    });

    return () => {
      off(purchaseRef);
      off(paymentRef);
    };
  }, []);

  // --------------------------
  // SUBMIT HANDLER
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amountINR || Number(amountINR) <= 0) {
      toast.error("Please enter a valid INR amount");
      return;
    }

    const newPurchase = {
      party: "Talha Purchase",
      date,
      bank: BANK_NAME + " - Online",
      amountINR: Number(amountINR),
      notes,
      createdAt: serverTimestamp(), // saves exact timestamp with time
    };

    try {
      const dateRef = ref(db, `phurchase/Talha/${date}`);
      await push(dateRef, newPurchase);

      toast.success("✅ Purchase recorded successfully");
      navigate("/talha");
    } catch (err) {
      console.error(err);
      toast.error("Error recording purchase");
    }
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6 bg-background">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/talha")}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground/90">Add Purchase</h1>
      </header>

      {/* Current Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-gray-800 font-semibold text-lg">
        Current Balance: {formatAmount(balance)}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 border border-gray-100"
      >
        {/* Date */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Amount in INR */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Amount in INR</label>
          <Input
            type="number"
            placeholder="Enter amount in INR"
            value={amountINR}
            onChange={(e) => setAmountINR(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <Textarea
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate("/talha")}>
            Cancel
          </Button>
          <button
            type="submit"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" /> Submit
          </button>
        </div>
      </form>
    </div>
  );
}
