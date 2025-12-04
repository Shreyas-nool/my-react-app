import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { getDatabase, ref, get, push, set } from "firebase/database";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddPayment() {
  const navigate = useNavigate();
  const today = new Date();

  const [date, setDate] = useState(today);
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");

  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);

  // Fetch parties
  useEffect(() => {
    const db = getDatabase();
    const partyRef = ref(db, "parties");
    get(partyRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setParties(list);
      }
    });
  }, []);

  // Fetch banks
  useEffect(() => {
    const db = getDatabase();
    const bankRef = ref(db, "banks");
    get(bankRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setBanks(list);
      }
    });
  }, []);

  const handleAmountChange = (e) => {
    let val = e.target.value;
    // Allow decimals and prevent negative numbers
    if (val === "") {
      setAmount("");
      return;
    }
    if (/^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return alert("Enter a valid amount greater than 0.");
    }

    const formattedDate = date.toISOString().split("T")[0];

    const newPayment = {
      date: formattedDate,
      party,
      amount: parseFloat(amount),
      bank,
      createdAt: new Date().toISOString(),
    };

    try {
      const db = getDatabase();
      // Save in main payments node
      const paymentRef = ref(db, "payments");
      const newPaymentRef = push(paymentRef);
      await set(newPaymentRef, newPayment);

      // Also save under selected bank
      const bankObj = banks.find(
        (b) => `${b.bankName} - ${b.accountDetails}` === bank
      );
      if (bankObj) {
        const bankPaymentRef = ref(db, `banks/${bankObj.id}/payments`);
        const newBankPaymentRef = push(bankPaymentRef);
        await set(newBankPaymentRef, newPayment);
      }

      alert("Payment added successfully!");
      navigate("/payment");
    } catch (error) {
      console.error(error);
      alert("Failed to add payment");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-3 border-b border-border/40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/payment")}
          className="h-8 w-8 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg sm:text-xl font-semibold">Add Payment</h1>
        <div className="w-8" />
      </header>

      {/* Card */}
      <Card className="mt-6 border border-border/40 shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-base font-semibold">
            Payment Details
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Date</label>
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                dateFormat="dd/MM/yyyy"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Party */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Party</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                required
              >
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.partyType === "Vendor" ? "(Vendor)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter amount"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>

            {/* Bank */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Method</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
              >
                <option value="">Select Method</option>
                {banks.map((b) => (
                  <option
                    key={b.id}
                    value={`${b.bankName} - ${b.accountDetails}`}
                  >
                    {b.bankName} ({b.accountDetails})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90"
            >
              Save Payment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
