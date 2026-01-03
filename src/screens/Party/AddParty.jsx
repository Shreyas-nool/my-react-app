import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";

// Firebase
import { db } from "../../firebase";
import { ref, push, set } from "firebase/database";

const AddParty = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [mobile, setMobile] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [partyType, setPartyType] = useState("Customer");

  const [creditPeriod, setCreditPeriod] = useState(""); // ⭐ NEW FIELD

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) return alert("Party name is required!");

    const newParty = {
      name,
      city,
      mobile,
      openingBalance: Number(openingBalance) || 0,
      partyType,
      creditPeriod: Number(creditPeriod) || 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Use party name as child key
      const partyRef = ref(db, `parties/${name}`);
      await set(partyRef, newParty); // ❌ no push(), use set()

      alert("✅ Party saved successfully!");
      navigate("/party");
    } catch (error) {
      console.error("Error saving party:", error);
      alert("❌ Failed to save party.");
    }
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto mt-10 bg-background p-4 sm:p-6 space-y-6">

      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/party")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            Add Party
          </h1>
        </div>

        <div className="w-8 sm:w-9" />
      </header>

      {/* Form */}
      <div className="bg-white shadow-md rounded-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          {/* City */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Mobile</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Opening Balance */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Opening Balance</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* ⭐ CREDIT PERIOD (number + "days") */}
          <div className="flex flex-col gap-1">
  <label className="text-sm font-medium">Credit Period</label>

  <div className="relative w-full">
    <input
      type="number"
      min="0"
      step="5"                     // ⭐ INCREASE BY 5 DAYS EACH STEP
      value={creditPeriod}
      onChange={(e) => setCreditPeriod(e.target.value)}
      className="w-full border border-gray-300 rounded p-2 pr-14"
      placeholder="Enter credit period"
    />

    {/* Days label inside input */}
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
      days
    </span>
  </div>
</div>


          {/* Party Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Party Type</label>
            <div className="flex items-center space-x-4">
              {["Customer", "Vendor", "Supplier"].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value={type}
                    checked={partyType === type}
                    onChange={(e) => setPartyType(e.target.value)}
                  />
                  <span>{type}</span>
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
