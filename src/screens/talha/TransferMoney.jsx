import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

const TransferMoney = () => {
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [targetBank, setTargetBank] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [balance, setBalance] = useState(0);

  // The "Transfer From" input value
  const transferFromInput = "Talha - Online";

  // Extract the first word to match the database bankName
  const fromBankKey = transferFromInput.split(" ")[0].trim().toLowerCase();

  useEffect(() => {
    // Fetch all banks and filter out the current bank
    const banksRef = ref(db, "banks");
    onValue(banksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredBanks = Object.values(data).filter(
          (b) =>
            b.bankName &&
            b.bankName.trim().toLowerCase() !== fromBankKey
        );
        setBanks(filteredBanks);
      }
    });

    // Fetch balance for the current bank
    const paymentsRef = ref(db, "payments");
    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const currentBankPayments = Object.values(data).filter(
        (p) =>
          p.bank &&
          p.bank.trim().toLowerCase().startsWith(fromBankKey)
      );

      const total = currentBankPayments.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      setBalance(total);
    });
  }, [fromBankKey]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!targetBank || !amount || !date) {
    toast.error("Please fill all required fields");
    return;
  }

  const amt = Number(amount);
  const now = Date.now();

  try {
    // 1️⃣ Deduct from Talha
    await push(ref(db, "payments"), {
      party: "Transfer",
      amount: -amt, // negative for deduction
      bank: transferFromInput,
      createdAt: now,
      notes: `Transferred to ${targetBank}`,
      date,
      type: "transfer",
    });

    // 2️⃣ Add to target bank
    await push(ref(db, "payments"), {
      party: "Transfer",
      amount: amt, // positive for addition
      bank: targetBank,
      createdAt: now,
      notes: `Received from ${transferFromInput}`,
      date,
      type: "transfer",
    });

    toast.success("Money transferred successfully");
    setAmount("");
    setNotes("");
    navigate("/talha");
  } catch (error) {
    console.error(error);
    toast.error("Failed to transfer money");
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
          Transfer Money
        </h1>
      </header>

      {/* Current Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-gray-800 font-semibold text-lg">
        Current Balance: {balance.toLocaleString()}
      </div>

      {/* Transfer Form */}
      <form
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 border border-gray-100"
        onSubmit={handleSubmit}
      >
        {/* Transfer From */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Transfer From</label>
          <Input value={transferFromInput} disabled />
        </div>

        {/* Transfer To */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Transfer To</label>
          <Select value={targetBank} onValueChange={setTargetBank}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((b, i) => (
                <SelectItem key={i} value={b.bankName}>
                  {b.bankName} ({b.accountDetails})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          Transfer
        </Button>
      </form>
    </div>
  );
};

export default TransferMoney;
