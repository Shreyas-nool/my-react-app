import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

const SrAddReduceMoney = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [balance, setBalance] = useState(0);

  const CURRENT_BANK = "SR";

  // Fetch SR balance
  useEffect(() => {
    const paymentsRef = ref(db, "payments");
    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const srPayments = Object.values(data).filter(
        (p) => p.bank && p.bank.trim().split(" ")[0] === CURRENT_BANK
      );

      const total = srPayments.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      setBalance(total);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date) {
      toast.error("Please fill all required fields");
      return;
    }

    const paymentData = {
      bank: CURRENT_BANK,
      amount: Number(amount),
      notes,
      date,
      createdAt: serverTimestamp(),
    };

    try {
      const paymentsRef = ref(db, "payments");
      await push(paymentsRef, paymentData);
      toast.success("Transaction recorded successfully");
      navigate("/sr");
    } catch (error) {
      console.error(error);
      toast.error("Failed to record transaction");
    }
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6 bg-background">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/sr")}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground/90">
          Add / Reduce Money
        </h1>
      </header>

      {/* Current SR Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-gray-800 font-semibold text-lg">
        Current Balance: {balance.toLocaleString()}
      </div>

      {/* Form */}
      <form
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 border border-gray-100"
        onSubmit={handleSubmit}
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
          <label className="text-sm font-medium text-gray-700">
            Amount (use - for reduction)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
        >
          Submit
        </Button>
      </form>
    </div>
  );
};

export default SrAddReduceMoney;
