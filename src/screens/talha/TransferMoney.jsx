import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";
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

  const CURRENT_BANK = "Talha"; // fixed

  // 🟩 Load banks except current
  useEffect(() => {
    const banksRef = ref(db, "banks");
    onValue(banksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.values(data).filter(
          (b) => b.bankName !== CURRENT_BANK
        );
        setBanks(filtered);
      }
    });
  }, []);

  // 🟩 Load REAL balance using the SAME logic as TalhaBankPayments.jsx
  useEffect(() => {
    const paymentsRef = ref(db, "payments");

    const unsub = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBalance(0);

      const talhaPayments = [];

      Object.values(data).forEach((partyGroup) => {
        Object.values(partyGroup).forEach((dateGroup) => {
          Object.values(dateGroup).forEach((payment) => {
            if (payment.bank?.startsWith(CURRENT_BANK)) {
              talhaPayments.push(payment);
            }
          });
        });
      });

      const total = talhaPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      setBalance(total);
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetBank || !amount || !date) {
      toast.error("Fill all fields");
      return;
    }

    const amt = Number(amount);
    const createdAt = new Date().toISOString();

    try {
      // 🔥 1️⃣ SAVE TRANSFER OUT OF TALHA
      const talhaRef = ref(db, `payments/${CURRENT_BANK}/${date}`);
      await push(talhaRef, {
        amount: -amt,
        party: "Transfer",
        date,
        notes,
        createdAt,
        type: "transfer",
        bank: `${CURRENT_BANK} - Transfer`,
        from: CURRENT_BANK,
        to: targetBank,
      });

      // 🔥 2️⃣ SAVE TRANSFER INTO TARGET BANK
      const targetRef = ref(db, `payments/${targetBank}/${date}`);
      await push(targetRef, {
        amount: amt,
        party: "Transfer",
        date,
        notes,
        createdAt,
        type: "transfer",
        bank: `${targetBank} - Transfer`,
        from: CURRENT_BANK,
        to: targetBank,
      });

      toast.success("Transfer completed");
      navigate("/talha");
    } catch (error) {
      console.log(error);
      toast.error("Transfer failed");
    }
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 p-4 space-y-6 bg-background">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/talha")}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Transfer Money</h1>
      </header>

      {/* Balance */}
      <div className="bg-white p-4 rounded-2xl shadow-md text-lg font-semibold">
        Current Balance: {balance.toLocaleString()}
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md space-y-4"
      >
        {/* From */}
        <div>
          <label className="text-sm">Transfer From</label>
          <Input value={CURRENT_BANK} disabled />
        </div>

        {/* To + Date */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="text-sm">Transfer To</label>
            <Select value={targetBank} onValueChange={setTargetBank}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.bankName} value={b.bankName}>
                    {b.bankName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-1/2">
            <label className="text-sm">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm">Notes</label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <Button type="submit" className="bg-black text-white w-full">
          Transfer
        </Button>
      </form>
    </div>
  );
};

export default TransferMoney;
