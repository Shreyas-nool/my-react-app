import { useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";

const PrintMultipleInvoices = () => {
  const { state } = useLocation();
  const invoices = state?.invoices || []; // match the key used in SalesScreen

  if (invoices.length === 0)
    return <div className="text-center mt-10 text-lg">No invoices selected.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10 print:space-y-20">

      {invoices.map((sale, index) => (
        <div key={index} className="border p-6 rounded-lg shadow-sm break-after-page">

          <h2 className="text-xl font-bold mb-2">
            Invoice #{index + 1}
          </h2>

          <p><b>Date:</b> {sale.createdAt}</p>
          <p><b>Party:</b> {sale.party}</p>

          <table className="w-full mt-4 border-collapse border border-gray-300">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="border px-2 py-1">Product</th>
                <th className="border px-2 py-1">Size</th>
                <th className="border px-2 py-1">Qty</th>
                <th className="border px-2 py-1">Total</th>
              </tr>
            </thead>

            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border text-center">
                  <td className="border px-2 py-1">{item.productName}</td>
                  <td className="border px-2 py-1">{item.size}</td>
                  <td className="border px-2 py-1">{item.box}</td>
                  <td className="border px-2 py-1">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-4 font-semibold">
            Total Amount: ₹{sale.items.reduce((sum, i) => sum + i.total, 0)}
          </div>

        </div>
      ))}

      <Button
        className="bg-black text-white mt-6"
        onClick={() => window.print()}
      >
        Print All Invoices
      </Button>

    </div>
  );
};

export default PrintMultipleInvoices;
