import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, update } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 20;
const BANK_NAME = "SR"; // 🔁 SR / Talha / JR

const round2 = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const BankLedger = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const purchaseRef = ref(db, `phurchase/${BANK_NAME}`);
    const paymentRef = ref(db, "payments");
    const expenseRef = ref(db, "expenses");

    const rebuildLedger = async () => {
      const temp = [];
      const seen = new Set();

      /* ---------------- PURCHASES ---------------- */
      const purchasesSnap = await new Promise((res) =>
        onValue(purchaseRef, res, { onlyOnce: true })
      );
      const purchases = purchasesSnap.val() || {};

      Object.entries(purchases).forEach(([date, items]) => {
        Object.entries(items || {}).forEach(([id, p]) => {
          if (seen.has(id)) return;
          seen.add(id);

          const amt = Number(p.amount || p.amountINR || 0);

          temp.push({
            date: p.date || date,
            type: "Purchase",
            amount: -amt,
            notes: p.notes || "-",
            source: "-",
          });
        });
      });

      /* ---------------- PAYMENTS ---------------- */
      const paymentsSnap = await new Promise((res) =>
        onValue(paymentRef, res, { onlyOnce: true })
      );
      const payments = paymentsSnap.val() || {};

      Object.entries(payments).forEach(([type, names]) => {
        Object.entries(names || {}).forEach(([name, dates]) => {
          Object.entries(dates || {}).forEach(([date, txns]) => {
            Object.entries(txns || {}).forEach(([txnId, p]) => {
              if (!p?.txnId || seen.has(p.txnId)) return;

              const isBank =
                (p.fromType === "account" && p.fromName === BANK_NAME) ||
                (p.toType === "account" && p.toName === BANK_NAME);

              if (!isBank) return;
              seen.add(p.txnId);

              const amt = Number(p.amount || 0);
              const signed =
                p.toName === BANK_NAME ? amt : -amt;

              temp.push({
                date: p.date || date,
                type: "Payment",
                amount: signed,
                notes: p.note || "-",
                source:
                  signed > 0
                    ? `from ${p.fromName}`
                    : `to ${p.toName}`,
              });
            });
          });
        });
      });

      /* ---------------- EXPENSES ---------------- */
      const expensesSnap = await new Promise((res) =>
        onValue(expenseRef, res, { onlyOnce: true })
      );
      const expenses = expensesSnap.val() || {};

      Object.entries(expenses).forEach(([cat, entities]) => {
        Object.entries(entities || {}).forEach(([entity, items]) => {
          if (entity !== BANK_NAME) return;

          Object.entries(items || {}).forEach(([id, e]) => {
            if (seen.has(id)) return;
            seen.add(id);

            const amt = Number(e.amount || 0);

            temp.push({
              date: e.date || new Date().toISOString(),
              type: "Expense",
              amount: -amt,
              notes: e.expenseFor || "-",
              source: entity,
            });
          });
        });
      });

      /* ---------------- SORT + RUNNING BALANCE ---------------- */
      temp.sort((a, b) => new Date(a.date) - new Date(b.date));

      let rb = 0;
      const final = temp.map((e) => {
        rb += e.amount;
        return { ...e, runningBalance: round2(rb) };
      });

      const finalBalance = round2(rb);

      setEntries(final);
      setBalance(finalBalance);

      /* ✅ AUTO-SYNC BALANCE TO ACCOUNTS */
      await update(ref(db, `accounts/${BANK_NAME}`), {
        balance: finalBalance,
        updatedAt: new Date().toISOString(),
      });

      const lastPage =
        Math.ceil(final.length / ITEMS_PER_PAGE) || 1;
      setCurrentPage(lastPage);
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
  }, []);

  /* ---------------- FILTER ---------------- */
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [entries, fromDate, toDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-9 w-9 p-0"
        >
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

      {/* BANK NAME */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">{BANK_NAME}</h2>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded shadow bg-white">
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
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">No entries</td>
              </tr>
            ) : (
              pageData.map((e, i) => (
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
                      e.runningBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {e.runningBalance.toFixed(2)}
                  </td>
                </tr>
              ))
            )}

            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="border p-3 text-right">
                Current Balance
              </td>
              <td
                className={`border p-3 ${
                  balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {balance.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-center gap-2">
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
