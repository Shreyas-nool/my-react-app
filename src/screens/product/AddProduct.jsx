import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronsUpDown,
  Check,
  Pencil,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, push, onValue, update, remove } from "firebase/database";

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

  // ✅ pieces per box (DEFAULT = 0)
  const [piecesPerBox, setPiecesPerBox] = useState(0);

  // Add category
  const [showCatPopup, setShowCatPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Edit category
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

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

  // Add category
  const submitNewCategory = () => {
    if (!newCategoryName.trim()) return;

    push(ref(db, "categories"), { name: newCategoryName.trim() });
    setNewCategoryName("");
    setShowCatPopup(false);
  };

  // Save product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !categoryId || piecesPerBox < 1) {
      alert("Please fill all required fields correctly");
      return;
    }

    const newProduct = {
      productName,
      category,
      categoryId,
      createdAt: createdAt.toISOString().slice(0, 10),
      notes,

      // ✅ MASTER DATA
      piecesPerBox: Number(piecesPerBox),

      // ✅ STOCK STARTS FROM ZERO
      stockPieces: 0,
    };

    try {
      await push(ref(db, "products"), newProduct);

      alert("Product added successfully");

      // reset
      setProductName("");
      setCategory("");
      setCategoryId("");
      setNotes("");
      setCreatedAt(new Date());
      setPiecesPerBox(0);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
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
                    className="flex-1 justify-between"
                  >
                    {category || "Select Category"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[260px] p-0">
                  <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          className="flex justify-between items-center"
                        >
                          <div
                            className="flex items-center gap-2 flex-1"
                            onClick={() => {
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
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCategoryId(cat.id);
                                setEditCategoryName(cat.name);
                                setShowEditPopup(true);
                                setOpen(false);
                              }}
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Delete this category?")) {
                                  remove(ref(db, `categories/${cat.id}`));
                                }
                              }}
                            >
                              <Trash size={14} className="text-red-500" />
                            </button>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => setShowCatPopup(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* PIECES PER BOX */}
          <div>
            <label className="text-sm font-medium">Pieces</label>
            <input
              type="number"
              min="1"
              value={piecesPerBox}
              onChange={(e) => setPiecesPerBox(Number(e.target.value))}
              className="w-full border rounded p-2"
              required
            />
          </div>
        </div>

        {/* DATE + NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Created On</label>
            <DatePicker
              selected={createdAt}
              onChange={(d) => setCreatedAt(d)}
              dateFormat="dd/MM/yyyy"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded p-2 h-10 resize-none"
            />
          </div>
        </div>

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
              className="w-full border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCatPopup(false)}
                className="border px-3 py-1 rounded"
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

      {/* EDIT CATEGORY POPUP */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded shadow-md w-80 space-y-3">
            <h2 className="text-lg font-semibold">Edit Category</h2>
            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditPopup(false)}
                className="border px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  update(ref(db, `categories/${editCategoryId}`), {
                    name: editCategoryName.trim(),
                  });
                  setShowEditPopup(false);
                }}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEntry;
