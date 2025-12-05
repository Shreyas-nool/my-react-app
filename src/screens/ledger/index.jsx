import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

export default function Ledger() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [balances, setBalances] = useState({});

  // Fetch parties
  useEffect(() => {
    const partiesRef = ref(db, "parties");
    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const partyList = Object.entries(data).map(([id, party]) => ({
        id,
        name: party.name || "Unknown",
        opening: Number(party.openingBalance || 0),
      }));
      setParties(partyList);
    });

    return () => unsubscribe();
  }, []);

  // Fetch ledger balances in real-time
  useEffect(() => {
    if (!parties.length) return;

    const ledgerRef = ref(db, "ledger");
    const unsubscribe = onValue(ledgerRef, (snap) => {
      const ledgerData = snap.val() || {};
      const newBalances = {};

      parties.forEach((p) => {
        const partyLedger = ledgerData[p.id] || {};
        // Sum runningBalance if saved, or compute balance
        let balance = 0;
        Object.values(partyLedger).forEach((entry) => {
          balance = entry.runningBalance ?? balance + (entry.debit || 0) - (entry.credit || 0);
        });
        newBalances[p.id] = balance;
      });

      setBalances(newBalances);
    });

    return () => unsubscribe();
  }, [parties]);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Ledger</h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        <div className="w-10" /> {/* empty to balance */}
      </header>

      {/* Table */}
      <main className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Party Ledger List</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {parties.map((party) => {
                    const balance = balances[party.id] ?? 0;
                    return (
                      <TableRow
                        key={party.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          navigate(`/ledger/${party.id}`, { state: { party } })
                        }
                      >
                        {/* Party Name */}
                        <TableCell>{party.name}</TableCell>

                        {/* Opening Balance */}
                        <TableCell
                          className={
                            party.opening > 0
                              ? "text-red-600 font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {party.opening}
                        </TableCell>

                        {/* Current Balance */}
                        <TableCell
                          className={
                            balance >= 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {balance}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
