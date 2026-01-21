import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, get, update, remove } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 20;
const BANK_NAME = "Malad Payment";
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const BankLedger = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [accountExists, setAccountExists] = useState(null); // null = loading, false = doesn't exist

  const handleDeleteExpense = async (e) => {
  if (!window.confirm("Delete this expense?")) return;

  const expenseRef = ref(
    db,
    `expenses/${e.category}/${BANK_NAME}/${e.id}`
  );

  await remove(expenseRef);
};

  // ---------------- CHECK IF ACCOUNT EXISTS ----------------
  useEffect(() => {
    const checkAccount = async () => {
      setLoading(true);
      const accountSnap = await get(ref(db, `accounts/${BANK_NAME}`));
      if (!accountSnap.exists()) {
        setAccountExists(false); // account does not exist
        setLoading(false);
        return;
      }
      const accData = accountSnap.val();
      setAccountExists(true);
      setOpeningBalance(Number(accData.openingBalance || 0));
      setLoading(false);
    };
    checkAccount();
  }, []);

  // ---------------- FETCH LEDGER DATA ----------------
  useEffect(() => {
    if (!accountExists) return; // only fetch if account exists
    setLoading(true);

    const purchaseRef = ref(db, `phurchase/${BANK_NAME}`);
    const paymentRef = ref(db, "payments");
    const expenseRef = ref(db, "expenses");

    const rebuildLedger = async () => {
      const temp = [];
      const seen = new Set();

      // ---------- PURCHASES ----------
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

      // ---------- PAYMENTS ----------
      const paymentsSnap = await new Promise((res) =>
        onValue(paymentRef, res, { onlyOnce: true })
      );
      const payments = paymentsSnap.val() || {};
      Object.entries(payments).forEach(([_, names]) => {
        Object.entries(names || {}).forEach(([__, dates]) => {
          Object.entries(dates || {}).forEach(([date, txns]) => {
            Object.entries(txns || {}).forEach(([txnId, p]) => {
              if (!p?.txnId || seen.has(p.txnId)) return;
              const isAccount =
                (p.fromType === "account" && p.fromName === BANK_NAME) ||
                (p.toType === "account" && p.toName === BANK_NAME);
              if (!isAccount) return;
              seen.add(p.txnId);
              const amt = Number(p.amount || 0);
              const signed = p.toName === BANK_NAME ? amt : -amt;
              temp.push({
                date: p.date || date,
                type: "Payment",
                amount: signed,
                notes: p.note || "-",
                source: signed > 0 ? `from ${p.fromName}` : `to ${p.toName}`,
              });
            });
          });
        });
      });

      // ---------- EXPENSES ----------
      const expensesSnap = await new Promise((res) =>
        onValue(expenseRef, res, { onlyOnce: true })
      );
      const expenses = expensesSnap.val() || {};
      Object.entries(expenses).forEach(([_, entities]) => {
        Object.entries(entities || {}).forEach(([entity, items]) => {
          if (entity !== BANK_NAME) return;
          Object.entries(items || {}).forEach(([id, e]) => {
            if (seen.has(id)) return;
            seen.add(id);
            const amt = Number(e.amount || 0);
            temp.push({
              id,                 // 👈 expense id
              category: _,        // 👈 category (account / bank / etc)
              date: e.date || new Date().toISOString(),
              type: "Expense",
              amount: -amt,
              notes: e.expenseFor || "-",
              source: entity,
            });
          });
        });
      });

      // ---------- SORT + RUNNING BALANCE ----------
      temp.sort((a, b) => new Date(a.date) - new Date(b.date));
      let rb = openingBalance; // start from opening balance
      const finalEntries = temp.map((e) => {
        rb += e.amount;
        return { ...e, runningBalance: round2(rb) };
      });
      const finalBalance = round2(rb);

      setEntries(finalEntries);
      setBalance(finalBalance);

      await update(ref(db, `accounts/${BANK_NAME}`), {
        balance: finalBalance,
        updatedAt: new Date().toISOString(),
      });

      setCurrentPage(Math.ceil(finalEntries.length / ITEMS_PER_PAGE) || 1);
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

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [entries, fromDate, toDate]);

// ---------------- DATE-AWARE PAGINATION ----------------
const pages = useMemo(() => {
  const grouped = {};
  filtered.forEach((e) => {
    const d = new Date(e.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  const result = [];
  Object.keys(grouped)
    .sort()
    .forEach((dateKey) => {
      const list = grouped[dateKey];
      for (let i = 0; i < list.length; i += ITEMS_PER_PAGE) {
        result.push({ dateKey, entries: list.slice(i, i + ITEMS_PER_PAGE) });
      }
    });

  return result;
}, [filtered]);

const totalPages = pages.length;
const pageData = pages[currentPage - 1]?.entries || [];

  if (loading) return <div className="p-4">Loading...</div>;
  if (!accountExists)
    return (
      <div className="p-4 text-center text-red-600">
        Account "{BANK_NAME}" does not exist.
      </div>
    );

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
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

        <Button
          onClick={() =>
            navigate("/expense/create-expense", {
              state: {
                lockCategory: "account",
                lockEntity: {
                  id: BANK_NAME,
                  name: BANK_NAME,
                },
              },
            })
          }
          className="h-9 px-3 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* TITLE */}
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
              <th className="border p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* OPENING BALANCE */}
            {currentPage === 1 && (
            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="border p-3 text-right">
                Opening Balance
              </td>
              <td
                className={`border p-3 ${
                  openingBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {openingBalance.toFixed(2)}
              </td>
              <td className="border p-3"></td>
            </tr>
            )}

            {/* LEDGER ENTRIES */}
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  No entries
                </td>
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
                      e.runningBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {e.runningBalance.toFixed(2)}
                  </td>
                  <td className="border p-3">
                    {e.type === "Expense" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteExpense(e)}
                      >
                        Delete
                      </Button>
                    )}
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

export default BankLedger;
