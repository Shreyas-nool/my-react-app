import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { ref, get, update, set } from "firebase/database";

const PartyLedgerScreen = () => {
  const { id } = useParams(); // party firebase key
  const [ledgerData, setLedgerData] = useState({
    partyName: "",
    openingBalance: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  // ✅ Round to 2 decimals
  const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    const fetchAndUpdateSummary = async () => {
      setLoading(true);
      try {
        const partySnap = await get(ref(db, `parties/${id}`));
        const partyObj = partySnap.val();
        const partyName = partyObj?.name || id;
        const openingBalance = round2(Number(partyObj?.openingBalance || 0));

        const transactions = [];

        // Sales → DEBIT (they owe you)
        const salesSnap = await get(ref(db, "sales"));
        const sales = salesSnap.val() || {};
        Object.values(sales).forEach((sale) => {
          Object.values(sale).forEach((inv) => {
            if (inv.party === partyName) {
              const total = round2(inv.items?.reduce((sum, i) => sum + Number(i.total || 0), 0));
              transactions.push({
                type: "Sale",
                date: inv.createdAt || inv.date,
                invoice: inv.invoiceNumber || inv.invoice,
                debit: total,
                credit: 0,
                notes: "",
              });
            }
          });
        });

        // Purchases → CREDIT (you owe them)
        const purchasesSnap = await get(ref(db, "purchases"));
        const purchases = purchasesSnap.val() || {};
        Object.values(purchases).forEach((purchase) => {
          if (purchase.supplier === partyName) {
            transactions.push({
              type: "Purchase",
              date: purchase.createdAt || purchase.date,
              invoice: purchase.invoiceNumber || purchase.id,
              debit: 0,
              credit: round2(purchase.total || purchase.subtotal || 0),
              notes: purchase.notes || "",
            });
          }
        });

        // Payments → CREDIT (they paid you)
        const paymentsSnap = await get(ref(db, "payments"));
        const allPayments = paymentsSnap.val() || {};
        if (allPayments[partyName]) {
          Object.entries(allPayments[partyName]).forEach(([dateKey, paymentNode]) => {
            Object.values(paymentNode).forEach((payment) => {
              const amt = round2(Number(payment.amount || 0));
              transactions.push({
                type: "Payment",
                date: payment.createdAt || payment.date || dateKey,
                invoice: "",
                debit: 0,
                credit: amt,
                notes: payment.bank || "",
              });
            });
          });
        }

        // Sort by full timestamp → oldest first
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Compute running balance
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;

        const ledgerEntries = transactions.map((t) => {
          totalDebit = round2(totalDebit + (t.debit || 0));
          totalCredit = round2(totalCredit + (t.credit || 0));
          runningBalance = round2(runningBalance + (t.debit || 0) - (t.credit || 0));
          return { ...t, runningBalance };
        });

        setLedgerData({
          partyName,
          openingBalance,
          transactions: ledgerEntries,
        });

        // Save summary
        const today = new Date().toISOString().split("T")[0];
        await set(ref(db, `ledgerSummary/${id}`), {
          partyId: id,
          partyName,
          date: today,
          openingBalance,
          totalDebit,
          totalCredit,
          balance: runningBalance,
        });

        // Update party balance
        await update(ref(db, `parties/${id}`), { balance: runningBalance });
      } catch (err) {
        console.error("Error fetching/updating ledger summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndUpdateSummary();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-xl font-semibold mb-2">Ledger — {ledgerData.partyName}</h2>

      <div
        className={`text-sm mb-4 font-semibold ${
          ledgerData.openingBalance > 0 ? "text-red-600" : "text-green-600"
        }`}
      >
        Opening Balance: {ledgerData.openingBalance.toFixed(2)}
      </div>

      <div className="overflow-auto bg-white rounded shadow">
        <table className="min-w-full text-sm divide-y">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Invoice</th>
              <th className="p-2 text-left">Notes</th>
              <th className="p-2 text-right">Debit</th>
              <th className="p-2 text-right">Credit</th>
              <th className="p-2 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {ledgerData.transactions.map((t, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-2 capitalize">{t.type}</td>
                <td className="p-2">{t.invoice}</td>
                <td className="p-2">{t.notes}</td>
                <td className="p-2 text-right text-red-600">{t.debit?.toFixed(2) || ""}</td>
                <td className="p-2 text-right text-green-600">{t.credit?.toFixed(2) || ""}</td>
                <td
                  className={`p-2 text-right font-semibold ${
                    t.runningBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {t.runningBalance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartyLedgerScreen;
