import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, ChevronUp, ChevronDown } from "lucide-react";

export default function BanksLedger() {
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "bankName",
    direction: "asc",
  });

  /* ---------- Fetch Banks (live) ---------- */
  useEffect(() => {
    const banksRef = ref(db, "banks");

    const unsub = onValue(banksRef, (snapshot) => {
      const data = snapshot.val() || {};

      const list = Object.entries(data).map(([id, bank]) => ({
        bankId: id,
        bankName: bank.bankName || "-",
        balance: Number(bank.balance || 0), // live balance
      }));

      setBanks(list);
    });

    return () => unsub();
  }, []);

  /* ---------- Helpers ---------- */
  const format2 = (num) => Number(num).toFixed(2);

  /* ---------- Search ---------- */
  const filteredBanks = banks.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return b.bankName.toLowerCase().startsWith(q);
  });

  /* ---------- Sorting ---------- */
  const sortedBanks = [...filteredBanks].sort((a, b) => {
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

  // Net Balance
  const netBalance = banks.reduce((sum, b) => sum + b.balance, 0);

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
          Banks Ledger Summary
        </h1>

        {/* Add Bank button */}
        <Button
          onClick={() => navigate("/banks/add-bank")}
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Bank
        </Button>
      </div>

      {/* Net Balance and Search on same line */}
      <div className="flex justify-between items-center">
        {/* Empty div to keep spacing */}
        <div className="w-1/3"></div>

        {/* Search */}
        <div className="w-1/3 flex justify-center">
          <input
            type="text"
            placeholder="Search bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-400 rounded px-3 py-2 text-base w-72"
          />
        </div>

        {/* Net Balance */}
        <div className="w-1/3 text-right text-lg font-semibold">
          Net Balance:{" "}
          <span className={`${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {format2(netBalance)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex items-center justify-center">
        <table className="w-200 table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-base">
              <th
                className="border p-4 cursor-pointer"
                onClick={() => handleSort("bankName")}
              >
                Bank Name {renderSortIcon("bankName")}
              </th>

              <th
                className="border p-4 cursor-pointer"
                onClick={() => handleSort("balance")}
              >
                Current Balance {renderSortIcon("balance")}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedBanks.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6">
                  No banks found.
                </td>
              </tr>
            ) : (
              sortedBanks.map((bank) => (
                <tr
                  key={bank.bankId}
                  className="hover:bg-gray-50 cursor-pointer text-base"
                  onClick={() =>
                    navigate(`/banks/${bank.bankId}`, { state: { bank } })
                  }
                >
                  <td className="border p-4 font-medium">{bank.bankName}</td>
                  <td
                    className={`border p-4 font-semibold ${
                      bank.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {format2(bank.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
