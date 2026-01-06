import React, { useEffect, useState } from "react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { db } from "../../firebase";
import { ref, onValue, set, push, get } from "firebase/database";

const TransferStock = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");

  const [category, setCategory] = useState("");
  const [product, setProduct] = useState("");
  const [boxes, setBoxes] = useState("");
  const [availableBoxes, setAvailableBoxes] = useState(0);

  const [products, setProducts] = useState([]);

  // ---------- Local date in YYYY-MM-DD format ----------
  const todayLocal = new Date();
  const formattedLocalDate = todayLocal.toLocaleDateString("en-CA"); // YYYY-MM-DD for input
  const timestampLocal = todayLocal.getTime(); // For DB createdAt

  /* ---------- Load Warehouses ---------- */
  useEffect(() => {
    const warehouseRef = ref(db, "warehouse");
    onValue(warehouseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data).map((w) => w.name);
        setWarehouses(list);
      }
    });
  }, []);

  /* ---------- Load Products based on From Warehouse ---------- */
  useEffect(() => {
    if (!fromWarehouse) {
      setProducts([]);
      setCategory("");
      setProduct("");
      setAvailableBoxes(0);
      return;
    }

    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const stockList = [];

      Object.entries(data).forEach(([date, items]) => {
        Object.entries(items).forEach(([id, item]) => {
          if (item.warehouse === fromWarehouse) {
            stockList.push(item);
          }
        });
      });

      setProducts(stockList);
    });
  }, [fromWarehouse]);

  /* ---------- Handle Category Change ---------- */
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setProduct("");
    const filtered = products.filter((p) => p.category === cat);
    setAvailableBoxes(filtered.length > 0 ? filtered[0].boxes : 0);
  };

  /* ---------- Handle Product Change ---------- */
  const handleProductChange = (prodName) => {
    setProduct(prodName);
    const p = products.find((p) => p.productName === prodName);
    setAvailableBoxes(p ? p.boxes : 0);
  };

  /* ---------- Handle Transfer ---------- */
  const handleTransfer = async () => {
    if (!fromWarehouse || !toWarehouse || !category || !product || !boxes)
      return alert("Fill all fields");

    const boxesToTransfer = Number(boxes);
    if (boxesToTransfer <= 0 || boxesToTransfer > availableBoxes)
      return alert("Invalid number of boxes");

    const stocksRef = ref(db, "stocks");
    const snapshot = await get(stocksRef);
    if (!snapshot.exists()) return alert("Stock not found");

    const stocksData = snapshot.val();

    // 1️⃣ Update From Warehouse
    let fromStock;
    Object.entries(stocksData).forEach(([dateKey, items]) => {
      Object.entries(items).forEach(([id, item]) => {
        if (
          item.warehouse === fromWarehouse &&
          item.category === category &&
          item.productName === product
        ) {
          fromStock = item;
          const newBoxes = item.boxes - boxesToTransfer;
          set(ref(db, `stocks/${dateKey}/${id}`), {
            ...item,
            boxes: newBoxes,
            totalPieces: newBoxes * item.piecesPerBox,
            totalValue: newBoxes * item.piecesPerBox * item.pricePerPiece,
          });
        }
      });
    });

    // 2️⃣ Update To Warehouse
    let foundTo = false;
    Object.entries(stocksData).forEach(([dateKey, items]) => {
      Object.entries(items).forEach(([id, item]) => {
        if (
          item.warehouse === toWarehouse &&
          item.category === category &&
          item.productName === product
        ) {
          const newBoxes = item.boxes + boxesToTransfer;
          set(ref(db, `stocks/${dateKey}/${id}`), {
            ...item,
            boxes: newBoxes,
            totalPieces: newBoxes * item.piecesPerBox,
            totalValue: newBoxes * item.piecesPerBox * item.pricePerPiece,
          });
          foundTo = true;
        }
      });
    });

    if (!foundTo && fromStock) {
      // Create new stock in To Warehouse
      const dateKey = formattedLocalDate;
      const newStockRef = push(ref(db, `stocks/${dateKey}`));
      await set(newStockRef, {
        ...fromStock,
        id: newStockRef.key,
        warehouse: toWarehouse,
        boxes: boxesToTransfer,
        totalPieces: boxesToTransfer * fromStock.piecesPerBox,
        totalValue: boxesToTransfer * fromStock.piecesPerBox * fromStock.pricePerPiece,
      });
    }

    // 3️⃣ Create warehouse entries
    const entryId = Date.now().toString();
    const entryData = {
      from: fromWarehouse,
      to: toWarehouse,
      category,
      product,
      boxes: boxesToTransfer,
      date: formattedLocalDate,
      createdAt: timestampLocal,
    };

    await set(ref(db, `warehouse/${fromWarehouse}/entries/${entryId}`), entryData);
    await set(ref(db, `warehouse/${toWarehouse}/entries/${entryId}`), entryData);

    alert("✅ Stock transferred successfully!");

    // Reset form
    setFromWarehouse("");
    setToWarehouse("");
    setCategory("");
    setProduct("");
    setBoxes("");
    setAvailableBoxes(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-3 sm:px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4 max-w-2xl mx-auto w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/warehouse")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Transfer Stock</h1>
        </div>
      </header>

      {/* Card */}
      <main className="flex-1 flex items-start justify-center">
        <Card className="w-full max-w-2xl shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Warehouse Transfer</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formattedLocalDate} readOnly />
            </div>

            {/* From / To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <select
                  value={fromWarehouse}
                  onChange={(e) => {
                    setFromWarehouse(e.target.value);
                    setToWarehouse("");
                  }}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>To Warehouse</Label>
                <select
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                  disabled={!fromWarehouse}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">Select warehouse</option>
                  {warehouses
                    .filter((w) => w !== fromWarehouse)
                    .map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Select category</option>
                {[...new Set(products.map((p) => p.category))].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                value={product}
                onChange={(e) => handleProductChange(e.target.value)}
                disabled={!category}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">Select product</option>
                {products
                  .filter((p) => p.category === category)
                  .map((p) => (
                    <option key={p.id} value={p.productName}>
                      {p.productName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boxes to Transfer</Label>
                <Input
                  type="number"
                  placeholder="Enter boxes"
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Available Boxes</Label>
                <Input
                  type="number"
                  value={availableBoxes}
                  readOnly
                  className="bg-muted/20 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Transfer Button */}
            <Button
              className="w-full h-11 text-sm font-semibold gap-2"
              onClick={handleTransfer}
            >
              <RefreshCcw className="h-4 w-4" />
              Transfer Stock
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransferStock;
