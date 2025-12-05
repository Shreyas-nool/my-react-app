import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    const salesRef = ref(db, "sales");
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setSales([]);

      const allSales = [];
      Object.entries(data).forEach(([dateKey, invoices]) => {
        Object.entries(invoices).forEach(([invoiceKey, sale]) => {
          allSales.push({
            ...sale,
            _dateKey: dateKey,
            _invoiceKey: invoiceKey,
          });
        });
      });

      setSales(allSales);
    });

    return () => unsubscribe();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.toLowerCase();
    return (
      sale.invoiceNumber?.toString().includes(query) ||
      sale.createdAt?.toLowerCase().includes(query) ||
      sale.party?.toLowerCase().includes(query)
    );
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const deleteInvoice = (sale) => {
    if (!confirm("Delete this invoice?")) return;

    const delRef = ref(db, `sales/${sale._dateKey}/${sale._invoiceKey}`);

    set(delRef, null)
      .then(() => alert("Invoice deleted"))
      .catch((err) => alert("Error: " + err.message));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline-block ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="inline-block ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
      <header className="flex items-center justify-between py-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Sales List</h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        <Button onClick={() => navigate("/sales/create-sales")}>
          <Plus className="h-4 w-4" /> Create Sales
        </Button>
      </header>

      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-1/3"
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle>Sales Invoices</CardTitle>
          </CardHeader>

          <CardContent>
            {sortedSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("createdAt")}
                      >
                        Invoice Date {renderSortIcon("createdAt")}
                      </TableHead>

                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("invoiceNumber")}
                      >
                        Invoice No. {renderSortIcon("invoiceNumber")}
                      </TableHead>

                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("party")}
                      >
                        Party {renderSortIcon("party")}
                      </TableHead>

                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedSales.map((sale) => {
                      const totalAmount = sale.items.reduce(
                        (sum, item) => sum + item.total,
                        0
                      );

                      return (
                        <TableRow key={sale._invoiceKey}>
                          <TableCell>{sale.createdAt}</TableCell>

                          <TableCell>
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() =>
                                navigate("/sales/view-invoice", {
                                  state: sale,
                                })
                              }
                            >
                              {sale.invoiceNumber}
                            </button>
                          </TableCell>

                          <TableCell>{sale.party}</TableCell>

                          <TableCell>{totalAmount}</TableCell>

                          <TableCell>
                            <button
                              onClick={() => deleteInvoice(sale)}
                              className="flex items-center justify-center p-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
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
