import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, push, get, set } from "firebase/database";

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

export default function JrTransferMoney() {
  const navigate = useNavigate();
  const CURRENT_BANK = "JR";

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [toType, setToType] = useState("");
  const [toName, setToName] = useState("");

  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);

  const [balance, setBalance] = useState(0);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    onValue(ref(db, "banks"), (s) => setBanks(s.exists() ? Object.values(s.val()) : []));
    onValue(ref(db, "accounts"), (s) => setAccounts(s.exists() ? Object.values(s.val()) : []));
    onValue(ref(db, "parties"), (s) => setParties(s.exists() ? Object.values(s.val()) : []));

    // JR balance
    onValue(ref(db, "accounts/JR/balance"), (s) => {
      setBalance(s.exists() ? Number(s.val()) : 0);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!toType || !toName || !amount) {
      toast.error("Fill all fields");
      return;
    }

    const amt = Number(amount);
    const time = Date.now();

    try {
      // ---------------- JR BALANCE ----------------
      const jrRef = ref(db, "accounts/JR/balance");
      const jrSnap = await get(jrRef);
      const jrBal = jrSnap.exists() ? jrSnap.val() : 0;

      if (jrBal < amt) {
        toast.error("Insufficient balance");
        return;
      }

      await set(jrRef, jrBal - amt);

      // ---------------- DESTINATION BALANCE ----------------
      const map = { bank: "banks", account: "accounts", party: "parties" };
      const targetRef = ref(db, `${map[toType]}/${toName}/balance`);
      const targetSnap = await get(targetRef);
      const targetBal = targetSnap.exists() ? targetSnap.val() : 0;
      await set(targetRef, targetBal + amt);

      // ---------------- CREATE PAYMENT ENTRY (Like before) ----------------
      // 1️⃣ JR sends payment
      const jrPaymentRef = ref(db, `payments/JR/${date}`);
      await push(jrPaymentRef, {
        amount: amt,
        date,
        fromName: "JR",
        fromType: "account",
        toName,
        toType,
        note: notes,
        createdAt: time,
        txnId: time,
      });

      // 2️⃣ Destination receives payment
      const destPaymentRef = ref(db, `payments/${toName}/${date}`);
      await push(destPaymentRef, {
        amount: amt,
        date,
        fromName: "JR",
        fromType: "account",
        toName,
        toType,
        note: notes,
        createdAt: time,
        txnId: time,
      });

      // ---------------- TRANSFER HISTORY ----------------
      await push(ref(db, `transfers/${toType}/${toName}/${date}`), {
        from: "JR",
        toType,
        toName,
        amount: amt,
        note: notes,
        createdAt: time,
      });

      toast.success("Money transferred successfully");
      navigate("/jr");
    } catch (err) {
      console.error(err);
      toast.error("Transfer failed");
    }
  };

  const getOptions = () => {
    if (toType === "bank") return banks;
    if (toType === "account") return accounts;
    if (toType === "party") return parties;
    return [];
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6 bg-background">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/jr")}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground/90">Transfer Money</h1>
      </header>

      {/* Current Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-gray-800 font-semibold text-lg">
        JR Balance: ₹{balance.toFixed(2)}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 border border-gray-100"
      >
        {/* From + To Type + Select Type row */}
        <div className="flex gap-3">
          {/* From */}
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">From</label>
            <Input value="JR" disabled />
          </div>

          {/* Transfer To Type */}
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Transfer To Type</label>
            <Select value={toType} onValueChange={setToType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="party">Party</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select {type} */}
          {toType && (
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Select {toType}</label>
              <Select value={toName} onValueChange={setToName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {getOptions().map((i, idx) => (
                    <SelectItem key={idx} value={i.name || i.bankName}>
                      {i.name || i.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Date + Amount row */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <Textarea placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate("/jr")}>
            Cancel
          </Button>
          <Button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
