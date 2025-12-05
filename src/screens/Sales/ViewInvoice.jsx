import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Printer } from "lucide-react";

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

  const invoiceTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.total),
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
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => navigate("/sales/create-sales", { state: sale })}>
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
        className="bg-white shadow-lg border border-gray-200 p-4 sm:p-6"
      >
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">SR Enterprise</h1>
            <p className="text-sm text-gray-500">Sales Invoice</p>
          </div>
        </header>

        {/* Invoice Info */}
        <section className="flex flex-col sm:flex-row justify-between mb-6 text-sm gap-2 sm:gap-0">
          <div>
            <p><strong>Invoice #:</strong> {sale.invoiceNumber}</p>
            <p><strong>Date:</strong> {sale.createdAt}</p>
          </div>

          <div>
            <p><strong>Party:</strong> {sale.party}</p>

            {sale.address && (
              <p><strong>Address:</strong> {sale.address}</p>
            )}

            {sale.contact && (
              <p><strong>Contact:</strong> {sale.contact}</p>
            )}

            {/* ✅ Credit Period added here */}
            {sale.creditPeriod && (
              <p><strong>Credit Period:</strong> {sale.creditPeriod} days</p>
            )}
          </div>
        </section>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm min-w-[500px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">S.No</th>
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-center">Box</th>
                <th className="border p-2 text-center">Pcs/Box</th>
                <th className="border p-2 text-right">Price</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2 text-center">{item.box}</td>
                  <td className="border p-2 text-center">{item.piecesPerBox}</td>
                  <td className="border p-2 text-right">{item.pricePerItem}</td>
                  <td className="border p-2 text-right">{item.total}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-gray-100">
                <td className="border p-2 text-right font-semibold" colSpan={5}>
                  Invoice Total:
                </td>
                <td className="border p-2 font-bold text-right">{invoiceTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Section */}
        <section className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-between text-sm gap-6 sm:gap-0">
          <div className="text-center">
            <p>Prepared By</p>
            <div className="mt-12 border-t border-gray-500 w-48 mx-auto"></div>
          </div>
          <div className="text-center">
            <p>Authorized Signature</p>
            <div className="mt-12 border-t border-gray-500 w-48 mx-auto"></div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-xs text-gray-500 text-center">
          Thank you for your business!
        </footer>
      </div>
    </div>
  );
}
