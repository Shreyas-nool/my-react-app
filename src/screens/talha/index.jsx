import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, off, remove } from "firebase/database";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

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

const TalhaPurchases = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deletePath, setDeletePath] = useState("");

  const BANK_NAME = "Talha";

  const formatDisplayAmount = (num) => Number(num).toFixed(2);

  useEffect(() => {
    const purchaseRef = ref(db, `phurchase/${BANK_NAME}`);
    const paymentRef = ref(db, "payments");
    const expenseRef = ref(db, "expenses");
    const transferRef = ref(db, "transfers");

    const updateData = (purchases, payments, expenses, transfers) => {
      let temp = [];
      let pending = 0;
      const seenKeys = new Set();

      // ---------------- PURCHASES ----------------
      Object.entries(purchases || {}).forEach(([date, items]) => {
        Object.entries(items || {}).forEach(([key, p]) => {
          const amt = Number(p.amount || p.amountINR || 0);
          pending -= amt;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            temp.push({
              key,
              path: `phurchase/${BANK_NAME}/${date}/${key}`,
              date: p.date || date,
              type: "Purchase",
              amount: amt,
              notes: p.notes || "-",
              from: "-",
            });
          }
        });
      });

      // ---------------- PAYMENTS ----------------
      Object.entries(payments || {}).forEach(([type, names]) => {
        Object.entries(names || {}).forEach(([name, dates]) => {
          Object.entries(dates || {}).forEach(([date, items]) => {
            Object.entries(items || {}).forEach(([txnId, p]) => {
              if (!p || !p.txnId) return;
              const isTalhaPayment =
                (p.fromType === "account" && p.fromName === BANK_NAME) ||
                (p.toType === "account" && p.toName === BANK_NAME);
              if (!isTalhaPayment) return;

              const amt = Number(p.amount || 0);
              if (p.toName === BANK_NAME) pending += amt;
              else pending -= amt;

              if (!seenKeys.has(p.txnId)) {
                seenKeys.add(p.txnId);
                temp.push({
                  key: p.txnId,
                  path: `payments/${type}/${name}/${date}/${txnId}`,
                  date: p.date || date,
                  type: "Payment",
                  amount: amt,
                  notes: p.note || "-",
                  from: p.fromName || "-",
                });
              }
            });
          });
        });
      });

      // ---------------- EXPENSES ----------------
      Object.entries(expenses || {}).forEach(([category, entities]) => {
        Object.entries(entities || {}).forEach(([entityName, items]) => {
          if (entityName !== BANK_NAME) return;
          Object.entries(items || {}).forEach(([id, exp]) => {
            if (!exp || seenKeys.has(id)) return;
            seenKeys.add(id);
            const amt = Number(exp.amount || 0);
            pending -= amt;
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

      // ---------------- TRANSFERS ----------------
      Object.entries(transfers || {}).forEach(([type, names]) => {
        Object.entries(names || {}).forEach(([name, dates]) => {
          Object.entries(dates || {}).forEach(([date, items]) => {
            Object.entries(items || {}).forEach(([key, t]) => {
              if (!t || seenKeys.has(key)) return;
              const amt = Number(t.amount || 0);
              if (t.toName === BANK_NAME) {
                pending += amt;
                temp.push({
                  key,
                  path: `transfers/${type}/${name}/${date}/${key}`,
                  date: t.date || date,
                  type: "Transfer (In)",
                  amount: amt,
                  notes: t.note || "-",
                  from: t.from || "-",
                });
                seenKeys.add(key);
              } else if (t.from === BANK_NAME) {
                pending -= amt;
                temp.push({
                  key,
                  path: `transfers/${type}/${name}/${date}/${key}`,
                  date: t.date || date,
                  type: "Transfer (Out)",
                  amount: amt,
                  notes: t.note || "-",
                  from: `${t.from} → ${t.toName}`,
                });
                seenKeys.add(key);
              }
            });
          });
        });
      });

      temp.sort((a, b) => new Date(b.date) - new Date(a.date));
      pending = Math.round((pending + Number.EPSILON) * 100) / 100;

      setEntries(temp);
      setBalance(pending);
    };

    const unsubPurchase = onValue(purchaseRef, (pSnap) => {
      onValue(paymentRef, (paySnap) => {
        onValue(expenseRef, (expSnap) => {
          onValue(transferRef, (transSnap) => {
            updateData(pSnap.val(), paySnap.val(), expSnap.val(), transSnap.val());
          });
        });
      });
    });

    return () => {
      off(purchaseRef);
      off(paymentRef);
      off(expenseRef);
      off(transferRef);
    };
  }, []);

  const handleDelete = async () => {
    if (!deletePath) return;
    try {
      await remove(ref(db, deletePath));
      setShowDeletePopup(false);
      setDeletePath("");
    } catch (err) {
      console.error(err);
      alert("Error deleting entry");
    }
  };

  const filteredEntries = entries.filter((e) => {
    const entryDate = new Date(e.date);
    if (fromDate && entryDate < fromDate) return false;
    if (toDate && entryDate > toDate) return false;
    return true;
  });

  return (
    <div className="flex flex-col items-center max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between w-full border-b pb-2">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft />
        </Button>

        <h1 className="text-lg font-semibold">{BANK_NAME}</h1>

        <Button
          className="bg-black text-white"
          onClick={() => navigate("/talha/add-purchase")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Purchase
        </Button>
      </header>

      {/* Balance and Date Filter */}
      <div className="bg-white p-5 rounded-xl shadow border w-full flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Balance: {formatDisplayAmount(balance)}
        </h2>
        <div className="flex gap-2 items-center">
          <span>From:</span>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            isClearable
            placeholderText="Start Date"
            className="border p-2 rounded"
          />
          <span>To:</span>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            isClearable
            placeholderText="End Date"
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border p-4 w-full overflow-x-auto">
        <Table className="mx-auto text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-center">Amount</TableHead>
              <TableHead className="text-center">Notes</TableHead>
              <TableHead className="text-center">From/Source</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((e) => (
                <TableRow key={e.key}>
                  <TableCell>
                    {new Date(e.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell
                    className={
                      e.type.includes("Purchase") ||
                      e.type.includes("Expense") ||
                      e.type.includes("Out")
                        ? "text-red-600 font-semibold"
                        : "text-green-600 font-semibold"
                    }
                  >
                    {formatDisplayAmount(e.amount)}
                  </TableCell>
                  <TableCell>{e.notes}</TableCell>
                  <TableCell>{e.from}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => {
                        setDeletePath(e.path);
                        setShowDeletePopup(true);
                      }}
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

      {/* DELETE CONFIRM POPUP */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="font-semibold text-lg mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeletePopup(false);
                  setDeletePath("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalhaPurchases;
