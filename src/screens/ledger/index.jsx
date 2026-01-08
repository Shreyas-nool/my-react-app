import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";

export default function Ledger() {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "partyName",
    direction: "asc", // ✅ A–Z by default
  });

  /* ---------- Fetch Parties ---------- */
  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsub = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val() || {};

      const list = Object.entries(data).map(([id, party]) => ({
        partyId: id,
        partyName: party.name || "-",
        city: party.city || "-",
        balance: Number(party.balance || 0),
      }));

      setParties(list);
    });

    return () => unsub();
  }, []);

  /* ---------- Helpers ---------- */
  const format2 = (num) => Number(num).toFixed(2);

  /* ---------- Search ---------- */
  const filteredParties = parties.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true; // show all if search is empty

    return (
      p.partyName.toLowerCase().startsWith(q) || // ✅ match start of name
      p.city.toLowerCase().startsWith(q)
    );
  });

  /* ---------- Sorting ---------- */
  const sortedParties = [...filteredParties].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // Total money yet to collect (sum of positive balances)
  const totalReceivable = parties
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  // Total advance (sum of negative balances)
  const totalAdvance = parties
    .filter((p) => p.balance < 0)
    .reduce((sum, p) => sum + p.balance, 0); // will be negative

  // Net Receivable
  const netReceivable = totalReceivable + totalAdvance; 
  // adding a negative advance reduces the net

  /* ---------- UI ---------- */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title */}
        <h1 className="text-xl font-semibold text-center">
          Party Ledger Summary
        </h1>

        {/* Net Receivable on the right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-lg font-semibold">
          Net Receivable:{" "}
          <span className={`${netReceivable >= 0 ? "text-red-600" : "text-green-600"}`}>
            {format2(netReceivable)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search party or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2 text-base w-72"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-base">
              <th
                className="border p-3 cursor-pointer"
                onClick={() => handleSort("partyName")}
              >
                Party Name {renderSortIcon("partyName")}
              </th>

              <th className="border p-3">Place</th>

              <th
                className="border p-3 cursor-pointer"
                onClick={() => handleSort("balance")}
              >
                Current Balance {renderSortIcon("balance")}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedParties.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6">
                  No parties found.
                </td>
              </tr>
            ) : (
              sortedParties.map((party) => (
                <tr
                  key={party.partyId}
                  className="hover:bg-gray-50 cursor-pointer text-base"
                  onClick={() =>
                    navigate(`/ledger/${party.partyId}`, {
                      state: { party },
                    })
                  }
                >
                  <td className="border p-4 font-medium">
                    {party.partyName}
                  </td>

                  <td className="border p-4">{party.city}</td>

                  <td
                    className={`border p-4 font-semibold ${
                      party.balance >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {format2(party.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/*
        <div className="flex justify-end gap-6 mb-2 text-lg font-semibold">
          <div>
            Total Receivable: <span className="text-red-600">{format2(totalReceivable)}</span>
          </div>
          <div>
            Total Advance: <span className="text-green-600">{format2(totalAdvance)}</span>
          </div>
        </div>
          */}

      </div>
    </div>
  );
}
