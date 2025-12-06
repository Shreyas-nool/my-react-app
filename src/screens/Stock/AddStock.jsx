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

import { ArrowLeft, ChevronsUpDown, Check, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

import { Label } from "../../components/ui/label";

import { db } from "../../firebase";
import { ref, onValue, push, set } from "firebase/database";
import { cn } from "../../lib/utils";

const formatToISO = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const AddStockScreen = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [category, setCategory] = useState("");
  const [piecesPerBox, setPiecesPerBox] = useState("");
  const [boxes, setBoxes] = useState("");
  const [pricePerPiece, setPricePerPiece] = useState("");

  const [warehouse, setWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState([]);

  // FETCH PRODUCTS
  useEffect(() => {
    const productRef = ref(db, "products/");
    onValue(productRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));
      setProducts(list);
    });
  }, []);

  // FETCH WAREHOUSES
  useEffect(() => {
    const whRef = ref(db, "warehouse/");
    onValue(whRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        id,
        name: data[id].name || "Unnamed",
        createdAt: data[id].createdAt,
      }));
      setWarehouses(list);
    });
  }, []);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setProductOpen(false);

    setCategory(prod.category || "");
    setPiecesPerBox(prod.piecesPerBox || 0);
    setBoxes("");
    setPricePerPiece(prod.pricePerPiece || prod.price || "");
  };

  const handleSaveStock = async () => {
    if (!selectedProduct || !boxes || !pricePerPiece || !warehouse) {
      return alert("Please fill all fields.");
    }

    const today = new Date();
    const isoDate = formatToISO(today);

    const totalPieces = Number(boxes) * Number(piecesPerBox);
    const totalValue = totalPieces * Number(pricePerPiece);

    try {
      const stockRef = ref(db, `stocks/date-${isoDate}`);

      onValue(
        stockRef,
        async (snapshot) => {
          const data = snapshot.val() || {};
          let existingKey = null;
          let existingStock = null;

          // Find matching entry
          for (let key in data) {
            if (
              data[key].productId === selectedProduct.id &&
              data[key].warehouse === warehouse
            ) {
              existingKey = key;
              existingStock = data[key];
              break;
            }
          }

          if (existingStock) {
            // Update existing
            const updatedStock = {
              ...existingStock,
              boxes: Number(existingStock.boxes) + Number(boxes),
              piecesPerBox,
              pricePerPiece: Number(pricePerPiece),

              totalPieces:
                Number(existingStock.totalPieces) + Number(totalPieces),
              totalValue:
                Number(existingStock.totalValue) + Number(totalValue),
            };

            await set(
              ref(db, `stocks/date-${isoDate}/${existingKey}`),
              updatedStock
            );

            alert("Stock updated successfully!");
          } else {
            // Create new
            const stockEntry = {
              id: Date.now(),
              date: isoDate,
              productId: selectedProduct.id,
              productName: selectedProduct.productName,
              category,
              boxes: Number(boxes),
              piecesPerBox: Number(piecesPerBox),
              pricePerPiece: Number(pricePerPiece),
              warehouse,
              totalPieces,
              totalValue,
              createdAt: isoDate,
            };

            const newStock = push(stockRef);
            await set(newStock, stockEntry);

            alert("Stock saved successfully!");
          }

          // Reset
          setSelectedProduct(null);
          setCategory("");
          setPiecesPerBox("");
          setBoxes("");
          setPricePerPiece("");
          setWarehouse("");
        },
        { onlyOnce: true }
      );
    } catch (err) {
      console.error(err);
      alert("Error saving stock.");
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto p-4 sm:p-6 mt-6 sm:mt-10 space-y-6 overflow-y-scroll"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      <header className="flex items-center justify-between py-2 border-b border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
          Add Stock
        </h1>
        <div className="w-8" />
      </header>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border max-w-xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            New Stock Entry
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* PRODUCT SELECT */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Product</Label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between px-3 font-normal"
                >
                  {selectedProduct
                    ? selectedProduct.productName
                    : "Select Product"}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0">
                <Command>
                  <CommandInput placeholder="Search product..." />
                  <CommandList>
                    <CommandEmpty>No products found.</CommandEmpty>
                    {products.map((prod) => (
                      <CommandItem
                        key={prod.id}
                        value={prod.productName}
                        onSelect={() => handleSelectProduct(prod)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct?.id === prod.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {prod.productName}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CATEGORY */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Input type="text" value={category} disabled className="bg-muted/40" />
          </div>

          {/* PIECES PER BOX */}
          <div className="space-y-1">
            <Label>Pieces Per Box</Label>
            <Input
              type="number"
              value={piecesPerBox}
              disabled
              className="bg-muted/40"
            />
          </div>

          {/* BOXES */}
          <div className="space-y-1">
            <Label>Boxes</Label>
            <Input
              type="number"
              value={boxes}
              onChange={(e) => setBoxes(e.target.value)}
            />
          </div>

          {/* PRICE PER PIECE */}
          <div className="space-y-1">
            <Label>Price Per Piece</Label>
            <Input
              type="number"
              value={pricePerPiece}
              onChange={(e) => setPricePerPiece(e.target.value)}
            />
          </div>

          {/* WAREHOUSE */}
          <div className="space-y-1">
            <Label>Warehouse</Label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="border w-full h-10 rounded-md px-3"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90"
            onClick={handleSaveStock}
          >
            <Save className="mr-2 h-4 w-4" /> Save Stock
          </Button>
        </CardContent>
      </div>
    </div>
  );
};

export default AddStockScreen;
