import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

/* ================= HELPERS ================= */
const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date)) return "-";
  return `${date.getDate().toString().padStart(2, "0")}/${
    (date.getMonth() + 1).toString().padStart(2, "0")
  }/${date.getFullYear()}`;
};

const formatNumber = (n) => Number(n || 0).toFixed(2);

/* ================= COMPONENT ================= */
export default function BankDetails() {
  const navigate = useNavigate();
  const { bankId } = useParams();

  const [bankName, setBankName] = useState("");

  const [expenseEntries, setExpenseEntries] = useState([]);
  const [paymentEntries, setPaymentEntries] = useState([]);
  const [transferEntries, setTransferEntries] = useState([]);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [balance, setBalance] = useState(0);

  /* ================= LOAD BANK NAME ================= */
  useEffect(() => {
    const bankRef = ref(db, `banks/${bankId}`);
    return onValue(bankRef, (snap) => {
      if (snap.exists()) {
        setBankName(snap.val().bankName || "Bank");
        if (snap.val().balance !== undefined) setBalance(snap.val().balance);
      }
    });
  }, [bankId]);

  /* ================= EXPENSES ================= */
  useEffect(() => {
    if (!bankName) return;

    const expenseRef = ref(db, `expenses/bank/${bankName}`);
    return onValue(expenseRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        Object.values(snap.val()).forEach((e) => {
          if (!e.amount || !e.date) return;

          list.push({
            id: `exp-${e.createdAt}`,
            date: e.date,
            type: "DEBIT",
            from: bankName,
            to: e.expenseFor || "-",
            amount: Number(e.amount),
            note: e.entity || "-",
            createdAt: new Date(e.createdAt).getTime(),
            entryType: "EXPENSE",
          });
        });
      }
      setExpenseEntries(list);
    });
  }, [bankName]);

  /* ================= PAYMENTS ================= */
  useEffect(() => {
    if (!bankName) return;

    const paymentRef = ref(db, `payments/bank/${bankName}`);
    return onValue(paymentRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        Object.values(snap.val()).forEach((dateNode) => {
          Object.values(dateNode).forEach((p) => {
            if (!p.amount || !p.date) return;

            list.push({
              id: `pay-${p.createdAt}`,
              date: p.date,
              type: "CREDIT",
              from: p.fromName || "-",
              to: p.toName || "-",
              amount: Number(p.amount),
              note: p.note || "-",
              createdAt: Number(p.createdAt),
              entryType: "PAYMENT",
            });
          });
        });
      }
      setPaymentEntries(list);
    });
  }, [bankName]);

  /* ================= TRANSFERS ================= */
  useEffect(() => {
    if (!bankName) return;

    const transferRef = ref(db, `transfers/bank/${bankName}`);
    return onValue(transferRef, (snap) => {
      const list = [];
      if (!snap.exists()) {
        setTransferEntries([]);
        return;
      }

      Object.entries(snap.val()).forEach(([date, dateNode]) => {
        Object.values(dateNode).forEach((t) => {
          if (!t.amount || t.toType !== "bank" || t.toName !== bankName) return;

          list.push({
            id: `tr-${t.createdAt}`,
            date,
            type: "CREDIT",
            from: t.from || "-",
            to: bankName,
            amount: Number(t.amount),
            note: t.note || "-",
            createdAt: Number(t.createdAt || 0),
            entryType: "TRANSFER",
          });
        });
      });

      setTransferEntries(list);
    });
  }, [bankName]);

  /* ================= COMBINE + SORT ================= */
  const entries = useMemo(() => {
    return [...expenseEntries, ...paymentEntries, ...transferEntries].sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }, [expenseEntries, paymentEntries, transferEntries]);

  /* ================= FILTER + RUNNING BALANCE ================= */
  const filteredEntries = useMemo(() => {
    let running = 0;
    return entries
      .filter((e) => {
        const d = new Date(e.date).getTime();
        if (fromDate && d < new Date(fromDate).getTime()) return false;
        if (toDate && d > new Date(toDate).getTime()) return false;
        return true;
      })
      .map((e) => {
        running += e.type === "CREDIT" ? e.amount : -e.amount;
        return { ...e, balance: running };
      });
  }, [entries, fromDate, toDate]);

  /* ================= CALCULATE TOP BALANCE & UPDATE FIREBASE ================= */
  useEffect(() => {
    let total = 0;
    entries.forEach((e) => {
      total += e.type === "CREDIT" ? e.amount : -e.amount;
    });
    setBalance(total);

    // Update Firebase
    if (bankName) {
      set(ref(db, `banks/${bankId}/balance`), total);
    }
  }, [entries, bankName, bankId]);

  /* ================= EXPORT ================= */
  const exportCSV = () => {
    const header = ["Date", "Source", "From", "To", "Type", "Amount", "Balance", "Note"];
    const body = filteredEntries.map((r) => [
      formatDate(r.date),
      r.entryType,
      r.from,
      r.to,
      r.type,
      r.amount,
      r.balance,
      r.note,
    ]);
    const csv = [header, ...body].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bankName}-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= UI ================= */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{bankName}</h1>
        <Button size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </header>

      {/* Top Balance + Date Filter */}
      <div className="bg-white p-5 rounded-xl shadow border w-full flex justify-between items-center">
        <h2 className="text-xl font-bold">Balance: {formatNumber(balance)}</h2>
        <div className="flex gap-2 items-center">
          <span>From:</span>
          <input
            type="date"
            className="border p-2 rounded"
            value={fromDate || ""}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span>To:</span>
          <input
            type="date"
            className="border p-2 rounded"
            value={toDate || ""}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm text-center">
              <thead className="bg-muted">
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Source</th>
                  <th className="border p-2">From</th>
                  <th className="border p-2">To</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Balance</th>
                  <th className="border p-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((r) => (
                    <tr key={r.id}>
                      <td className="border p-2">{formatDate(r.date)}</td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.entryType === "EXPENSE"
                              ? "bg-red-100 text-red-700"
                              : r.entryType === "PAYMENT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {r.entryType}
                        </span>
                      </td>
                      <td className="border p-2">{r.from}</td>
                      <td className="border p-2">{r.to}</td>
                      <td
                        className={`border p-2 font-semibold ${
                          r.type === "CREDIT"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.type}
                      </td>
                      <td className="border p-2">{formatNumber(r.amount)}</td>
                      <td className="border p-2 font-semibold">
                        {formatNumber(r.balance)}
                      </td>
                      <td className="border p-2">{r.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
