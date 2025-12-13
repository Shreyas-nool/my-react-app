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

  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const partyList = Object.entries(data).map(([id, party]) => ({
        partyId: id,
        partyName: party.name || "Unknown",
        openingBalance: Number(party.openingBalance || 0), // purely display
        balance: Number(party.balance || 0), // used for calculations
      }));
      setParties(partyList);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Helper to format number to 2 decimals
  const format2 = (num) => Number(num).toFixed(2);

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
            <CardTitle>Party Ledger Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Current Balance</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {parties.map((party) => (
                    <TableRow
                      key={party.partyId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        navigate(`/ledger/${party.partyId}`, { state: { party } })
                      }
                    >
                      <TableCell>{party.partyName}</TableCell>

                      {/* Display only, no calculation */}
                      <TableCell
                        className={
                          party.openingBalance > 0
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {party.openingBalance}
                      </TableCell>

                      {/* Current balance formatted to 2 decimals */}
                      <TableCell
                        className={
                          party.balance >= 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {format2(party.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
