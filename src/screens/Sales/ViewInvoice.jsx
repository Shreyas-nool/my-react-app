import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Printer } from "lucide-react";
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

/* Price formatting for display */
const formatPrice = (value) => {
  const v = Number(value || 0);
  return v !== 0 && v < 0.01 ? v.toFixed(4) : v.toFixed(2);
};

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { state: sale } = useLocation();
  const printRef = useRef();

  const [partyData, setPartyData] = useState(null);

  // Fetch party details based on sale.partyId
  useEffect(() => {
    if (!sale?.partyId) return;

    const partyRef = ref(db, `parties/${sale.partyId}`);
    const unsubscribe = onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setPartyData(data);
    });

    return () => unsubscribe();
  }, [sale?.partyId]);

  if (!sale) {
    return (
      <div className="p-4">
        <p className="text-red-600">No invoice data found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  /* Totals */
  const totalBoxes = sale.items.reduce(
    (sum, item) => sum + Number(item.box || 0),
    0
  );

  const invoiceTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  /* Print */
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-6">
      {/* Top Buttons */}
      <div className="flex justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              navigate("/sales/create-sales", { state: sale })
            }
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>

          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={printRef} className="bg-white border shadow-md p-6">
        {/* Header */}
        <header className="mb-6 text-center relative">
            {/* Centered Invoice Title */}
            <h2 className="text-xl font-semibold mb-4">Sales Invoice</h2>

            {/* Party & Invoice Info */}
            <div className="flex justify-between text-sm">
              {/* Party Info (Left) */}
              <div className="text-left">
                <h1 className="text-2xl font-bold">{partyData?.name || "-"}</h1>
                <p className="text-gray-600">{partyData?.city || "-"}</p>
                <p className="text-gray-600">
                  <strong>Mobile:</strong> {partyData?.mobile || "-"}
                </p>
              </div>

              {/* Invoice Info (Right) */}
              <div className="text-right">
                <p>
                  <strong>Invoice #:</strong> {sale.invoiceNumber}
                </p>
                <p>
                  <strong>Invoice Date:</strong> {formatDate(sale.createdAt)}
                </p>
                <p>
                  <strong>Due Date:</strong> {formatDate(sale.dueDate)}
                </p>
              </div>
            </div>
          </header>

        {/* Table */}
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
            {sale.items.map((item, index) => (
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
