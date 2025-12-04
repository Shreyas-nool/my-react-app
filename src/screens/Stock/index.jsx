import React, { useEffect, useState } from "react";
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

import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

const StockScreen = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);

  // ---------------------------------------------------------
  // LOAD STOCKS FROM FIREBASE
  // ---------------------------------------------------------
  useEffect(() => {
    const stockRef = ref(db, "stocks/");

    const unsubscribe = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setStock([]);
        return;
      }

      let finalList = [];

      // LOOP THROUGH ALL date folders
      Object.entries(data).forEach(([dateKey, items]) => {
        Object.entries(items).forEach(([id, item]) => {
          finalList.push({
            _firebaseId: id,
            dateKey,
            ...item,
          });
        });
      });

      setStock(finalList);
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // DELETE STOCK
  // ---------------------------------------------------------
  const deleteStock = (item) => {
    if (!confirm("Delete this stock item?")) return;

    const itemRef = ref(db, `stocks/${item.dateKey}/${item._firebaseId}`);

    set(itemRef, null)
      .then(() => alert("Stock deleted successfully"))
      .catch((err) => alert("Delete error: " + err.message));
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg font-semibold">Stocks</h1>

        <Button
          onClick={() => navigate("/stock/create-stock")}
          className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add New Stock
        </Button>
      </header>

      {/* TABLE SECTION */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Stock List
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            {stock.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No stock items found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sr No.</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Boxes</TableHead>
                      <TableHead>Pieces</TableHead>
                      <TableHead>Price/pc</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {stock.map((item, index) => {
                      const total =
                        Number(item.pieces) * Number(item.pricePerPiece || 0);

                      return (
                        <TableRow key={item._firebaseId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.productName || "-"}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.boxes}</TableCell>
                          <TableCell>{item.pieces}</TableCell>
                          <TableCell>₹{item.pricePerPiece}</TableCell>
                          <TableCell>₹{total.toFixed(2)}</TableCell>
                          <TableCell>{item.date}</TableCell>

                          <TableCell>
                            <button
                              onClick={() => deleteStock(item)}
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              Delete
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

export default StockScreen;
