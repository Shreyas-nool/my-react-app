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
  const CURRENT_ACCOUNT = "JR";

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [toType, setToType] = useState("");
  const [toName, setToName] = useState("");

  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);

  const [balance, setBalance] = useState(0);

  // ---------------- FETCH & FLATTEN DATA ----------------
  useEffect(() => {
    // BANKS
    onValue(ref(db, "banks"), (snap) => {
      if (!snap.exists()) return setBanks([]);

      const list = [];
      Object.entries(snap.val()).forEach(([bankName, ids]) => {
        Object.entries(ids).forEach(([id, data]) => {
          list.push({ ...data, id, name: bankName });
        });
      });
      setBanks(list);
    });

    // ACCOUNTS
    onValue(ref(db, "accounts"), (snap) => {
      if (!snap.exists()) return setAccounts([]);

      const list = [];
      Object.entries(snap.val()).forEach(([accName, ids]) => {
        Object.entries(ids).forEach(([id, data]) => {
          list.push({ ...data, id, name: accName });
        });
      });
      setAccounts(list);
    });

    // PARTIES
    onValue(ref(db, "parties"), (snap) => {
      if (!snap.exists()) return setParties([]);

      const list = [];
      Object.entries(snap.val()).forEach(([partyName, ids]) => {
        Object.entries(ids).forEach(([id, data]) => {
          list.push({ ...data, id, name: partyName });
        });
      });
      setParties(list);
    });

    // JR BALANCE
    onValue(ref(db, "accounts/JR/balance"), (s) => {
      setBalance(s.exists() ? Number(s.val()) : 0);
    });
  }, []);

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!toType || !toName || !amount) {
      toast.error("Fill all fields");
      return;
    }

    const amt = Number(amount);
    const time = Date.now();

    try {
      // JR balance check
      const jrBalRef = ref(db, "accounts/JR/balance");
      const jrSnap = await get(jrBalRef);
      const jrBal = jrSnap.exists() ? Number(jrSnap.val()) : 0;

      if (jrBal < amt) {
        toast.error("Insufficient balance");
        return;
      }

      await set(jrBalRef, jrBal - amt);

      // Destination balance
      const map = { bank: "banks", account: "accounts", party: "parties" };
      const destBalRef = ref(db, `${map[toType]}/${toName}/balance`);
      const destSnap = await get(destBalRef);
      const destBal = destSnap.exists() ? Number(destSnap.val()) : 0;

      await set(destBalRef, destBal + amt);

      // Payments
      await push(ref(db, `payments/JR/${date}`), {
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

      await push(ref(db, `payments/${toName}/${date}`), {
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

      // Transfer history
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
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/jr")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Transfer Money</h1>
      </header>

      {/* Balance */}
      <div className="bg-white p-4 rounded-2xl shadow border font-semibold text-lg">
        JR Balance: ₹{balance.toFixed(2)}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow space-y-4"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">From</label>
            <Input value="JR" disabled />
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">Transfer To Type</label>
            <Select value={toType} onValueChange={(v) => {
              setToType(v);
              setToName("");
            }}>
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
              <Select value={toName} onValueChange={setToName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {getOptions().map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
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
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <Button variant="ghost" onClick={() => navigate("/jr")}>
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
