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

export default function SRTransferMoney() {
  const navigate = useNavigate();
  const CURRENT_ACCOUNT = "SR";

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [toType, setToType] = useState("");
  const [toId, setToId] = useState(""); // store id instead of name

  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);

  const [balance, setBalance] = useState(0);

  // ---------------- FETCH & FLATTEN DATA ----------------
  useEffect(() => {
    // BANKS
    onValue(ref(db, "banks"), (snap) => {
      const list = [];
      snap.forEach((child) => {
        const id = child.key;
        const data = child.val();
        list.push({ ...data, id, displayName: data.bankName });
      });
      setBanks(list);
    });

    // ACCOUNTS
    onValue(ref(db, "accounts"), (snap) => {
      const list = [];
      snap.forEach((child) => {
        const accName = child.key;
        const data = child.val();
        list.push({ ...data, id: accName, displayName: accName });
      });
      setAccounts(list);
    });

    // PARTIES
    onValue(ref(db, "parties"), (snap) => {
      const list = [];
      snap.forEach((child) => {
        const id = child.key;
        const data = child.val();
        // Display as "Name (City)"
        list.push({ ...data, id, displayName: `${data.name} (${data.city})` });
      });
      setParties(list);
    });

    // SR BALANCE
    onValue(ref(db, "accounts/SR/balance"), (s) => {
      setBalance(s.exists() ? Number(s.val()) : 0);
    });
  }, []);

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!toType || !toId || !amount) {
      toast.error("Fill all fields");
      return;
    }

    const amt = Number(amount);
    const time = Date.now();

    try {
      // SR balance check
      const srBalRef = ref(db, "accounts/SR/balance");
      const srSnap = await get(srBalRef);
      const srBal = srSnap.exists() ? Number(srSnap.val()) : 0;

      if (srBal < amt) {
        toast.error("Insufficient balance");
        return;
      }

      await set(srBalRef, srBal - amt);

      // Destination balance
      const map = { bank: "banks", account: "accounts", party: "parties" };
      const destBalRef = ref(db, `${map[toType]}/${toId}/balance`);
      const destSnap = await get(destBalRef);
      const destBal = destSnap.exists() ? Number(destSnap.val()) : 0;
      await set(destBalRef, destBal + amt);

      // Payments
      await push(ref(db, `payments/SR/${date}`), {
        amount: amt,
        date,
        fromName: "SR",
        fromType: "account",
        toId,
        toType,
        note: notes,
        createdAt: time,
        txnId: time,
      });

      await push(ref(db, `payments/${toId}/${date}`), {
        amount: amt,
        date,
        fromName: "SR",
        fromType: "account",
        toId,
        toType,
        note: notes,
        createdAt: time,
        txnId: time,
      });

      // Transfer history
      await push(ref(db, `transfers/${toType}/${toId}/${date}`), {
        from: "SR",
        toType,
        toId,
        amount: amt,
        note: notes,
        createdAt: time,
      });

      toast.success("Money transferred successfully");
      navigate("/sr");
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
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sr")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Transfer Money</h1>
      </header>

      {/* Balance */}
      <div className="bg-white p-4 rounded-2xl shadow border font-semibold text-lg">
        SR Balance: ₹{balance.toFixed(2)}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow space-y-4"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">From</label>
            <Input value="SR" disabled />
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">Transfer To Type</label>
            <Select
              value={toType}
              onValueChange={(v) => {
                setToType(v);
                setToId("");
              }}
            >
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

          {toType && (
            <div className="flex-1">
              <label className="text-sm font-medium">Select {toType}</label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {getOptions().map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate("/sr")}>
            Cancel
          </Button>
          <Button className="bg-black text-white hover:bg-gray-800">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
