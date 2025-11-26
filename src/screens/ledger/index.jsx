import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

export default function Ledger() {
  const navigate = useNavigate();

  const [ledgerData, setLedgerData] = useState([
    { id: 1, party: "ABC Traders", sales: 15000, paid: 10000 },
    { id: 2, party: "XYZ Enterprises", sales: 20000, paid: 15000 },
    { id: 3, party: "PQR Garments", sales: 12000, paid: 12000 },
    { id: 4, party: "LMN Textiles", sales: 18000, paid: 8000 },
  ]);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">

      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            Party Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        {/* ADD LEDGER BUTTON */}
        <Button
          onClick={() => navigate("/ledger/add")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:block">Add Ledger</span>
        </Button>
      </header>

      {/* LEDGER TABLE */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Ledger Overview
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-foreground/90">
                <thead className="bg-muted text-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Party Name</th>
                    <th className="px-4 py-3">Total Sales (₹)</th>
                    <th className="px-4 py-3">Payment Received (₹)</th>
                    <th className="px-4 py-3">Remaining (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {ledgerData.map((party, index) => {
                    const remaining = party.sales - party.paid;

                    return (
                      <tr
                        key={party.id}
                        className="border-b hover:bg-accent/40 transition"
                      >
                        <td className="px-4 py-3">{index + 1}</td>

                        <td className="px-4 py-3 font-medium">
                          {party.party}
                        </td>

                        <td className="px-4 py-3">
                          ₹{party.sales.toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                          ₹{party.paid.toLocaleString()}
                        </td>

                        <td
                          className={`px-4 py-3 font-semibold ${
                            remaining > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{remaining.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
