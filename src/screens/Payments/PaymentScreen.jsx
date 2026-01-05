import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PaymentScreen = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  /* ---------------- FETCH PAYMENTS ---------------- */
  useEffect(() => {
    const db = getDatabase();
    const paymentsRef = ref(db, "payments");

    const unsub = onValue(paymentsRef, (snapshot) => {
      const map = new Map(); // map to prevent duplicate txnId

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Loop through types: party / account / bank
        Object.values(data).forEach((typeNode) => {
          Object.values(typeNode).forEach((nameNode) => {
            Object.entries(nameNode).forEach(([date, txns]) => {
              Object.values(txns).forEach((txn) => {
                if (!txn || !txn.txnId || map.has(txn.txnId)) return;

                map.set(txn.txnId, {
                  id: txn.txnId,
                  path: `payments/${txn.toType}/${txn.toName}/${date}/${txn.txnId}`, // path to delete
                  date: txn.date,
                  from: txn.fromName || "-",
                  to: txn.toName || "-",
                  amount: Number(txn.amount || 0),
                  note: txn.note || "-",
                  createdAt: txn.createdAt || 0,
                });
              });
            });
          });
        });
      }

      // Convert map values to array
      setPayments(Array.from(map.values()));
    });

    return () => unsub();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  /* ---------------- FILTER PAYMENTS ---------------- */
  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.from.toLowerCase().includes(q) || p.to.toLowerCase().includes(q);
    const matchesDate = selectedDate
      ? isSameDate(new Date(p.date), selectedDate)
      : true;
    return matchesSearch && matchesDate;
  });

  /* ---------------- DELETE PAYMENT ---------------- */
  const handleDelete = async (path) => {
    if (!window.confirm("Delete this payment?")) return;
    const db = getDatabase();
    await remove(ref(db, path));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-xl font-semibold text-center">Payments Record</h1>

        <Button
          onClick={() => navigate("/payment/add")}
          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 text-sm flex items-center justify-center"
        >
          Add Payment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd-MM-yyyy"
          placeholderText="Select date"
          className="border border-gray-400 rounded px-3 py-2 text-base text-center"
          isClearable
        />
        <input
          type="text"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2 text-base w-60"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-base">
              <th className="border p-3">Date</th>
              <th className="border p-3">From</th>
              <th className="border p-3">To</th>
              <th className="border p-3">Amount</th>
              <th className="border p-3">Notes</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  No payments found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 text-base">
                  <td className="border p-3">{formatDate(p.date)}</td>
                  <td className="border p-3">{p.from}</td>
                  <td className="border p-3">{p.to}</td>
                  <td className="border p-3">{p.amount.toFixed(2)}</td>
                  <td className="border p-3">{p.note}</td>
                  <td className="border p-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentScreen;
