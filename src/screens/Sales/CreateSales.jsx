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
import { ref, push, set, onValue, runTransaction, get, child } from "firebase/database";
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
  const location = useLocation();
  const invoiceToEdit = location.state; // invoice passed via navigate

  const [stocks, setStocks] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [productOpen, setProductOpen] = useState(false);

  const [box, setBox] = useState("");
  const [piecesPerBox, setPiecesPerBox] = useState("");
  const [pricePerItem, setPricePerItem] = useState("");

  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [createdAt, setCreatedAt] = useState(new Date());

  const [searchText, setSearchText] = useState("");

  // Load stocks and parties
  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    onValue(stocksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stockItems = [];
        Object.entries(data).forEach(([dateKey, dateGroup]) => {
          Object.entries(dateGroup).forEach(([id, stock]) => {
            stockItems.push({ ...stock, id, dateKey });
          });
        });
        setStocks(stockItems);
      }
    });

    const partyRef = ref(db, "parties");
    onValue(partyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setParties(Object.values(data));
    });
  }, []);

  // Prefill form if editing
  useEffect(() => {
    if (invoiceToEdit) {
      setSelectedParty(invoiceToEdit.party || "");
      setItems(invoiceToEdit.items || []);
      setSubtotal(invoiceToEdit.subtotal || invoiceToEdit.total || 0);
      setCreatedAt(invoiceToEdit.createdAt ? new Date(invoiceToEdit.createdAt) : new Date());
    }
  }, [invoiceToEdit]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setBox(1);
    setPiecesPerBox(stock.pieces || 0);
    setPricePerItem(stock.pricePerPiece || 0);
    setProductOpen(false);
  };

  const handleBoxChange = (value) => {
    if (value < 0) return;
    setBox(value);
    setPiecesPerBox(Number(value) * (selectedStock?.pieces || 0));
  };

  const handleAddItem = () => {
    if (!selectedStock || !box || !piecesPerBox || !pricePerItem) {
      return alert("Please fill all fields.");
    }

    const totalPiecesNeeded = Number(box) * Number(piecesPerBox);
    const availablePieces = selectedStock.boxes * selectedStock.piecesPerBox + selectedStock.pieces;

    if (totalPiecesNeeded > availablePieces) {
      return alert("Not enough stock available!");
    }

    const totalItem = Number(box) * Number(piecesPerBox) * Number(pricePerItem);

    const newItem = {
      party: selectedParty,
      productName: selectedStock.productName,
      category: selectedStock.category,
      box: Number(box),
      piecesPerBox: Number(piecesPerBox),
      pricePerItem: Number(pricePerItem),
      total: totalItem,
      stockId: selectedStock.id,
      dateKey: selectedStock.dateKey,
    };

    setItems([...items, newItem]);
    setSubtotal((prev) => prev + totalItem);

    // Reset product fields
    setSelectedStock(null);
    setBox("");
    setPiecesPerBox("");
    setPricePerItem("");
  };

  const handleDeleteItem = (index) => {
    const itemToDelete = items[index];
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setSubtotal((prev) => prev - itemToDelete.total);
  };

  const updateStockAfterSale = async (saleItems) => {
    for (const item of saleItems) {
      const stockRef = ref(db, `stocks/${item.dateKey}/${item.stockId}`);
      await runTransaction(stockRef, (current) => {
        if (!current) return current;
        let totalPiecesStock = (current.boxes || 0) * (current.piecesPerBox || 0) + (current.pieces || 0);
        const soldPieces = item.box * item.piecesPerBox;
        totalPiecesStock -= soldPieces;
        const updatedBoxes = Math.floor(totalPiecesStock / current.piecesPerBox);
        const updatedPieces = totalPiecesStock % current.piecesPerBox;
        return { ...current, boxes: updatedBoxes, pieces: updatedPieces };
      });
    }
  };

  const handleCreateSales = async () => {
    if (items.length === 0) return alert("Add items first.");
    const isoDate = formatToISO(createdAt);

    try {
      let invoiceNumber = invoiceToEdit?.invoiceNumber;
      let saleRef;

      if (invoiceToEdit) {
        saleRef = ref(db, `sales/date-${isoDate}/invoice-${invoiceNumber}`);
      } else {
        const counterRef = ref(db, "invoiceCounter");
        const counterRes = await runTransaction(counterRef, (current) => (current || 1000) + 1);
        invoiceNumber = counterRes.snapshot.val();
        saleRef = ref(db, `sales/date-${isoDate}/invoice-${invoiceNumber}`);
      }

      const saleData = {
        createdAt: isoDate,
        party: selectedParty,
        items,
        subtotal,
        total: subtotal,
        invoiceNumber,
      };

      await set(saleRef, saleData);

      if (!invoiceToEdit) {
        // Update stock only for new sales
        await updateStockAfterSale(items);
      }

      alert(invoiceToEdit ? `Invoice updated! Invoice No: ${invoiceNumber}` : `Sale saved! Invoice No: ${invoiceNumber}`);
      navigate("/sales");
    } catch (err) {
      console.error(err);
      alert("Error saving sale.");
    }
  };

  const totalBoxes = items.reduce((s, i) => s + i.box, 0);
  const totalPieces = items.reduce((s, i) => s + i.box * i.piecesPerBox, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 space-y-6">
      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate("/sales")} className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">{invoiceToEdit ? "Edit Sales Invoice" : "Create Sales Invoice"}</h1>
        </div>
        <div className="w-8" />
      </header>

      {/* PARTY + DATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Party</label>
          <select
            value={selectedParty}
            disabled={items.length > 0}
            onChange={(e) => setSelectedParty(e.target.value)}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm ${items.length > 0 ? "bg-gray-200 cursor-not-allowed" : ""}`}
          >
            <option value="">-- Choose Party --</option>
            {parties.map((p, i) => (
              <option key={i} value={p.name}>{p.name}</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mt-4">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Product</label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between px-3">
                {selectedStock ? selectedStock.productName : "Select Stock Item"}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[260px]">
              <Command>
                <CommandInput placeholder="Search stock..." onValueChange={(val) => setSearchText(val)} />
                <CommandList>
                  {searchText.length < 2 && <div className="p-2 text-sm text-red-500">Enter at least 2 characters to search.</div>}
                  <CommandEmpty>No stock found.</CommandEmpty>
                  {searchText.length >= 2 &&
                    stocks
                      .filter((s) => s.productName.toLowerCase().includes(searchText.toLowerCase()))
                      .map((s) => (
                        <CommandItem key={s.id} value={s.productName} onSelect={() => handleSelectStock(s)}>
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
          <label className="text-sm font-medium">Category</label>
          <Input value={selectedStock?.category || ""} readOnly className="bg-slate-100" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Box</label>
          <Input type="number" value={box} onChange={(e) => handleBoxChange(Number(e.target.value))} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Pieces/Box</label>
          <Input type="number" value={piecesPerBox} readOnly className="bg-slate-100" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Price/Item (₹)</label>
          <Input type="number" value={pricePerItem} onChange={(e) => setPricePerItem(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button className="bg-primary" onClick={handleAddItem}>Add to Invoice</Button>
      </div>

      {/* ITEMS TABLE */}
      <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border mt-4">
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
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-4">No items added.</td></tr>
            ) : (
              items.map((item, i) => (
                <tr key={i}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{item.category}</td>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2 text-center">{item.box}</td>
                  <td className="border p-2 text-center">{item.piecesPerBox}</td>
                  <td className="border p-2 text-right">₹{item.pricePerItem}</td>
                  <td className="border p-2 text-right">₹{item.total}</td>
                  <td className="border p-2 text-center">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
            {items.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="2" className="border p-2 text-right">Total</td>
                <td className="border p-2" />
                <td className="border p-2 text-center">{totalBoxes}</td>
                <td className="border p-2 text-center">{totalPieces}</td>
                <td colSpan="3" className="border p-2 text-right">₹{subtotal}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button className="bg-blue-600" onClick={handleCreateSales}>{invoiceToEdit ? "Update Invoice" : "Create Sales"}</Button>
      </div>
    </div>
  );
};

export default SalesInvoice;
