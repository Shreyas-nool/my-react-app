import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Printer } from "lucide-react";

/* ✅ Date formatter: DD-MM-YY */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
};

/* ✅ Unit price → show ORIGINAL value */
const formatUnitPrice = (value) =>
  Number(value || 0).toString();

/* ✅ Total → 2 decimals */
const formatTotal = (value) =>
  Number(value || 0).toFixed(2);

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { state: sale } = useLocation();
  const printRef = useRef();

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

  /* ✅ Invoice total */
  const invoiceTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

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
      <div
        ref={printRef}
        className="bg-white shadow-lg border p-6"
      >
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold">SR Enterprise</h1>
          <p className="text-sm text-gray-500">Sales Invoice</p>
        </header>

        {/* Invoice Info */}
        <section className="flex justify-between mb-6 text-sm">
          <div>
            <p><strong>Invoice #:</strong> {sale.invoiceNumber}</p>
            <p><strong>Date:</strong> {formatDate(sale.createdAt)}</p>
          </div>

          <div>
            <p><strong>Party:</strong> {sale.party}</p>
            {sale.address && <p><strong>Address:</strong> {sale.address}</p>}
            {sale.contact && <p><strong>Contact:</strong> {sale.contact}</p>}
          </div>
        </section>

        {/* Products Table */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">S.No</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Box</th>
              <th className="border p-2">Pcs/Box</th>
              <th className="border p-2 text-right">Price</th>
              <th className="border p-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2 text-center">{item.box}</td>
                <td className="border p-2 text-center">{item.piecesPerBox}</td>
                <td className="border p-2 text-right">
                  {formatUnitPrice(item.pricePerItem)}
                </td>
                <td className="border p-2 text-right">
                  {formatTotal(item.total)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100">
              <td colSpan={5} className="border p-2 text-right font-semibold">
                Invoice Total:
              </td>
              <td className="border p-2 text-right font-bold">
                {formatTotal(invoiceTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <section className="mt-12 flex justify-between text-sm">
          <div className="text-center">
            <p>Prepared By</p>
            <div className="mt-10 border-t w-48 mx-auto"></div>
          </div>

          <div className="text-center">
            <p>Authorized Signature</p>
            <div className="mt-10 border-t w-48 mx-auto"></div>
          </div>
        </section>

        <footer className="mt-6 text-xs text-center text-gray-500">
          Thank you for your business!
        </footer>
      </div>
    </div>
  );
}
