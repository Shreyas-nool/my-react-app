import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "../../components/ui/command";

import { db } from "../../firebase";
import { ref, onValue, push, set } from "firebase/database";
import { cn } from "../../lib/utils";

const AddPurchase = () => {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState([]);

  const [selectedStock, setSelectedStock] = useState(null);
  const [productOpen, setProductOpen] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [notes, setNotes] = useState("");

  // LOAD SUPPLIERS
  useEffect(() => {
    const partyRef = ref(db, "parties");
    onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setParties(Object.values(data));
    });
  }, []);

  // LOAD STOCKS
  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stockItems = [];
        Object.values(data).forEach((dateGroup) => {
          Object.values(dateGroup).forEach((stock) => {
            stockItems.push(stock);
          });
        });
        setStocks(stockItems);
      }
    });
  }, []);

  // SELECT STOCK ITEM
  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setQuantity(1);
    setPrice(stock.pricePerPiece || 0);
    setProductOpen(false);
  };

  // ADD ITEM
  const handleAddItem = () => {
    if (!selectedStock || !quantity || !price) {
      return alert("Please select a stock item and fill quantity.");
    }

    if (quantity > selectedStock.totalPieces) {
      return alert("Quantity exceeds available stock!");
    }

    const total = Number(quantity) * Number(price);

    const newItem = {
      productName: selectedStock.productName,
      category: selectedStock.category,
      stockId: selectedStock.id,
      quantity: Number(quantity),
      price: Number(price),
      total,
    };

    setItems([...items, newItem]);
    setSubtotal((prev) => prev + total);

    setSelectedStock(null);
    setQuantity("");
    setPrice("");
  };

  // SAVE PURCHASE
  const handleSavePurchase = async () => {
    if (!supplier) return alert("Please select a supplier.");
    if (items.length === 0) return alert("Add at least one item.");

    const isoDate = date.toISOString().split("T")[0];

    const purchaseData = {
      supplier,
      date: isoDate,
      items,
      subtotal,
      total: subtotal,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      const purchasesRef = ref(db, "purchases");
      const newPurchase = push(purchasesRef);
      await set(newPurchase, purchaseData);

      alert("Purchase saved successfully!");
      navigate("/purchase");
    } catch (err) {
      console.error(err);
      alert("Error saving purchase.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 space-y-6">
      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/purchase")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">Add Purchase</h1>
        </div>

        <div className="w-8" />
      </header>

      {/* MAIN INPUT CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">

        {/* SUPPLIER & DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Supplier</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Choose Supplier --</option>
              {parties.map((p, i) => (
                <option key={i} value={p.name || p.partyName}>
                  {p.name || p.partyName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Purchase Date</label>
            <Input
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>
        </div>

        {/* PRODUCT FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Product</label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between px-3">
                  {selectedStock?.productName || "Select Product"}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0 w-[250px]">
                <Command>
                  <CommandInput placeholder="Search stock..." />
                  <CommandList>
                    <CommandEmpty>No stock found.</CommandEmpty>
                    {stocks.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.productName}
                        onSelect={() => handleSelectStock(s)}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedStock?.id === s.id ? "opacity-100" : "opacity-0")} />
                        {s.productName}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Price</label>
            <Input type="number" value={price} readOnly className="bg-slate-100" />
          </div>

          <div className="flex flex-col justify-end">
            <Button className="bg-primary w-full" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Product</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">No items added.</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">{item.category}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-right">{item.price}</td>
                  <td className="border p-2 text-right">{item.total}</td>
                </tr>
              ))
            )}

            {items.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="4" className="border p-2 text-right">Subtotal</td>
                <td className="border p-2 text-right">{subtotal}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NOTES + SAVE BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div className="flex flex-col w-full">
          <label className="text-sm font-medium mb-1">Notes</label>
          <Textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <Button className="bg-blue-600 h-10 px-6" onClick={handleSavePurchase}>
          Save Purchase
        </Button>
      </div>
    </div>
  );
};

export default AddPurchase;
