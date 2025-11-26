import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "../../components/ui/command";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { db } from "../../firebase";
import { ref, push, set, onValue } from "firebase/database";
import { cn } from "../../lib/utils";

const formatToISO = (dateObj) => {
  if (!dateObj) return "";
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const SalesInvoice = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);

  const [selectedParty, setSelectedParty] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOpen, setProductOpen] = useState(false);

  const [box, setBox] = useState("");
  const [piecesPerBox, setPiecesPerBox] = useState("");
  const [pricePerItem, setPricePerItem] = useState("");

  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [createdAt, setCreatedAt] = useState(new Date());

  // LOAD DATA
  useEffect(() => {
    const productRef = ref(db, "products");
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProducts(
          Object.keys(data).map((id) => ({
            id,
            ...data[id],
          }))
        );
      }
    });

    const partyRef = ref(db, "parties");
    onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setParties(Object.values(data));
    });
  }, []);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setPricePerItem(product.price || "");
    setProductOpen(false);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !box || !piecesPerBox || !pricePerItem) {
      return alert("Please fill all fields.");
    }

    const totalItem =
      Number(box) * Number(piecesPerBox) * Number(pricePerItem);

    const newItem = {
      party: selectedParty,
      productName: selectedProduct.productName,
      category: selectedProduct.category,
      box: Number(box),
      piecesPerBox: Number(piecesPerBox),
      pricePerItem: Number(pricePerItem),
      total: totalItem,
      createdAt: formatToISO(createdAt),
    };

    setItems([...items, newItem]);
    setSubtotal((prev) => prev + totalItem);

    // Reset fields
    setSelectedProduct(null);
    setBox("");
    setPiecesPerBox("");
    setPricePerItem("");
  };

  const handleCreateSales = async () => {
    if (items.length === 0) return alert("Add items first.");

    const isoDate = formatToISO(createdAt);

    const saleData = {
      id: Date.now(),
      createdAt: isoDate,
      party: selectedParty,
      items,
      subtotal,
      total: subtotal,
    };

    try {
      const saleRef = ref(db, `sales/date-${isoDate}`);
      const newSale = push(saleRef);
      await set(newSale, saleData);

      alert("Sale saved successfully!");
      navigate("/sales");
    } catch (err) {
      console.error(err);
      alert("Error saving sale.");
    }
  };

  const totalBoxes = items.reduce((s, i) => s + i.box, 0);
  const totalPieces = items.reduce(
    (s, i) => s + i.box * i.piecesPerBox,
    0
  );

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 space-y-6">

      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/sales")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            Create Sales Invoice
          </h1>
        </div>

        <div className="w-8" /> {/* Placeholder for right side to keep title centered */}
      </header>

      {/* ONE BIG BOX FOR ALL INPUTS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">

        {/* PARTY & DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Party</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p, i) => (
                <option key={i} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Invoice Date</label>

            <DatePicker
              selected={createdAt}
              onChange={(d) => setCreatedAt(d)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* PRODUCT FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">

          {/* PRODUCT */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Product</label>

            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between px-3">
                  {selectedProduct
                    ? selectedProduct.productName
                    : "Select Product"}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0 w-[250px]">
                <Command>
                  <CommandInput placeholder="Search product..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>

                    {products.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.productName}
                        onSelect={() => handleSelectProduct(p)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct?.id === p.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {p.productName}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CATEGORY */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Category</label>
            <Input
              value={selectedProduct?.category || ""}
              readOnly
              className="bg-slate-100"
            />
          </div>

          {/* BOX */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Box</label>
            <Input
              type="number"
              value={box}
              onChange={(e) => setBox(e.target.value)}
            />
          </div>

          {/* PIECES */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Pieces/Box</label>
            <Input
              type="number"
              value={piecesPerBox}
              onChange={(e) => setPiecesPerBox(e.target.value)}
            />
          </div>

          {/* PRICE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Price/Item (₹)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricePerItem}
              onChange={(e) => {
                const value = e.target.value;

                // Prevent negative values
                if (value < 0) return;

                // Allow empty, integers, decimals
                if (/^\d*\.?\d*$/.test(value)) {
                  setPricePerItem(value);
                }
              }}
            />
          </div>

        </div>

        {/* ADD BUTTON */}
        <div className="flex justify-end">
          <Button className="bg-primary" onClick={handleAddItem}>
            Add to Invoice
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Sr</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Box</th>
              <th className="border p-2">Pieces</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No items added.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{item.category}</td>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2 text-center">{item.box}</td>
                  <td className="border p-2 text-center">
                    {item.piecesPerBox}
                  </td>
                  <td className="border p-2 text-right">
                    ₹{item.pricePerItem}
                  </td>
                  <td className="border p-2 text-right">₹{item.total}</td>
                </tr>
              ))
            )}

            {items.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="2" className="border p-2 text-right">
                  Total
                </td>
                <td className="border p-2" />
                <td className="border p-2 text-center">{totalBoxes}</td>
                <td className="border p-2 text-center">{totalPieces}</td>
                <td colSpan="2" className="border p-2 text-right">
                  ₹{subtotal}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button className="bg-blue-600" onClick={handleCreateSales}>
          Create Sales
        </Button>
      </div>
    </div>
  );
};

export default SalesInvoice;
