// src/screens/talha/TalhaPurchases.jsx
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

  const BANK_NAME = "Talha";

  const formatDisplayAmount = (num) => Number(num).toFixed(2);

  useEffect(() => {
    const purchaseRef = ref(db, "phurchase/Talha");
    const paymentRef = ref(db, "payments");

    const loadData = (purchaseSnap, paymentSnap) => {
      const purchases = purchaseSnap.val() || {};
      const payments = paymentSnap.val() || {};

      let temp = [];
      let pending = 0;

      // ---------------- PURCHASES ----------------
      Object.entries(purchases).forEach(([date, items]) => {
        Object.entries(items || {}).forEach(([key, p]) => {
          const amt = Number(p.amount || p.amountINR || 0);
          pending -= amt;

          temp.push({
            key,
            path: `phurchase/Talha/${date}/${key}`,
            date: p.date || date,
            type: "Purchase",
            amount: amt,
            notes: p.notes || "-",
            from: "-",
          });
        });
      });

      // ---------------- PAYMENTS ----------------
      Object.entries(payments).forEach(([partyName, partyNode]) => {
        Object.entries(partyNode || {}).forEach(([date, dateNode]) => {
          Object.entries(dateNode || {}).forEach(([key, p]) => {
            if (p.toType === "account" && p.toName === BANK_NAME && Number(p.amount)) {
              const amt = Number(p.amount);
              pending += amt;

              temp.push({
                key,
                path: `payments/${partyName}/${date}/${key}`,
                date: p.date,
                type: "Payment",
                amount: amt,
                notes: p.note || "-",
                from: p.fromName || "-",
              });
            }
          });
        });
      });

      // ---------------- Sort newest first ----------------
      temp.sort((a, b) => Number(b.key) - Number(a.key));

      pending = Math.round((pending + Number.EPSILON) * 100) / 100;

      setEntries(temp);
      setBalance(pending);
    };

    const unsubPurchase = onValue(purchaseRef, (pSnap) => {
      const unsubPayment = onValue(paymentRef, (paySnap) => {
        loadData(pSnap, paySnap);
      });
      return () => off(paymentRef);
    });

    return () => {
      off(purchaseRef);
      off(paymentRef);
    };
  }, []);

  const handleDelete = async (path) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await remove(ref(db, path));
      alert("Entry deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting entry");
    }
  };

  // Filter entries by from/to date
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

        <h1 className="text-lg font-semibold">Talha</h1>

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
        <h2 className="text-xl font-bold">Balance: {formatDisplayAmount(balance)}</h2>
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
                  <TableCell>{e.date}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell
                    className={
                      e.type === "Purchase"
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

export default TalhaPurchases;
