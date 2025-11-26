import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

const SalesScreen = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [selectedSales, setSelectedSales] = useState({});

  // --------------------------------------------
  // Load Sales from Firebase with correct keys
  // --------------------------------------------
  useEffect(() => {
    const salesRef = ref(db, "sales");

    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSales([]);
        return;
      }

      const allSales = [];

      Object.entries(data).forEach(([dateKey, salesOfDate]) => {
        Object.entries(salesOfDate).forEach(([firebaseId, sale]) => {
          allSales.push({
            ...sale,
            _dateKey: dateKey,
            _firebaseId: firebaseId,
          });
        });
      });

      setSales(allSales);
    });

    return () => unsubscribe();
  }, []);

  const toggleSelect = (saleId) => {
    setSelectedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  const handlePrintSelected = () => {
    const selected = sales.filter((s) => selectedSales[s._firebaseId]);
    if (!selected.length) return alert("Please select at least one invoice.");

    navigate("/sales/print-multiple", { state: { invoices: selected } });
  };

  // --------------------------------------------
  // DELETE invoice function
  // --------------------------------------------
  const deleteInvoice = (sale) => {
    if (!confirm("Delete this invoice?")) return;

    const saleRef = ref(db, `sales/${sale._dateKey}/${sale._firebaseId}`);

    set(saleRef, null)
      .then(() => alert("Invoice deleted successfully"))
      .catch((err) => alert("Delete error: " + err.message));
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            Sales List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        <Button
          onClick={() => navigate("/sales/create-sales")}
          className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Create Sales
        </Button>
      </header>

      {/* Print Selected Button */}
      <div className="flex justify-end">
        <Button
          onClick={handlePrintSelected}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Print Selected (
          {Object.keys(selectedSales).filter((k) => selectedSales[k]).length})
        </Button>
      </div>

      {/* Sales Table */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold">
              Sales Invoices
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            {sales.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No sales invoices found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Sr No.</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Box</TableHead>
                      <TableHead>Pieces/Box</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sales.map((sale, saleIndex) => {
                      const items = sale.items || [];
                      const srNo = saleIndex + 1; // <-- NEW

                      return items.map((item, itemIndex) => {
                        const showControls = itemIndex === 0;
                        const pricePerPiece = item.box > 0 ? (item.total || 0) / item.box : 0;

                        return (
                          <TableRow key={`${sale._firebaseId}-${itemIndex}`}>

                            {/* Checkbox */}
                            <TableCell>
                              {showControls && (
                                <input
                                  type="checkbox"
                                  checked={!!selectedSales[sale._firebaseId]}
                                  onChange={() => toggleSelect(sale._firebaseId)}
                                />
                              )}
                            </TableCell>

                            {/* Sr No */}
                            <TableCell>
                              {showControls ? srNo : ""}
                            </TableCell>

                            {/* Party Name */}
                            <TableCell>{sale.party || "-"}</TableCell>

                            {/* Category */}
                            <TableCell>{item.category || "-"}</TableCell>

                            {/* Product */}
                            <TableCell>{item.productName}</TableCell>

                            {/* Box */}
                            <TableCell>{item.box}</TableCell>

                            {/* Pieces/Box */}
                            <TableCell>{item.piecesPerBox || "-"}</TableCell>

                            {/* Price */}
                            <TableCell>₹{pricePerPiece.toFixed(2)}</TableCell>

                            {/* Total */}
                            <TableCell>₹{item.total.toFixed(2)}</TableCell>

                            {/* Delete Button */}
                            <TableCell>
                              {showControls && (
                                <button
                                  onClick={() => deleteInvoice(sale)}
                                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                >
                                  Delete
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>


                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesScreen;
