import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { db } from "../../firebase";
import { ref, push, set, get } from "firebase/database";

export default function AddLedger() {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");

  // Load party list from Firebase
  useEffect(() => {
    const partiesRef = ref(db, "parties");
    get(partiesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setParties(data);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!selectedParty || !paidAmount) return alert("Fill all fields");

    const createdAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const ledgerRef = ref(db, `ledger/${createdAt}`);

    const newEntry = push(ledgerRef);
    await set(newEntry, {
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      paidAmount: Number(paidAmount),
      note: note || "",
      createdAt,
    });

    alert("Ledger entry added!");
    navigate("/ledger");
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 bg-background p-4 space-y-4">

      {/* HEADER */}
      <header className="flex items-center justify-between py-2 border-b border-border/50">
        <Button
          variant="ghost"
          onClick={() => navigate("/ledger")}
          className="h-9 w-9 p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg font-semibold">Add Ledger Entry</h1>

        <div className="w-9" />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add Payment to Ledger</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* PARTY */}
          <div>
            <label className="text-sm font-medium">Select Party</label>
            <select
              className="w-full mt-1 p-2 border rounded-md"
              onChange={(e) => {
                const party = parties.find((p) => p.id === e.target.value);
                setSelectedParty(party);
              }}
            >
              <option value="">Select Party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* PAID AMOUNT */}
          <div>
            <label className="text-sm font-medium">Paid Amount (₹)</label>
            <input
              type="number"
              className="w-full mt-1 p-2 border rounded-md"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          {/* SAVE BUTTON */}
          <Button onClick={handleSave} className="w-full bg-primary text-white">
            Save Entry
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
