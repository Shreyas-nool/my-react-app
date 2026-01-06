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

    if (!name.trim()) {
      alert("Party name is required");
      return;
    }

    const partyId = uuidv4();

    // Convert opening balance to number, default 0
    const initialBalance = Number(openingBalance) || 0;

    const partyData = {
      id: partyId,
      name: name.trim(),
      city: city.trim(),
      mobile: mobile.trim(),
      openingBalance: openingBalance,
      partyType,
      creditPeriod: Number(creditPeriod) || 0,

      // LIVE balance starts with the opening balance
      balance: -initialBalance, // negative because party owes us

      createdAt: new Date().toISOString(),
      entries: {}, // future transactions
    };

    try {
      await set(ref(db, `parties/${partyId}`), partyData);
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
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm font-medium">Mobile</label>
            <input
              className="w-full border rounded p-2"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          {/* Opening Balance */}
          <div>
            <label className="text-sm font-medium">
              Old Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
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
