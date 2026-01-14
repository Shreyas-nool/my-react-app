import React, { useEffect, useState } from "react";
import { ArrowLeft, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";

import { db } from "../../firebase";
import { ref, onValue, set, get } from "firebase/database";

const TransferStock = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [products, setProducts] = useState([]);

  const [transferRows, setTransferRows] = useState([
    { id: Date.now(), category: "", product: "", boxes: "", availableBoxes: 0 },
  ]);

  const todayLocal = new Date();
  const formattedLocalDate = todayLocal.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const timestampLocal = todayLocal.getTime();

  // Load Warehouses
  useEffect(() => {
    const warehouseRef = ref(db, "warehouse");
    onValue(warehouseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setWarehouses(Object.values(data).map((w) => w.name));
      }
    });
  }, []);

  // Load Products based on From Warehouse
  useEffect(() => {
    if (!fromWarehouse) {
      setProducts([]);
      setTransferRows((prev) =>
        prev.map((r) => ({ ...r, category: "", product: "", boxes: "", availableBoxes: 0 }))
      );
      return;
    }

    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const stockList = [];

      Object.entries(data).forEach(([date, items]) => {
        Object.entries(items).forEach(([id, item]) => {
          if (item.warehouse === fromWarehouse) stockList.push({ ...item, id });
        });
      });

      setProducts(stockList);
    });
  }, [fromWarehouse]);

  // Handle row input changes
  const handleRowChange = (id, field, value) => {
    setTransferRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        let updated = { ...row, [field]: value };
        if (field === "category") {
          updated.product = "";
          const filtered = products.filter((p) => p.category === value);
          updated.availableBoxes = filtered.length > 0 ? filtered[0].boxes : 0;
        }
        if (field === "product") {
          const p = products.find((prod) => prod.productName === value && prod.category === row.category);
          updated.availableBoxes = p ? p.boxes : 0;
        }
        return updated;
      })
    );
  };

  // Add a new row
  const addRow = () => {
    setTransferRows((prev) => [...prev, { id: Date.now(), category: "", product: "", boxes: "", availableBoxes: 0 }]);
  };

  // Remove a row
  const removeRow = (id) => {
    setTransferRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Handle Transfer
  const handleTransfer = async () => {
    if (!fromWarehouse || !toWarehouse)
      return alert("Select From and To warehouses");

    const stocksRef = ref(db, "stocks");
    const snapshot = await get(stocksRef);
    if (!snapshot.exists()) return alert("Stocks not found");

    const stocksData = snapshot.val();

    for (let row of transferRows) {
      const { category, product, boxes, availableBoxes } = row;
      const boxesToTransfer = Number(boxes);

      if (
        !category ||
        !product ||
        !boxesToTransfer ||
        boxesToTransfer <= 0 ||
        boxesToTransfer > availableBoxes
      ) {
        return alert("Check all row fields and box limits");
      }

      // 🔑 ONE UUID FOR THIS ROW (USED EVERYWHERE)
      const transferUUID =
        Date.now() + Math.floor(Math.random() * 1000);

      // ---------- FROM WAREHOUSE ----------
      let fromStock = null;

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
              totalValue:
                newBoxes *
                item.piecesPerBox *
                item.pricePerPiece,
            });
          }
        });
      });

      // ---------- TO WAREHOUSE ----------
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
              totalValue:
                newBoxes *
                item.piecesPerBox *
                item.pricePerPiece,
            });

            foundTo = true;
          }
        });
      });

      if (!foundTo && fromStock) {
        const dateKey = formattedLocalDate;

        await set(ref(db, `stocks/${dateKey}/${transferUUID}`), {
          ...fromStock,
          id: transferUUID,
          warehouse: toWarehouse,
          boxes: boxesToTransfer,
          totalPieces:
            boxesToTransfer * fromStock.piecesPerBox,
          totalValue:
            boxesToTransfer *
            fromStock.piecesPerBox *
            fromStock.pricePerPiece,
        });
      }

      // ---------- WENTRY (SAME UUID BOTH SIDES) ----------
      const entryData = {
        id: transferUUID,
        from: fromWarehouse,
        to: toWarehouse,
        category,
        product,
        boxes: boxesToTransfer,
        date: formattedLocalDate,
        createdAt: timestampLocal,
      };

      await set(
        ref(db, `wentry/${fromWarehouse}/${transferUUID}`),
        entryData
      );

      await set(
        ref(db, `wentry/${toWarehouse}/${transferUUID}`),
        entryData
      );
    }

    alert("✅ Stock transferred successfully!");

    // Reset
    setTransferRows([
      {
        id: Date.now(),
        category: "",
        product: "",
        boxes: "",
        availableBoxes: 0,
      },
    ]);
    setFromWarehouse("");
    setToWarehouse("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-3 sm:px-4">
      <header className="flex items-center gap-3 py-4 max-w-2xl mx-auto w-full">
        <Button variant="ghost" size="icon" onClick={() => navigate("/warehouse")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Transfer Stock</h1>
        </div>
      </header>

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

            {/* From / To Warehouses */}
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
                    <option key={w} value={w}>{w}</option>
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
                  {warehouses.filter((w) => w !== fromWarehouse).map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transfer Rows */}
            {transferRows.map((row) => (
              <div key={row.id} className="border p-3 rounded-md space-y-3 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={row.category}
                      onChange={(e) => handleRowChange(row.id, "category", e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="">Select category</option>
                      {[...new Set(products.map((p) => p.category))].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <select
                      value={row.product}
                      onChange={(e) => handleRowChange(row.id, "product", e.target.value)}
                      disabled={!row.category}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm disabled:opacity-50"
                    >
                      <option value="">Select product</option>
                      {products.filter((p) => p.category === row.category).map((p) => (
                        <option key={p.id} value={p.productName}>{p.productName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Boxes to Transfer</Label>
                    <Input
                      type="number"
                      value={row.boxes}
                      onChange={(e) => handleRowChange(row.id, "boxes", e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Boxes</Label>
                    <Input
                      type="number"
                      value={row.availableBoxes}
                      readOnly
                      className="w-full h-10 rounded-md border border-border bg-muted/20 cursor-not-allowed px-3 text-sm"
                    />
                  </div>
                </div>

                {/* Remove button */}
                {transferRows.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    className="absolute top-3 right-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add row button */}
            <Button className="w-full h-11 text-sm font-semibold gap-2" onClick={addRow}>
              + Add Product
            </Button>

            {/* Transfer Stock Button */}
            <Button className="w-full h-11 text-sm font-semibold gap-2 mt-2" onClick={handleTransfer}>
              <RefreshCcw className="h-4 w-4" /> Transfer Stock
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransferStock;
