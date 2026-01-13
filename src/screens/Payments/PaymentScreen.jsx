import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 20;

const PaymentScreen = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- FETCH PAYMENTS ---------------- */
  useEffect(() => {
    const db = getDatabase();
    const paymentsRef = ref(db, "payments");

    const unsub = onValue(paymentsRef, (snapshot) => {
      const map = new Map();

      if (snapshot.exists()) {
        const data = snapshot.val();

        Object.entries(data).forEach(([type, names]) => {
          Object.entries(names || {}).forEach(([name, dates]) => {
            Object.entries(dates || {}).forEach(([date, txns]) => {
              Object.entries(txns || {}).forEach(([txnId, txn]) => {
                if (!txn || !txn.txnId) return;

                if (!map.has(txn.txnId)) {
                  map.set(txn.txnId, {
                    id: txn.txnId,
                    date: txn.date || date,
                    createdAt: txn.createdAt || Number(txn.txnId),
                    from: txn.fromName || "-",
                    to: txn.toName || "-",
                    amount: Number(txn.amount || 0),
                    note: txn.note || "-",
                    deletePaths: [
                      `payments/${txn.fromType}/${txn.fromName}/${date}/${txn.txnId}`,
                      `payments/${txn.toType}/${txn.toName}/${date}/${txn.txnId}`,
                    ],
                  });
                }
              });
            });
          });
        });
      }

      const sorted = Array.from(map.values()).sort(
        (a, b) => b.createdAt - a.createdAt
      );

      setPayments(sorted);
    });

    return () => unsub();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  /* ---------------- FILTER ---------------- */
  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.from.toLowerCase().includes(q) ||
      p.to.toLowerCase().includes(q);

    const matchesDate = selectedDate
      ? isSameDate(new Date(p.date), selectedDate)
      : true;

    return matchesSearch && matchesDate;
  });

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDate]);

  /* ---------------- TOTAL (ALL FILTERED) ---------------- */
  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (paths) => {
    if (!window.confirm("Delete this payment everywhere?")) return;
    const db = getDatabase();
    await Promise.all(paths.map((p) => remove(ref(db, p))));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-semibold">Payments Record</h1>

        <Button
          onClick={() => navigate("/payment/add")}
          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 text-sm"
        >
          Add Payment
        </Button>
      </div>

      {/* FILTERS */}
      <div className="flex justify-center gap-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholderText="Select date"
          className="border rounded px-3 py-2"
          isClearable
          dateFormat="dd-MM-yyyy"
        />

        <input
          type="text"
          placeholder="Search party / account..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 w-60"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-center">
          <thead className="bg-gray-100 text-lg">
            <tr>
              <th className="border p-3">Date</th>
              <th className="border p-3">From</th>
              <th className="border p-3">To</th>
              <th className="border p-3">Amount</th>
              <th className="border p-3">Notes</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="border p-3">{formatDate(p.date)}</td>
                  <td className="border p-3">{p.from}</td>
                  <td className="border p-3">{p.to}</td>
                  <td className="border p-3">{p.amount.toFixed(2)}</td>
                  <td className="border p-3">{p.note}</td>
                  <td className="border p-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.deletePaths)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* TOTAL FOOTER */}
          {filteredPayments.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="border p-3 text-right">
                  Total Amount:
                </td>
                <td className="border p-3">
                  {totalAmount.toFixed(2)}
                </td>
                <td colSpan={2} className="border p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="px-3 py-1 border rounded">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentScreen;
