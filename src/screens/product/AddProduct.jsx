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
  const [piecesPerBox, setPiecesPerBox] = useState(""); // Keep as string

  // Add Category Popup
  const [showCatPopup, setShowCatPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Edit Category Popup
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  useEffect(() => {
    const catRef = ref(db, "categories");
    onValue(catRef, (snapshot) => {
      const data = snapshot.val() || {};
      setCategories(
        Object.keys(data).map((id) => ({
          id,
          name: data[id].name,
        }))
      );
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName || !categoryId || Number(piecesPerBox) < 1) {
      alert("Please fill all required fields correctly");
      return;
    }

    await push(ref(db, "products"), {
      productName,
      category,
      categoryId,
      createdAt: createdAt.toISOString().slice(0, 10),
      notes,
      piecesPerBox: Number(piecesPerBox),
      stockPieces: 0,
    });

    alert("Product added successfully");

    // Reset all fields
    setProductName("");
    setCategory("");
    setCategoryId("");
    setNotes("");
    setCreatedAt(new Date());
    setPiecesPerBox("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-3">
        <button
          onClick={() => navigate("/product")}
          className="h-9 w-9 flex items-center justify-center rounded hover:bg-gray-200"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-lg font-semibold">Add New Product</h1>
        <div className="w-9" />
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-6"
      >
        {/* PRODUCT NAME */}
        <div>
          <label className="text-sm font-medium">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full h-10 border rounded px-3"
            required
          />
        </div>

        {/* CATEGORY + PIECES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-between h-10"
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
                          className="flex justify-between"
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
                                "h-4 w-4",
                                categoryId === cat.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </div>

                          <div className="flex gap-2">
                            <Pencil
                              size={14}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCategoryId(cat.id);
                                setEditCategoryName(cat.name);
                                setShowEditPopup(true);
                                setOpen(false);
                              }}
                            />
                            <Trash
                              size={14}
                              className="text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete category?")) {
                                  remove(ref(db, `categories/${cat.id}`));
                                }
                              }}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                onClick={() => setShowCatPopup(true)}
                className="h-10"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Pieces</label>
            <input
              type="number"
              min="1"
              value={piecesPerBox}
              onChange={(e) => setPiecesPerBox(e.target.value)} // keep as string
              className="w-full h-10 border rounded px-3"
              required
            />
          </div>
        </div>

        {/* DATE + NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Created On</label>
            <div className="relative">
              <DatePicker
                selected={createdAt}
                onChange={(d) => setCreatedAt(d)}
                dateFormat="dd/MM/yyyy"
                className="w-full border rounded px-3 py-2 h-10"
                wrapperClassName="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 border rounded px-3 resize-none"
            />
          </div>
        </div>

        {/* SAVE */}
        <div className="flex justify-end">
          <Button type="submit" className="px-6">
            Save Product
          </Button>
        </div>
      </form>

      {/* Add Category Popup */}
      {showCatPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Add New Category</h2>

            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCatPopup(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  if (!newCategoryName.trim()) {
                    alert("Enter category name");
                    return;
                  }

                  const catRef = ref(db, "categories");
                  await push(catRef, { name: newCategoryName.trim() });

                  setShowCatPopup(false);
                  setNewCategoryName("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Popup */}
      {showEditPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Edit Category</h2>

            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditPopup(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  if (!editCategoryName.trim()) {
                    alert("Enter category name");
                    return;
                  }

                  await update(ref(db, `categories/${editCategoryId}`), {
                    name: editCategoryName.trim(),
                  });

                  setShowEditPopup(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEntry;
