// src/screens/stock/StockScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

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
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");

  // ---------------------------------------------------------
  // LOAD STOCKS
  // ---------------------------------------------------------
  useEffect(() => {
    const stockRef = ref(db, "stocks");

    const unsubscribe = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setStock([]);
        setCategories([]);
        return;
      }

      let finalList = [];
      let catSet = new Set();

      Object.entries(data).forEach(([dateKey, items]) => {
        Object.entries(items).forEach(([id, item]) => {
          finalList.push({
            _firebaseId: id,
            dateKey,
            ...item,
          });

          if (item.category) catSet.add(item.category);
        });
      });

      setStock(finalList);
      setCategories(["ALL", ...Array.from(catSet)]);
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // DELETE STOCK
  // ---------------------------------------------------------
  const deleteStock = (item) => {
    if (!confirm("Delete this stock item?")) return;

    const itemRef = ref(db, `stocks/${item.dateKey}/${item._firebaseId}`);
    set(itemRef, null);
  };

  // ---------------------------------------------------------
  // FILTERED STOCK BY CATEGORY
  // ---------------------------------------------------------
  const filteredStock =
    activeCategory === "ALL"
      ? stock
      : stock.filter((s) => s.category === activeCategory);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen p-4 space-y-4">
      
      {/* HEADER */}
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg font-semibold">Stocks</h1>

        <Button onClick={() => navigate("/stock/create-stock")}>
          <Plus className="h-4 w-4 mr-1" /> Add Stock
        </Button>
      </header>

      {/* CATEGORY TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1 rounded-full text-sm whitespace-nowrap border transition
              ${
                activeCategory === cat
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Stock List
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-auto max-h-[70vh] hide-scrollbar">
          {filteredStock.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No stock found.
            </div>
          ) : (
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                  <TableHead className="text-center font-semibold">Sr</TableHead>
                  <TableHead className="text-center font-semibold">Category</TableHead>
                  <TableHead className="text-center font-semibold">Product</TableHead>
                  <TableHead className="text-center font-semibold">Boxes</TableHead>
                  <TableHead className="text-center font-semibold">Pcs/Box</TableHead>
                  <TableHead className="text-center font-semibold">Total Pcs</TableHead>
                  <TableHead className="text-center font-semibold">Price/Pc</TableHead> 
                  <TableHead className="text-center font-semibold">Total Value</TableHead>
                  <TableHead className="text-center font-semibold">Date</TableHead>
                  <TableHead className="text-center font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStock.map((item, index) => {
                  const totalPieces =
                    Number(item.boxes || 0) * Number(item.piecesPerBox || 0);
                  const totalValue =
                    totalPieces * Number(item.pricePerPiece || 0);

                  return (
                    <TableRow key={item._firebaseId} className="hover:bg-gray-50">
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="text-center">{item.category}</TableCell>
                      <TableCell className="text-center">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.boxes}</TableCell>
                      <TableCell className="text-center">{item.piecesPerBox}</TableCell>
                      <TableCell className="text-center">{totalPieces}</TableCell>
                      <TableCell className="text-center">{item.pricePerPiece}</TableCell>
                      <TableCell className="text-center">
                        {totalValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">{item.date}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => deleteStock(item)}
                          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockScreen;
