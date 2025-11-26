// src/screens/purchase/EditPurchase.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

export default function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    const pRef = ref(db, `purchases/${id}`);
    const unsub = onValue(pRef, (snap) => {
      const data = snap.val();
      if (data) {
        setPurchase(data);
        setSupplier(data.supplier || "");
        setDate(data.date || new Date().toISOString().split("T")[0]);
        setAmount(String(data.amount || ""));
        setPaid(String(data.paid || ""));
        setNotes(data.notes || "");
      } else {
        setPurchase(null);
      }
    });
    return () => unsub();
  }, [id]);

  if (!purchase) {
    return <div className="p-6">Loading...</div>;
  }

  const pending = Number(amount || 0) - Number(paid || 0);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await set(ref(db, `purchases/${id}`), {
        supplier,
        date,
        amount: Number(amount || 0),
        paid: Number(paid || 0),
        pending,
        notes,
        updatedAt: new Date().toISOString(),
      });
      alert("✅ Updated");
      navigate("/purchase");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed. See console.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-8">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/purchase")} className="h-8 w-8 p-0 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Purchase</h1>
        </div>
      </header>

      <form onSubmit={handleSave} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border rounded p-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paid (₹)</label>
            <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} className="w-full border rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2" rows={3} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Pending: <span className="font-semibold">₹{pending.toLocaleString()}</span></div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/purchase")} variant="ghost">Cancel</Button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}
