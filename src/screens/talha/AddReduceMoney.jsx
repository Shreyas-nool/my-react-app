// src/screens/talha/AddReduceMoney.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, push, onValue, set } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

const AddReduceMoney = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("add"); // "add" or "reduce"
  const [notes, setNotes] = useState("");
  const [balance, setBalance] = useState(0);

  // Fetch current balance from payments
  useEffect(() => {
    const paymentsRef = ref(db, "payments");

    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setBalance(0);
        return;
      }
      const talhaPayments = Object.values(data).filter(
        (p) => p.bank === "Talha - Online"
      );
      const total = talhaPayments.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      setBalance(total);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    const adjustedAmount = type === "reduce" ? -Number(amount) : Number(amount);

    const newPaymentRef = ref(db, "payments");
    const newPayment = {
      party: type === "add" ? "Added to Talha" : "Reduced from Talha",
      date: new Date().toISOString().split("T")[0],
      bank: "Talha - Online",
      amount: adjustedAmount,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      await push(newPaymentRef, newPayment);
      alert("✅ Transaction added");
      navigate("/talha"); // go back to Talha page
    } catch (err) {
      console.error(err);
      alert("Error adding transaction");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/talha")}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
          Add / Reduce Money
        </h1>
      </header>

      {/* Current Balance */}
      <div className="mb-6 text-lg font-semibold">
        Current Balance: {balance.toLocaleString()}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="add">Add Money</option>
            <option value="reduce">Reduce Money</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Optional notes"
          />
        </div>

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
};

export default AddReduceMoney;
