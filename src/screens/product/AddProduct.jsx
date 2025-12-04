import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, push, onValue } from "firebase/database";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../components/ui/popover";

import { Button } from "../../components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "../../components/ui/command";

import { cn } from "../../lib/utils";

const ProductEntry = () => {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);

  const [createdAt, setCreatedAt] = useState(new Date());
  const [notes, setNotes] = useState("");

  const [piecesPerBox, setPiecesPerBox] = useState(1); // New field

  const [showCatPopup, setShowCatPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load categories
  useEffect(() => {
    const catRef = ref(db, "categories");
    onValue(catRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        id,
        name: data[id].name,
      }));
      setCategories(list);
    });
  }, []);

  // Save new category
  const submitNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const catRef = ref(db, "categories");
    push(catRef, { name: newCategoryName.trim() });

    setShowCatPopup(false);
    setNewCategoryName("");
  };

  // Submit Product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !categoryId || !piecesPerBox) {
      alert("Please fill all required fields");
      return;
    }

    const newProduct = {
      productName,
      category,
      categoryId,
      createdAt: createdAt.toISOString().slice(0, 10),
      notes,
      piecesPerBox: Number(piecesPerBox), // Save pieces per box
    };

    try {
      const productsRef = ref(db, "products");
      await push(productsRef, newProduct);

      alert("Product added successfully!");

      // Reset form
      setProductName("");
      setCategory("");
      setCategoryId("");
      setNotes("");
      setCreatedAt(new Date());
      setPiecesPerBox(1);
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b">
        <button
          onClick={() => navigate("/product")}
          className="h-8 w-8 p-2 hover:bg-gray-200 rounded"
        >
          <ArrowLeft />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Add New Product</h1>
        </div>

        <div className="w-8" />
      </header>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* PRODUCT NAME */}
          <div>
            <label className="text-sm font-medium">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm font-medium">Category</label>

            <div className="flex gap-2 items-center">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 h-10 justify-between text-left"
                  >
                    {category || "Select Category"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[220px] p-0">
                  <Command className="[&_div[data-slot=command-input-wrapper]]:h-12">
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => {
                            setCategory(cat.name);
                            setCategoryId(cat.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              categoryId === cat.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Add Category Button */}
              <button
                type="button"
                onClick={() => setShowCatPopup(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* PIECES PER BOX */}
          <div>
            <label className="text-sm font-medium">Pieces/Box</label>
            <input
              type="number"
              min="1"
              value={piecesPerBox}
              onChange={(e) => setPiecesPerBox(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
        </div>

        {/* DATE + NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CREATED ON */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Created On</label>
            <DatePicker
              selected={createdAt}
              onChange={(d) => setCreatedAt(d)}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border p-2 rounded h-10 resize-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Save Product
          </button>
        </div>
      </form>

      {/* ADD CATEGORY POPUP */}
      {showCatPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded shadow-md w-80 space-y-3">
            <h2 className="text-lg font-semibold">Add New Category</h2>

            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCatPopup(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitNewCategory}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEntry;
