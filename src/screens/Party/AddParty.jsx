import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";

// Firebase
import { db } from "../../firebase";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const AddParty = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [mobile, setMobile] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [partyType, setPartyType] = useState("Customer");
  const [creditPeriod, setCreditPeriod] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ All fields required validation
    if (!name.trim()) return alert("Party name is required");
    if (!city.trim()) return alert("Place is required");
    if (!mobile.trim()) return alert("Mobile is required");
    if (openingBalance === "" || isNaN(Number(openingBalance))) return alert("Old Balance is required");
    if (creditPeriod === "" || isNaN(Number(creditPeriod))) return alert("Credit Period is required");
    if (!partyType) return alert("Party Type is required");

    const partyId = uuidv4();
    const openingAmt = Number(openingBalance) || 0;

    // Local date key (NO ISO BUG)
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const partyData = {
      id: partyId,
      name: name.trim(),
      city: city.trim(),
      mobile: mobile.trim(),
      partyType,
      creditPeriod: Number(creditPeriod) || 0,
      openingBalance: openingAmt,
      balance: openingAmt, // live balance
      createdAt: Date.now(),
    };

    try {
      // 1️⃣ Save party
      await set(ref(db, `parties/${partyId}`), partyData);

      // 2️⃣ Save opening balance as FIRST ENTRY
      if (openingAmt !== 0) {
        const txnId = Date.now().toString();

        await set(
          ref(db, `parties/${partyId}/entries/${dateKey}/${txnId}`),
          {
            txnId,
            type: "opening_balance",
            amount: openingAmt,
            note: "Opening Balance",
            date: dateKey,
            createdAt: Date.now(),
          }
        );
      }

      alert("✅ Party added successfully");
      navigate("/party");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add party");
    }
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 bg-background p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center border-b pb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/party")}
        >
          <ArrowLeft size={18} />
        </Button>

        <h1 className="flex-1 text-center text-lg font-semibold">
          Add Party
        </h1>
      </header>

      {/* Form */}
      <div className="bg-white shadow rounded p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="text-sm font-medium">Party Name</label>
            <input
              className="w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-medium">Place</label>
            <input
              className="w-full border rounded p-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm font-medium">Mobile</label>
            <input
              className="w-full border rounded p-2"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          {/* Opening Balance */}
          <div>
            <label className="text-sm font-medium">Old Balance</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>

          {/* Credit Period */}
          <div>
            <label className="text-sm font-medium">Credit Period (days)</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded p-2"
              value={creditPeriod}
              onChange={(e) => setCreditPeriod(e.target.value)}
              required
            />
          </div>

          {/* Party Type */}
          <div>
            <label className="text-sm font-medium block mb-1">Party Type</label>
            <div className="flex gap-4">
              {["Customer", "Vendor", "Supplier"].map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={partyType === type}
                    onChange={() => setPartyType(type)}
                    required
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Save Party
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddParty;
