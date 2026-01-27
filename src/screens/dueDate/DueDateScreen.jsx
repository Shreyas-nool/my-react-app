import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
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

export default function DueDateScreen() {
  const [partyData, setPartyData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [loading, setLoading] = useState(true);

  // ✅ filter state
  const [filter, setFilter] = useState("all"); // "all" or "overdue"

  const navigate = useNavigate();

  useEffect(() => {
    const salesRef = ref(db, "sales");
    const partyRef = ref(db, "parties");

    let partyCredit = {};
    let partyNameById = {};

    // Fetch party data
    onValue(partyRef, (snap) => {
      const parties = snap.val() || {};
      Object.keys(parties).forEach((id) => {
        const p = parties[id];
        partyCredit[id] = p.creditPeriod;
        partyNameById[id] = p.name;
      });

      // Fetch sales data
      onValue(salesRef, (snapshot) => {
        const sales = snapshot.val() || {};
        let latestDueDate = {};

        Object.keys(sales).forEach((dateKey) => {
          const invoices = sales[dateKey];

          Object.keys(invoices).forEach((invoiceKey) => {
            const sale = invoices[invoiceKey];
            const partyId = sale.partyId;
            const partyName = partyNameById[partyId];

            if (!partyName) return;

            const creditPeriod = partyCredit[partyId];

            if (!creditPeriod || isNaN(creditPeriod)) {
              latestDueDate[partyName] = {
                party: partyName,
                lastInvoice: sale.createdAt,
                creditPeriod: "~",
                dueDate: "~",
                daysLeft: "No credit period set",
              };
              return;
            }

            const due = new Date(sale.createdAt);
            due.setDate(due.getDate() + Number(creditPeriod));

            const existing = latestDueDate[partyName];

            if (!existing || new Date(due) > new Date(existing.dueDate)) {
              latestDueDate[partyName] = {
                party: partyName,
                lastInvoice: sale.createdAt,
                creditPeriod: `${creditPeriod} days`,
                dueDate: due.toISOString().split("T")[0],
                daysLeft: Math.ceil(
                  (due - new Date()) / (1000 * 60 * 60 * 24)
                ),
              };
            }
          });
        });

        setPartyData(Object.values(latestDueDate));
        setLoading(false);
      });
    });
  }, []);

  const getStatusColor = (days) => {
    if (days > 0) return "text-green-600 font-semibold";
    if (days === 0) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  // ✅ Apply search filter first
  const searchedData = partyData.filter((item) =>
    item.party.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Apply overdue filter
  const filteredData = searchedData.filter((item) => {
    if (filter === "overdue") {
      return typeof item.daysLeft === "number" && item.daysLeft < 0;
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === "lastInvoice" || sortConfig.key === "dueDate") {
      aValue = aValue === "~" ? 0 : new Date(aValue).getTime();
      bValue = bValue === "~" ? 0 : new Date(bValue).getTime();
    }

    if (sortConfig.key === "daysLeft") {
      aValue = typeof aValue === "string" ? 9999 : aValue;
      bValue = typeof bValue === "string" ? 9999 : bValue;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
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
      <ChevronUp className="inline-block ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="inline-block ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-4">
      <header className="flex items-center justify-between py-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Due Dates</h1>
        </div>

        <div className="w-10" />
      </header>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <input
          type="text"
          placeholder="Search party..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-1/3"
        />

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("overdue")}
          >
            Overdue
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Due List</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : sortedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No due data found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("party")}
                      >
                        Party {renderSortIcon("party")}
                      </TableHead>

                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("lastInvoice")}
                      >
                        Last Invoice {renderSortIcon("lastInvoice")}
                      </TableHead>

                      <TableHead>Credit Period</TableHead>

                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("dueDate")}
                      >
                        Due Date {renderSortIcon("dueDate")}
                      </TableHead>

                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("daysLeft")}
                      >
                        Days Left {renderSortIcon("daysLeft")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedData.map((row, index) => (
                      <TableRow
                        key={index}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          navigate("/ledger/party", {
                            state: { party: row.party },
                          })
                        }
                      >
                        <TableCell>{row.party}</TableCell>
                        <TableCell>{row.lastInvoice}</TableCell>
                        <TableCell>{row.creditPeriod}</TableCell>
                        <TableCell>{row.dueDate}</TableCell>

                        <TableCell
                          className={
                            typeof row.daysLeft === "number"
                              ? getStatusColor(row.daysLeft)
                              : "text-gray-500 font-medium"
                          }
                        >
                          {typeof row.daysLeft === "number"
                            ? row.daysLeft > 0
                              ? `${row.daysLeft} days left`
                              : row.daysLeft === 0
                              ? "Due Today"
                              : `${Math.abs(row.daysLeft)} days overdue`
                            : "No credit period set"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}