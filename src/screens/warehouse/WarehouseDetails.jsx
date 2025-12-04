// src/screens/warehouse/WarehouseStock.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
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

const WarehouseStock = () => {
  const navigate = useNavigate();
  const { warehouseName } = useParams();
  const location = useLocation();
  const warehouseId = location.state?.warehouseId;

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let stockList = [];

        // Firebase structure: stocks/date-YYYY-MM-DD/<stockId>
        Object.keys(data).forEach((dateKey) => {
          const dayStocks = data[dateKey];
          Object.keys(dayStocks).forEach((stockId) => {
            const stock = dayStocks[stockId];
            // Filter by warehouse name
            if (stock.warehouse === warehouseName) {
              stockList.push(stock);
            }
          });
        });

        // sort newest first
        stockList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        setStocks(stockList);
      } else {
        setStocks([]);
      }
      setLoading(false);
    });
  }, [warehouseName]);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-6 sm:mt-10 h-screen bg-background p-2 sm:p-4 space-y-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">
            {warehouseName} Stock
          </h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        <div className="w-8" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No stock available in this warehouse.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Boxes</TableHead>
                    <TableHead>Pieces</TableHead>
                    <TableHead>Price/ Piece</TableHead>
                    <TableHead>Total Pieces</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition">
                      <TableCell>{s.productName}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell>{s.boxes}</TableCell>
                      <TableCell>{s.pieces}</TableCell>
                      <TableCell>₹{s.pricePerPiece}</TableCell>
                      <TableCell>{s.totalPieces}</TableCell>
                      <TableCell>₹{s.totalValue}</TableCell>
                      <TableCell>{s.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {stocks.map((s) => (
                <Card key={s.id}>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Product:</span>
                      <span>{s.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span>{s.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Boxes:</span>
                      <span>{s.boxes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Pieces:</span>
                      <span>{s.pieces}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Price/ Piece:</span>
                      <span>₹{s.pricePerPiece}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Pieces:</span>
                      <span>{s.totalPieces}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Value:</span>
                      <span>₹{s.totalValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{s.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WarehouseStock;
