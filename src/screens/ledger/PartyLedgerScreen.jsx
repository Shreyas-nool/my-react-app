import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, off, set } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useReactToPrint } from "react-to-print";

const PartyLedgerScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tableRef = useRef();
  const printRef = useRef();

  const [ledgerData, setLedgerData] = useState({
    partyName: "",
    transactions: [],
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const itemsPerPage = 20; // 20 entries per page
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    setLoading(true);
    const partyRef = ref(db, `parties/${id}`);
    const salesRef = ref(db, "sales");
    const paymentsRef = ref(db, "payments");

    const handleUpdate = async () => {
      try {
        const partySnap = await new Promise((resolve) =>
          onValue(partyRef, resolve, { onlyOnce: true })
        );
        const party = partySnap.val();
        if (!party) return;

        const partyName = party.name;
        const openingBalance = round2(Number(party.openingBalance || 0));
        const createdAt = party.createdAt;

        const transactions = [];
        const usedKeys = new Set();

        // Opening balance
        transactions.push({
          type: "Old Balance",
          date: createdAt,
          invoice: "-",
          source: "-",
          notes: "Opening balance",
          amount: openingBalance,
        });

        // SALES
        await new Promise((resolve) =>
          onValue(
            salesRef,
            (snap) => {
              const sales = snap.val() || {};
              Object.values(sales).forEach((group) => {
                Object.values(group).forEach((inv) => {
                  if (inv.partyId !== id) return;
                  const key = `sale-${inv.invoiceNumber}`;
                  if (usedKeys.has(key)) return;
                  usedKeys.add(key);

                  const total = round2(
                    inv.items?.reduce((sum, i) => sum + Number(i.total || 0), 0)
                  );

                  transactions.push({
                    type: "Sale",
                    date: inv.date || inv.createdAt,
                    invoice: inv.invoiceNumber || "-",
                    source: "-",
                    notes: "-",
                    amount: total,
                  });
                });
              });
              resolve();
            },
            { onlyOnce: true }
          )
        );

        // PAYMENTS
        await new Promise((resolve) =>
          onValue(
            paymentsRef,
            (snap) => {
              const payments = snap.val() || {};
              Object.values(payments).forEach((l1) => {
                Object.values(l1).forEach((l2) => {
                  Object.values(l2).forEach((l3) => {
                    Object.values(l3).forEach((p) => {
                      if (!p?.txnId) return;
                      const key = `payment-${p.txnId}`;
                      if (usedKeys.has(key)) return;
                      usedKeys.add(key);
                      if (p.fromName !== partyName && p.toName !== partyName) return;

                      let amount = round2(Number(p.amount || 0));
                      let source = "-";
                      if (p.fromName === partyName) amount = -amount;
                      if (p.fromName === partyName) source = `to ${p.toName}`;
                      if (p.toName === partyName) source = `from ${p.fromName}`;

                      transactions.push({
                        type: "Payment",
                        date: p.date || p.createdAt,
                        invoice: "-",
                        source,
                        notes: "-",
                        amount,
                      });
                    });
                  });
                });
              });
              resolve();
            },
            { onlyOnce: true }
          )
        );

        // SORT & running balance
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        let runningBalance = 0;
        const finalTxns = transactions.map((t, i) => {
          runningBalance = i === 0 ? round2(t.amount) : round2(runningBalance + t.amount);
          return { ...t, runningBalance };
        });

        // Update ledgerData & party balance in Firebase
        setLedgerData({ partyName, transactions: finalTxns, balance: runningBalance });

        // Set current page to last page
        const totalPages = Math.ceil(finalTxns.length / itemsPerPage);
        setCurrentPage(totalPages > 0 ? totalPages : 1);

        set(ref(db, `parties/${id}/balance`), runningBalance);
      } catch (err) {
        console.error("Ledger error:", err);
      } finally {
        setLoading(false);
      }
    };

    handleUpdate();

    const salesListener = onValue(salesRef, handleUpdate);
    const paymentsListener = onValue(paymentsRef, handleUpdate);

    return () => {
      off(salesRef, "value", salesListener);
      off(paymentsRef, "value", paymentsListener);
    };
  }, [id]);

  const totalPages = useMemo(
    () => Math.ceil(ledgerData.transactions.length / itemsPerPage),
    [ledgerData.transactions.length]
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return ledgerData.transactions.slice(start, end);
  }, [ledgerData.transactions, currentPage]);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // Print only party name + table
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${ledgerData.partyName}_ledger`,
  });

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-2 relative">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* DATE PICKERS */}
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            placeholderText="From"
            className="border border-gray-400 rounded px-2 py-1 text-sm"
            isClearable
          />
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            placeholderText="To"
            className="border border-gray-400 rounded px-2 py-1 text-sm"
            isClearable
          />
        </div>

        <Button onClick={handlePrint} className="absolute right-0 top-1/2 -translate-y-1/2 h-9 text-sm">
          Print Ledger
        </Button>
      </div>

      {/* PRINT AREA */}
      <div ref={printRef}>
        {/* PARTY NAME */}
        <h1 className="text-3xl font-semibold text-center mb-4">{ledgerData.partyName}</h1>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-center">
            <thead>
              <tr className="bg-gray-100 text-xl">
                <th className="border p-3">Date</th>
                <th className="border p-3">Type</th>
                <th className="border p-3">Invoice</th>
                <th className="border p-3">Source</th>
                <th className="border p-3">Notes</th>
                <th className="border p-3">Amount</th>
                <th className="border p-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-3">{formatDate(t.date)}</td>
                    <td className="border p-3">{t.type}</td>
                    <td className="border p-3">
                      {t.invoice !== "-" ? (
                        <span
                          onClick={() => navigate(`/invoice/${t.invoice}`)}
                          className="text-blue-600 underline cursor-pointer"
                        >
                          {t.invoice}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border p-3">{t.source}</td>
                    <td className="border p-3">{t.notes}</td>
                    <td className={`border p-3 font-semibold ${t.amount >= 0 ? "text-red-600" : "text-green-600"}`}>
                      {t.amount.toFixed(2)}
                    </td>
                    <td className={`border p-3 font-semibold ${t.runningBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                      {t.runningBalance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}

              {/* Current balance row */}
              <tr className="bg-gray-100 border-t-2">
                <td className="border p-3 text-right"></td>
                <td colSpan={5} className="border p-3 text-end font-semibold text-black">
                  Current Balance
                </td>
                <td className="border p-3 font-bold text-center">
                  <span className={`${ledgerData.balance >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {ledgerData.balance.toFixed(2)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION - fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-center items-center gap-2 shadow-md z-50">
        <Button
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PartyLedgerScreen;
