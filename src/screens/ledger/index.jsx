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
  const [ledgerData, setLedgerData] = useState([]);

  useEffect(() => {
    const ledgerSummaryRef = ref(db, "ledgerSummary");
    const ledgerRef = ref(db, "ledger");

    // Listen to both ledgerSummary and ledger nodes
    const unsubscribeSummary = onValue(ledgerSummaryRef, (snapshot) => {
      const summaryData = snapshot.val() || {};

      // Convert to array of party summaries
      const summaryList = Object.values(summaryData).map((entry) => ({
        partyId: entry.partyId,
        partyName: entry.partyName,
        openingBalance: Number(entry.openingBalance || 0),
        balance: Number(entry.balance || 0),
        totalDebit: Number(entry.totalDebit || 0),
        totalCredit: Number(entry.totalCredit || 0),
        date: entry.date,
      }));

      setLedgerData((prev) => mergeLedgerWithLatest(prev, summaryList));
    });

    const unsubscribeLedger = onValue(ledgerRef, (snapshot) => {
      const ledgerDataRaw = snapshot.val() || {};
      const latestBalances = [];

      Object.entries(ledgerDataRaw).forEach(([partyId, datesObj]) => {
        let latestDate = null;
        let latestEntry = null;

        Object.entries(datesObj).forEach(([date, entriesObj]) => {
          Object.values(entriesObj).forEach((entry) => {
            if (!latestDate || new Date(entry.createdAt) > new Date(latestDate)) {
              latestDate = entry.createdAt || entry.date;
              latestEntry = entry;
            }
          });
        });

        if (latestEntry) {
          latestBalances.push({
            partyId: latestEntry.partyId,
            partyName: latestEntry.partyName,
            balance: latestEntry.runningBalance ?? 0,
          });
        }
      });

      setLedgerData((prev) => mergeLedgerWithLatest(prev, latestBalances));
    });

    return () => {
      unsubscribeSummary();
      unsubscribeLedger();
    };
  }, []);

  // Merge summary and ledger latest balances
  const mergeLedgerWithLatest = (prevData, newData) => {
    const merged = {};

    newData.forEach((entry) => {
      merged[entry.partyId] = { ...merged[entry.partyId], ...entry };
    });

    prevData.forEach((entry) => {
      merged[entry.partyId] = { ...entry, ...merged[entry.partyId] };
    });

    return Object.values(merged);
  };

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
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {ledgerData.map((entry) => (
                    <TableRow
                      key={entry.partyId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        navigate(`/ledger/${entry.partyId}`, { state: { party: entry } })
                      }
                    >
                      <TableCell>{entry.partyName}</TableCell>

                      <TableCell
                        className={
                          entry.openingBalance > 0
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {entry.openingBalance || 0}
                      </TableCell>

                      <TableCell
                        className={
                          (entry.balance || 0) >= 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {entry.balance || 0}
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
