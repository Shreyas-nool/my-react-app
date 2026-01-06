import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "../../components/ui/command";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronsUpDown, Check, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { ref, set, runTransaction, onValue } from "firebase/database";
import { cn } from "../../lib/utils";

// Format ISO with date & time
const formatToISO = (dateObj) => {
  if (!dateObj) return "";
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
};

// Round to 2 decimals safely
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const formatPrice = (value) => {
  const v = Number(value || 0);
  return v !== 0 && v < 0.01 ? v.toFixed(4) : v.toFixed(2);
};


const SalesInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceToEdit = location.state;

  const [stocks, setStocks] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [partyOpen, setPartyOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);
  const [productOpen, setProductOpen] = useState(false);

  const [box, setBox] = useState("");
  const [piecesPerBox, setPiecesPerBox] = useState("");
  const [pricePerItem, setPricePerItem] = useState("");
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [createdAt, setCreatedAt] = useState(new Date());
  const [searchText, setSearchText] = useState("");
  const [stockWarning, setStockWarning] = useState("");

  // Fetch stocks & parties live
  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setStocks([]);

      const stockItems = [];
      Object.entries(data).forEach(([dateKey, dateGroup]) => {
        Object.entries(dateGroup).forEach(([id, stock]) => {
          stockItems.push({ ...stock, id, dateKey });
        });
      });
      setStocks(stockItems);
    });

    const partiesRef = ref(db, "parties");
    onValue(partiesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setParties([]);

      const list = Object.entries(data).map(([id, details]) => ({
        id,
        ...details,
      }));

      setParties(list);
    });
  }, []);


  // Pre-fill invoice if editing
  useEffect(() => {
    if (invoiceToEdit) {
      setSelectedPartyId(invoiceToEdit.partyId || "");
      setItems(invoiceToEdit.items || []);
      setSubtotal(invoiceToEdit.subtotal || invoiceToEdit.total || 0);
      setCreatedAt(invoiceToEdit.createdAt ? new Date(invoiceToEdit.createdAt) : new Date());
      if (invoiceToEdit.items?.[0]?.category) setSelectedCategory(invoiceToEdit.items[0].category);
    }
  }, [invoiceToEdit]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setBox(1);
    setPiecesPerBox(Number(stock.piecesPerBox) || 0);
    setPricePerItem(Number(stock.pricePerPiece) || 0);
    setProductOpen(false);
    setStockWarning("");
  };

  const handleBoxChange = (value) => {
    if (!selectedStock || value < 0) return;
    const totalStockPieces = (Number(selectedStock.boxes) || 0) * (Number(selectedStock.piecesPerBox) || 1);
    const desiredPieces = value * (Number(selectedStock.piecesPerBox) || 1);
    if (desiredPieces > totalStockPieces) {
      setStockWarning(`Not enough stock! Only ${totalStockPieces} pieces available.`);
    } else {
      setStockWarning("");
    }
    setBox(value);
  };

  const handleAddItem = () => {
    if (!selectedPartyId) return alert("Please select a party before adding items.");

    if (!selectedStock || !box || !piecesPerBox || pricePerItem === "")
      return alert("Please fill all fields.");

    const totalStockPieces = (Number(selectedStock.boxes) || 0) * (Number(selectedStock.piecesPerBox) || 1);
    const desiredPieces = Number(box) * Number(piecesPerBox);
    if (desiredPieces > totalStockPieces)
      return alert(`Cannot add! Only ${totalStockPieces} pieces available in stock.`);

    const quantity = Number(box) * Number(piecesPerBox);
    const price = parseFloat(pricePerItem);
    const totalItem = round2(quantity * price);

    const newItem = {
      partyId: selectedPartyId,
      productName: selectedStock.productName,
      category: selectedStock.category,
      box: Number(box),
      piecesPerBox: Number(piecesPerBox),
      pricePerItem: price,
      total: totalItem,
      stockId: selectedStock.id,
      dateKey: selectedStock.dateKey,
    };

    setItems([...items, newItem]);
    setSubtotal((prev) => round2(prev + totalItem));

    // reset selection
    setSelectedStock(null);
    setBox("");
    setPiecesPerBox("");
    setPricePerItem("");
    setStockWarning("");
  };

  const handleDeleteItem = (index) => {
    const itemToDelete = items[index];
    setItems(items.filter((_, i) => i !== index));
    setSubtotal((prev) => round2(prev - (Number(itemToDelete.total) || 0)));
  };

  const updateStockAfterSale = async (saleItems) => {
    for (const item of saleItems) {
      const stockRef = ref(db, `stocks/${item.dateKey}/${item.stockId}`);
      await runTransaction(stockRef, (current) => {
        if (!current) return current;
        let totalPiecesStock = (Number(current.boxes) || 0) * (Number(current.piecesPerBox) || 1);
        const soldPieces = (Number(item.box) || 0) * (Number(item.piecesPerBox) || 0);
        totalPiecesStock -= soldPieces;
        const updatedBoxes = Math.floor(totalPiecesStock / (Number(current.piecesPerBox) || 1));
        const updatedPieces = totalPiecesStock % (Number(current.piecesPerBox) || 1);
        return { ...current, boxes: updatedBoxes, pieces: updatedPieces };
      });
    }
  };

  const handleCreateSales = async () => {
    if (!selectedPartyId) return alert("Please select a party.");
    if (items.length === 0) return alert("Add items first.");

    const isoDateTime = formatToISO(createdAt);

    try {
      let invoiceNumber = invoiceToEdit?.invoiceNumber;
      let saleRef;
      if (invoiceToEdit) {
        saleRef = ref(db, `sales/${isoDateTime}/invoice-${invoiceNumber}`);
      } else {
        const counterRef = ref(db, "invoiceCounter");
        const counterRes = await runTransaction(counterRef, (current) => (Number(current) || 1000) + 1);
        invoiceNumber = counterRes.snapshot.val();
        saleRef = ref(db, `sales/${isoDateTime}/invoice-${invoiceNumber}`);
      }

      const saleData = {
        createdAt: isoDateTime,
        partyId: selectedPartyId,
        items,
        subtotal,
        total: subtotal,
        invoiceNumber,
      };

      await set(saleRef, saleData);
      if (!invoiceToEdit) await updateStockAfterSale(items);

      alert(invoiceToEdit ? `Invoice updated! Invoice No: ${invoiceNumber}` : `Sale saved! Invoice No: ${invoiceNumber}`);
      navigate("/sales");
    } catch (err) {
      console.error(err);
      alert("Error saving sale.");
    }
  };

  const totalBoxes = items.reduce((s, i) => s + Number(i.box || 0), 0);
  const filteredStocks = selectedCategory ? stocks.filter((s) => s.category === selectedCategory) : [];
  const selectedPartyObj = parties.find(p => p.id === selectedPartyId);
  const selectedPartyName = selectedPartyObj?.name || "";

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 space-y-6">
      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sales")} className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            {invoiceToEdit ? "Edit Sales Invoice" : "Create Sales Invoice"}
          </h1>
        </div>
        <div className="w-8" />
      </header>

      {/* Party & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Party</label>
          <Popover open={partyOpen} onOpenChange={setPartyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between px-3"
                disabled={items.length > 0} // LOCK if items already exist
              >
                {selectedPartyName || "-- Choose Party --"}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[260px]">
              <Command>
                <CommandInput placeholder="Search party..." onValueChange={setSearchText} />
                <CommandList>
                  <CommandEmpty>No party found.</CommandEmpty>
                  {parties
                    .filter(p => (p.name || "").toLowerCase().includes((searchText || "").toLowerCase()))
                    .map((p, i) => (
                      <CommandItem
                        key={i}
                        value={p.id}
                        onSelect={() => {
                          if (items.length === 0) {
                            setSelectedPartyId(p.id);
                            setPartyOpen(false);
                          } else {
                            alert("Party cannot be changed after adding items.");
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPartyId === p.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {p.name}
                      </CommandItem>
                    ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Invoice Date</label>
          <DatePicker
            selected={createdAt}
            onChange={(d) => setCreatedAt(d)}
            timeIntervals={1}
            dateFormat="dd/MM/yyyy"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            maxDate={new Date()}
          />
        </div>
      </div>

      {/* Category & Product */}
      <div className="flex gap-3 mt-4 items-end w-full">
        {/* Category */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium">Category</label>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between px-3">
                {selectedCategory || "Select Category"}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[260px]">
              <Command>
                <CommandEmpty>No category found.</CommandEmpty>
                {Array.from(new Set(stocks.map(s => s.category))).map((cat, i) => (
                  <CommandItem key={i} onSelect={() => { setSelectedCategory(cat); setSelectedStock(null); setCategoryOpen(false); }}>
                    {cat}
                  </CommandItem>
                ))}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Product */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium">Product</label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between px-3">
                {selectedStock ? selectedStock.productName : "Select Product"}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[260px]">
              <Command>
                <CommandInput placeholder="Search product..." onValueChange={setSearchText} />
                <CommandList>
                  <CommandEmpty>No product found.</CommandEmpty>
                  {filteredStocks.filter(s => (s.productName || "").toLowerCase().includes((searchText || "").toLowerCase())).map(s => (
                    <CommandItem key={s.id} onSelect={() => handleSelectStock(s)}>
                      <Check className={cn("mr-2 h-4 w-4", selectedStock?.id === s.id ? "opacity-100" : "opacity-0")} />
                      {s.productName}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Box */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium">Box</label>
          <Input
            type="number"
            value={box}
            onChange={(e) => setBox(e.target.value)} // ← keep as string for blank
          />
          {stockWarning && <p className="text-red-500 text-xs mt-1">{stockWarning}</p>}
        </div>

        {/* Pieces/Box */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium">Pieces/Box</label>
          <Input type="number" value={piecesPerBox} readOnly className="bg-slate-100" />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium">Price/Item</label>
          <Input type="number" step="0.01" value={pricePerItem} onChange={(e) => setPricePerItem(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button className="bg-primary" onClick={handleAddItem}>Add to Invoice</Button>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border mt-4">
        <table className="w-full border text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">S.R</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Box</th>
              <th className="border p-2">Pieces</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-4">No items added.</td></tr>
            ) : items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{item.category}</td>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2">{item.box}</td>
                <td className="border p-2">{item.piecesPerBox}</td>
                <td className="border p-2">{formatPrice(item.pricePerItem)}</td>
                <td className="border p-2">{formatPrice(item.total)}</td>
                <td className="border p-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="2" className="border p-2"></td>
                <td className="border p-2 text-right">Total:</td>
                <td className="border p-2">{totalBoxes}</td>
                <td className="border p-2"></td>
                <td className="border p-2 text-right">Grand Total:</td>
                <td className="border p-2">{formatPrice(subtotal)}</td>
                <td className="border p-2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleCreateSales}>{invoiceToEdit ? "Update Invoice" : "Create Invoice"}</Button>
      </div>
    </div>
  );
};

export default SalesInvoice;
