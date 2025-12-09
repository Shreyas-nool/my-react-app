// src/screens/talha/AddReduceMoney.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "react-toastify";

const AddReduceMoney = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("add");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [balance, setBalance] = useState(0);

  const CURRENT_BANK = "Talha";

  // --------------------------
  // FIXED BALANCE FETCH LOGIC
  // --------------------------
  useEffect(() => {
    const paymentsRef = ref(db, "payments");

    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setBalance(0);
        return;
      }

      let total = 0;

      // Traverse payments → party → date → paymentId
      Object.values(data).forEach((partyNode) => {
        if (typeof partyNode !== "object") return;

        Object.values(partyNode).forEach((dateNode) => {
          if (typeof dateNode !== "object") return;

          Object.values(dateNode).forEach((payment) => {
            if (
              payment.bank === CURRENT_BANK + " - Online" &&
              Number(payment.amount)
            ) {
              total += Number(payment.amount);
            }
          });
        });
      });

      setBalance(total);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------
  // SUBMIT HANDLER
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0 || !date) {
      toast.error("Please fill all required fields with valid values");
      return;
    }

    const adjustedAmount = type === "reduce" ? -Number(amount) : Number(amount);

    const newPayment = {
      party: type === "add" ? "Added to Talha" : "Reduced from Talha",
      date,
      bank: CURRENT_BANK + " - Online",
      amount: adjustedAmount,
      notes,
      createdAt: serverTimestamp(),
    };

    try {
      // Save under:
      // payments / Talha / date / paymentId
      await push(ref(db, `payments/Talha/${date}`), newPayment);

      toast.success("✅ Transaction recorded successfully");
      navigate("/talha");
    } catch (err) {
      console.error(err);
      toast.error("Error adding transaction");
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
        <h1 className="text-lg font-semibold text-foreground/90">
          Add / Reduce Money
        </h1>
      </header>

      {/* Current Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-gray-800 font-semibold text-lg">
        Current Balance: {balance.toLocaleString()}
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

        {/* Amount */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Type */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="add">Add Money</option>
            <option value="reduce">Reduce Money</option>
          </select>
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
};

export default AddReduceMoney;
