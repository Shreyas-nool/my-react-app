import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, remove, set } from "firebase/database";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input"; // ✅ Import Input
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

const SRPurchases = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [testAdd, setTestAdd] = useState(""); // ✅ Test add money input

  const BANK_NAME = "SR";

  const formatAmount = (num) => Number(num).toFixed(2);

  useEffect(() => {
    const paymentsRef = ref(db, `payments/account/${BANK_NAME}`);
    const expenseRef = ref(db, "expenses"); // GLOBAL EXPENSES NODE
    const transferRef = ref(db, "transfers");
    const srBalanceRef = ref(db, `accounts/${BANK_NAME}/balance`);

    let allPayments = {};
    let allExpenses = {};
    let allTransfers = {};

    const updateEntries = () => {
      let temp = [];
      let bal = 0;
      const seenKeys = new Set();

      // ----------------- PAYMENTS -----------------
      Object.entries(allPayments || {}).forEach(([date, items]) => {
        Object.entries(items || {}).forEach(([txnId, p]) => {
          if (!p || !p.txnId || seenKeys.has(p.txnId)) return;
          seenKeys.add(p.txnId);

          const amt = Number(p.amount || 0);
          if (p.toType === "account" && p.toName === BANK_NAME) bal += amt;
          if (p.fromType === "account" && p.fromName === BANK_NAME) bal -= amt;

          temp.push({
            key: p.txnId,
            path: `payments/account/${BANK_NAME}/${date}/${txnId}`,
            date: p.date || date,
            type: "Payment",
            amount: amt,
            notes: p.note || "-",
            from: p.fromName || "-",
          });
        });
      });

      // ----------------- EXPENSES -----------------
      Object.entries(allExpenses || {}).forEach(([category, entities]) => {
        Object.entries(entities || {}).forEach(([entityName, items]) => {
          if (entityName !== BANK_NAME) return;
          Object.entries(items || {}).forEach(([id, exp]) => {
            if (!exp || seenKeys.has(id)) return;
            seenKeys.add(id);

            const amt = Number(exp.amount || 0);
            bal -= amt;

            temp.push({
              key: id,
              path: `expenses/${category}/${entityName}/${id}`,
              date: exp.date || new Date().toISOString(),
              type: "Expense",
              amount: amt,
              notes: exp.expenseFor || "-",
              from: entityName,
            });
          });
        });
      });

      // ----------------- TRANSFERS -----------------
      Object.entries(allTransfers || {}).forEach(([type, names]) => {
        Object.entries(names || {}).forEach(([name, dates]) => {
          Object.entries(dates || {}).forEach(([date, items]) => {
            Object.entries(items || {}).forEach(([key, t]) => {
              if (!t || seenKeys.has(key)) return;

              const amt = Number(t.amount || 0);

              if (t.from === BANK_NAME) {
                bal -= amt;
                temp.push({
                  key,
                  path: `transfers/${type}/${name}/${date}/${key}`,
                  date: t.date || date,
                  type: "Transfer",
                  amount: amt,
                  notes: t.note || "-",
                  from: `${t.from} → ${t.toName || name}`,
                });
                seenKeys.add(key);
              } else if (t.toName === BANK_NAME) {
                bal += amt;
                temp.push({
                  key,
                  path: `transfers/${type}/${name}/${date}/${key}`,
                  date: t.date || date,
                  type: "Transfer",
                  amount: amt,
                  notes: t.note || "-",
                  from: t.from || "-",
                });
                seenKeys.add(key);
              }
            });
          });
        });
      });

      temp.sort((a, b) => new Date(b.date) - new Date(a.date));

      setEntries(temp);
      setBalance(Math.round((bal + Number.EPSILON) * 100) / 100);

      // Update SR balance in DB
      set(srBalanceRef, Math.round((bal + Number.EPSILON) * 100) / 100);
    };

    const unsubPayments = onValue(paymentsRef, (snap) => {
      allPayments = snap.val() || {};
      updateEntries();
    });

    const unsubExpenses = onValue(expenseRef, (snap) => {
      allExpenses = snap.val() || {};
      updateEntries();
    });

    const unsubTransfers = onValue(transferRef, (snap) => {
      allTransfers = snap.val() || {};
      updateEntries();
    });

    return () => {
      off(paymentsRef);
      off(expenseRef);
      off(transferRef);
    };
  }, []);

  const handleDelete = async (path) => {
    if (!window.confirm("Delete this entry?")) return;
    await remove(ref(db, path));
  };

  const filtered = entries.filter((e) => {
    const d = new Date(e.date);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-2">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft />
        </Button>

        <h1 className="text-lg font-semibold">{BANK_NAME}</h1>

        <Button
          className="bg-black text-white"
          onClick={() => navigate("/sr/transfer-money")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Transfer Money
        </Button>
      </div>

      {/* BALANCE & TEST INPUT */}
      <div className="bg-white p-5 rounded-xl shadow border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-xl font-bold">
          Balance: ₹{formatAmount(balance)}
        </h2>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Test add money input */}
          <Input
            type="number"
            placeholder="Add money (test)"
            value={testAdd}
            onChange={(e) => setTestAdd(e.target.value)}
            className="w-40"
          />
          <Button
            className="bg-green-600 text-white"
            onClick={() => {
              const amt = Number(testAdd);
              if (!amt) return;
              const newBal = Math.round((balance + amt + Number.EPSILON) * 100) / 100;
              setBalance(newBal);
              set(ref(db, `accounts/${BANK_NAME}/balance`), newBal);
              setTestAdd("");
            }}
          >
            Add
          </Button>

          <DatePicker
            selected={fromDate}
            onChange={setFromDate}
            isClearable
            placeholderText="From"
            className="border p-2 rounded"
          />
          <DatePicker
            selected={toDate}
            onChange={setToDate}
            isClearable
            placeholderText="To"
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.key}>
                  <TableCell>
                    {new Date(e.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell
                    className={
                      e.type === "Expense" || e.type === "Transfer"
                        ? "text-red-600 font-semibold"
                        : "text-green-600 font-semibold"
                    }
                  >
                    ₹{formatAmount(e.amount)}
                  </TableCell>
                  <TableCell>{e.notes}</TableCell>
                  <TableCell>{e.from}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleDelete(e.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SRPurchases;
