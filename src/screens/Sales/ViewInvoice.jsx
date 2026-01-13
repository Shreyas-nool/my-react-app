import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Share2 } from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

/* Date formatter → DD-MM-YYYY */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* Price formatting */
const formatPrice = (value) => {
  const v = Number(value || 0);
  return v !== 0 && v < 0.01 ? v.toFixed(4) : v.toFixed(2);
};

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const invoiceNumber = state?.invoiceNumber;

  const [sale, setSale] = useState(null);
  const [partyData, setPartyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch sale by invoiceNumber
  useEffect(() => {
    if (!invoiceNumber) return;
    const salesRef = ref(db, "sales");
    const unsub = onValue(salesRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      let found = null;
      Object.values(data).forEach((group) =>
        Object.values(group).forEach((s) => {
          if (s.invoiceNumber === invoiceNumber) found = s;
        })
      );

      setSale(found);
      setLoading(false);
    });

    return () => unsub();
  }, [invoiceNumber]);

  // Fetch party data
  useEffect(() => {
    if (!sale?.partyId) return;
    const partyRef = ref(db, `parties/${sale.partyId}`);
    const unsub = onValue(partyRef, (snap) => {
      if (snap.exists()) setPartyData(snap.val());
    });
    return () => unsub();
  }, [sale?.partyId]);

  if (loading) return <div className="p-6">Loading invoice...</div>;
  if (!sale)
    return (
      <div className="p-4">
        <p className="text-red-600">No invoice data found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );

  const totalBoxes = (sale.items || []).reduce(
    (sum, item) => sum + Number(item.box || 0),
    0
  );
  const invoiceTotal = (sale.items || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  // Share via WhatsApp
  const handleShare = () => {
    let text = `Invoice ${sale.invoiceNumber}\nDate: ${formatDate(
      sale.createdAt
    )}\nTotal: ${formatPrice(invoiceTotal)}\n\nItems:\n`;

    (sale.items || []).forEach((item, i) => {
      text += `${i + 1}. ${item.productName} - ${item.box} box(es), ${formatPrice(
        item.total
      )}\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-6">
      {/* Top Buttons */}
      <div className="flex justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex gap-2">
          <Button onClick={() => navigate("/sales/create-sales", { state: sale })}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>

          <Button onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border shadow-md p-6">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-center mb-4">Sales Invoice</h2>
          <div className="flex justify-between text-sm">
            <div>
              <h1 className="text-2xl font-bold">{partyData?.name || "-"}</h1>
              <p className="text-gray-600">{partyData?.city || "-"}</p>
              <p className="text-gray-600">
                <strong>Mobile:</strong> {partyData?.mobile || "-"}
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong>Invoice #:</strong> {sale.invoiceNumber}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(sale.createdAt)}
              </p>
              <p>
                <strong>Due Date:</strong> {formatDate(sale.dueDate)}
              </p>
            </div>
          </div>
        </header>

        <table className="w-full border border-collapse text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">SR</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Box</th>
              <th className="border p-2">Pcs / Box</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items || []).map((item, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{item.category}</td>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2">{item.box}</td>
                <td className="border p-2">{item.piecesPerBox}</td>
                <td className="border p-2">{formatPrice(item.pricePerItem)}</td>
                <td className="border p-2">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="border p-2 text-right">
                Total
              </td>
              <td className="border p-2">{totalBoxes}</td>
              <td className="border p-2"></td>
              <td className="border p-2 text-right">Invoice Total</td>
              <td className="border p-2">{formatPrice(invoiceTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
