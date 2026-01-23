import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, update, get } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 99;
const BANK_NAME = "Mumbai Payment"; // 🔁 Change for SR / JR / etc.

// Round to 2 decimals safely
const round2 = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const BankLedger = () => {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [accountExists, setAccountExists] = useState(null);

  // ---------------- CHECK ACCOUNT ----------------
  useEffect(() => {
    const checkAccount = async () => {
      const snap = await get(ref(db, `accounts/${BANK_NAME}`));
      if (!snap.exists()) {
        setAccountExists(false);
      } else {
        setAccountExists(true);
        setOpeningBalance(Number(snap.val().openingBalance || 0));
      }
      setLoading(false);
    };
    checkAccount();
  }, []);

  // ---------------- BUILD LEDGER ----------------
  useEffect(() => {
    if (!accountExists) return;

    const purchaseRef = ref(db, `phurchase/${BANK_NAME}`);
    const paymentRef = ref(db, "payments");
    const expenseRef = ref(db, "expenses");

    const rebuildLedger = async () => {
      setLoading(true);

      const temp = [];
      const seen = new Set();

      /* PURCHASES */
      const purchasesSnap = await new Promise((res) =>
        onValue(purchaseRef, res, { onlyOnce: true })
      );
      const purchases = purchasesSnap.val() || {};
      Object.values(purchases).forEach((items) =>
        Object.values(items || {}).forEach((p) => {
          if (seen.has(p.id)) return;
          seen.add(p.id);
          temp.push({
            date: p.date,
            type: "Purchase",
            amount: -Number(p.amount || 0),
            notes: p.notes || "-",
            source: "-",
          });
        })
      );

      /* PAYMENTS */
      const paymentsSnap = await new Promise((res) =>
        onValue(paymentRef, res, { onlyOnce: true })
      );
      const payments = paymentsSnap.val() || {};
      Object.values(payments).forEach((names) =>
        Object.values(names || {}).forEach((dates) =>
          Object.values(dates || {}).forEach((txns) =>
            Object.values(txns || {}).forEach((p) => {
              if (!p.txnId || seen.has(p.txnId)) return;

              const isBank =
                (p.fromType === "account" && p.fromName === BANK_NAME) ||
                (p.toType === "account" && p.toName === BANK_NAME);
              if (!isBank) return;

              seen.add(p.txnId);
              const signed =
                p.toName === BANK_NAME
                  ? Number(p.amount)
                  : -Number(p.amount);

              temp.push({
                date: p.date,
                type: "Payment",
                amount: signed,
                notes: p.note || "-",
                source: signed > 0 ? `from ${p.fromName}` : `to ${p.toName}`,
              });
            })
          )
        )
      );

      /* EXPENSES */
      const expensesSnap = await new Promise((res) =>
        onValue(expenseRef, res, { onlyOnce: true })
      );
      const expenses = expensesSnap.val() || {};
      Object.entries(expenses).forEach(([_, entities]) =>
        Object.entries(entities || {}).forEach(([entity, items]) => {
          if (entity !== BANK_NAME) return;
          Object.values(items || {}).forEach((e) => {
            if (seen.has(e.id)) return;
            seen.add(e.id);
            temp.push({
              date: e.date,
              type: "Expense",
              amount: -Number(e.amount || 0),
              notes: e.expenseFor || "-",
              source: entity,
            });
          });
        })
      );

      /* SORT + RUNNING BALANCE */
      temp.sort((a, b) => new Date(a.date) - new Date(b.date));

      let rb = openingBalance;
      // ⚠️ IMPORTANT:
      // Running balance ALWAYS starts from opening balance
      // Do NOT reset based on date filter
      const final = temp.map((e) => {
        rb += e.amount;
        return { ...e, runningBalance: round2(rb) };
      });

      const finalBalance = round2(rb);

      setEntries(final);
      setBalance(finalBalance);

      // Auto-sync account balance
      await update(ref(db, `accounts/${BANK_NAME}`), {
        balance: finalBalance,
        updatedAt: new Date().toISOString(),
      });

      setLoading(false);
    };

    rebuildLedger();

    const u1 = onValue(purchaseRef, rebuildLedger);
    const u2 = onValue(paymentRef, rebuildLedger);
    const u3 = onValue(expenseRef, rebuildLedger);

    return () => {
      off(purchaseRef, "value", u1);
      off(paymentRef, "value", u2);
      off(expenseRef, "value", u3);
    };
  }, [accountExists, openingBalance]);

  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (d < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }

      return true;
    });
  }, [entries, fromDate, toDate]);

  // 🔁 Reset page on date filter change
  useEffect(() => {
      setCurrentPage(1);
  }, [fromDate, toDate]);

  // ---------------- DATE-AWARE PAGINATION ----------------
  const pages = useMemo(() => {
    // 🔥 FILTER MODE → single page
    if (fromDate || toDate) {
      return filtered.length ? [filtered] : [];
    }

    // 📅 NORMAL MODE → one page per date
    const grouped = {};
    filtered.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    const result = [];
    Object.keys(grouped)
      .sort()
      .forEach((k) => {
        for (let i = 0; i < grouped[k].length; i += ITEMS_PER_PAGE) {
          result.push(grouped[k].slice(i, i + ITEMS_PER_PAGE));
        }
      });
    return result;
  }, [filtered]);

  const totalPages = pages.length;
  const pageData = pages[currentPage - 1] || [];

  // 🔁 ALWAYS open on last page
  // ⚠️ DO NOT REMOVE — required for correct UX
  useEffect(() => {
    if (!fromDate && !toDate && pages.length > 0) {
      setCurrentPage(pages.length);
    }
  }, [pages.length, fromDate, toDate]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!accountExists)
    return (
      <div className="p-4 text-center text-red-600">
        Account "{BANK_NAME}" does not exist.
      </div>
    );

  // ---------------- UI ----------------
  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <DatePicker
          selected={fromDate}
          onChange={setFromDate}
          placeholderText="From"
          isClearable
          className="border px-2 py-1 text-sm rounded"
        />
        <DatePicker
          selected={toDate}
          onChange={setToDate}
          placeholderText="To"
          isClearable
          className="border px-2 py-1 text-sm rounded"
        />
      </div>

      <h2 className="text-center text-xl font-semibold">{BANK_NAME}</h2>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-center border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3">Date</th>
              <th className="border p-3">Type</th>
              <th className="border p-3">Source</th>
              <th className="border p-3">Notes</th>
              <th className="border p-3">Amount</th>
              <th className="border p-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {currentPage === 1 && (
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border p-3 text-right">
                  Opening Balance
                </td>
                <td className="border p-3">
                  {openingBalance.toFixed(2)}
                </td>
              </tr>
            )}

            {pageData.map((e, i) => (
              <tr key={i}>
                <td className="border p-3">
                  {new Date(e.date).toLocaleDateString("en-GB")}
                </td>
                <td className="border p-3">{e.type}</td>
                <td className="border p-3">{e.source}</td>
                <td className="border p-3">{e.notes}</td>
                <td
                  className={`border p-3 font-semibold ${
                    e.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(e.amount).toFixed(2)}
                </td>
                <td
                  className={`border p-3 font-semibold ${
                    e.runningBalance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {e.runningBalance.toFixed(2)}
                </td>
              </tr>
            ))}

            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="border p-3 text-right">
                Current Balance
              </td>
              <td className="border p-3">{balance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-center gap-4">
        <Button
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Prev
        </Button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default BankLedger;
