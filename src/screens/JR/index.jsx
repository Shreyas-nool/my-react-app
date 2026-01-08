import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, update } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const JRPurchasesLedger = () => {
  const navigate = useNavigate();

  const BANK_NAME = "JR";
  const itemsPerPage = 20;

  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const round2 = (n) =>
    Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    setLoading(true);

    const purchaseRef = ref(db, `phurchase/${BANK_NAME}`);
    const paymentRef = ref(db, "payments");
    const expenseRef = ref(db, "expenses");

    const handleUpdate = async () => {
      const temp = [];
      const seenKeys = new Set();

      /* -------- PURCHASES -------- */
      const purchasesSnap = await new Promise((res) =>
        onValue(purchaseRef, res, { onlyOnce: true })
      );
      const purchases = purchasesSnap.val() || {};

      Object.entries(purchases).forEach(([date, items]) => {
        Object.entries(items || {}).forEach(([key, p]) => {
          if (seenKeys.has(key)) return;
          seenKeys.add(key);

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

      /* -------- PAYMENTS -------- */
      const paymentsSnap = await new Promise((res) =>
        onValue(paymentRef, res, { onlyOnce: true })
      );
      const payments = paymentsSnap.val() || {};

      Object.entries(payments).forEach(([type, names]) => {
        Object.entries(names || {}).forEach(([name, dates]) => {
          Object.entries(dates || {}).forEach(([date, items]) => {
            Object.entries(items || {}).forEach(([txnId, p]) => {
              if (!p?.txnId || seenKeys.has(p.txnId)) return;

              const isJR =
                (p.fromType === "account" && p.fromName === BANK_NAME) ||
                (p.toType === "account" && p.toName === BANK_NAME);

              if (!isJR) return;
              seenKeys.add(p.txnId);

              const amt = Number(p.amount || 0);
              const signedAmt =
                p.toName === BANK_NAME ? amt : -amt;

              temp.push({
                date: p.date || date,
                type: "Payment",
                amount: signedAmt,
                notes: p.note || "-",
                source:
                  signedAmt > 0
                    ? `from ${p.fromName}`
                    : `to ${p.toName}`,
              });
            });
          });
        });
      });

      /* -------- EXPENSES -------- */
      const expensesSnap = await new Promise((res) =>
        onValue(expenseRef, res, { onlyOnce: true })
      );
      const expenses = expensesSnap.val() || {};

      Object.entries(expenses).forEach(([category, entities]) => {
        Object.entries(entities || {}).forEach(([entity, items]) => {
          if (entity !== BANK_NAME) return;

          Object.entries(items || {}).forEach(([id, exp]) => {
            if (seenKeys.has(id)) return;
            seenKeys.add(id);

            const amt = Number(exp.amount || 0);

            temp.push({
              date: exp.date || new Date().toISOString(),
              type: "Expense",
              amount: -amt,
              notes: exp.expenseFor || "-",
              source: entity,
            });
          });
        });
      });

      /* -------- SORT + RUNNING BALANCE -------- */
      temp.sort((a, b) => new Date(a.date) - new Date(b.date));

      let rb = 0;
      const final = temp.map((e) => {
        rb += e.amount;
        return { ...e, runningBalance: round2(rb) };
      });

      const finalBalance = round2(rb);

      setEntries(final);
      setBalance(finalBalance);

      /* ✅ AUTO-SYNC JR BALANCE */
      await update(ref(db, `accounts/${BANK_NAME}`), {
        balance: finalBalance,
        updatedAt: new Date().toISOString(),
      });

      const lastPage =
        Math.ceil(final.length / itemsPerPage) || 1;
      setCurrentPage(lastPage);
      setLoading(false);
    };

    handleUpdate();

    const u1 = onValue(purchaseRef, handleUpdate);
    const u2 = onValue(paymentRef, handleUpdate);
    const u3 = onValue(expenseRef, handleUpdate);

    return () => {
      off(purchaseRef, "value", u1);
      off(paymentRef, "value", u2);
      off(expenseRef, "value", u3);
    };
  }, []);

  /* -------- FILTER -------- */
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [entries, fromDate, toDate]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginated = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          className="border rounded px-2 py-1 text-sm"
        />
        <DatePicker
          selected={toDate}
          onChange={setToDate}
          placeholderText="To"
          isClearable
          className="border rounded px-2 py-1 text-sm"
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">No entries found</td>
              </tr>
            ) : (
              paginated.map((e, i) => (
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

            {/* CURRENT BALANCE */}
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

export default JRPurchasesLedger;
