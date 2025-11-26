import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { db } from "../../firebase";
import { ref, onValue, push, set } from "firebase/database";

export default function AddPurchase() {
  const navigate = useNavigate();

  // States
  const [parties, setParties] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [items, setItems] = useState([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [notes, setNotes] = useState("");

  // Load parties
  useEffect(() => {
    const partiesRef = ref(db, "parties");
    const unsub = onValue(partiesRef, (snap) => {
      const data = snap.val();
      if (data) setParties(Object.values(data));
      else setParties([]);
    });
    return () => unsub();
  }, []);

  // Add item to purchase list
  const handleAddItem = () => {
    if (!productName || !quantity || !price) {
      return alert("Please fill all product fields.");
    }

    const total = Number(quantity) * Number(price);
    const newItem = {
      productName,
      quantity: Number(quantity),
      price: Number(price),
      total,
    };

    setItems([...items, newItem]);
    setSubtotal(prev => prev + total);

    // Reset input fields
    setProductName("");
    setQuantity("");
    setPrice("");
  };

  // Save purchase to Firebase
  const handleSavePurchase = async () => {
    if (!supplier) return alert("Choose or enter supplier name.");
    if (items.length === 0) return alert("Add at least one item.");

    const purchaseData = {
      supplier,
      date,
      items,
      subtotal,
      total: subtotal,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      const purchasesRef = ref(db, "purchases");
      const newRef = push(purchasesRef);
      await set(newRef, purchaseData);
      alert("✅ Purchase saved.");
      navigate("/purchase");
    } catch (err) {
      console.error(err);
      alert("Failed to save purchase.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-8">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/purchase")} className="h-8 w-8 p-0 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Add Purchase</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">-- Choose supplier --</option>
            {parties.map((p, i) => (
              <option key={i} value={p.name || p.party || p.partyName}>
                {p.name || p.party || p.partyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      {/* Add Product Item */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Product name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Qty"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Price per unit"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleAddItem} className="bg-primary w-full">Add Item</Button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Product</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-4">No items added.</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">{item.quantity}</td>
                  <td className="border p-2">₹{item.price}</td>
                  <td className="border p-2">₹{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total & Notes */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border rounded p-2 w-full sm:w-64"
            rows={2}
            placeholder="Optional notes"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="font-semibold text-lg">Total: ₹{subtotal.toFixed(2)}</div>
          <Button onClick={handleSavePurchase} className="bg-blue-600">Save Purchase</Button>
        </div>
      </div>
    </div>
  );
}
