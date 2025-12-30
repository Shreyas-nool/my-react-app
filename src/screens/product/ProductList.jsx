import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue, remove, update } from "firebase/database";

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // For delete confirmation
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);

  useEffect(() => {
    const productsRef = ref(db, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const prodArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(prodArray);
      } else {
        setProducts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Delete product after confirmation
  const handleDelete = async (id) => {
    const productRef = ref(db, `products/${id}`);
    await remove(productRef);
    setShowDeletePopup(false);
    setDeleteProductId(null);
  };

  // Inline update handler
  const handleInlineUpdate = async (id, field, value) => {
    if (value === "" || value === "-" || value === undefined) return;

    const productRef = ref(db, `products/${id}`);
    await update(productRef, {
      [field]: value,
    });
  };

  // Format date to DD-M-YY
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1); // no leading zero
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
          Product List
        </h1>

        <Button
          onClick={() => navigate("/product/add-product")}
          className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </header>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-sm sm:text-base">
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Pieces/Box</th>
              <th className="border p-2">Created On</th>
              <th className="border p-2">Notes</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  No products added yet.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-gray-50 text-sm sm:text-base"
                >
                  {/* Editable Name */}
                  <td
                    className="border p-2 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(
                        prod.id,
                        "productName",
                        e.target.innerText.trim()
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {prod.productName}
                  </td>

                  {/* Category */}
                  <td className="border p-2">{prod.category}</td>

                  {/* Editable Pieces */}
                  <td
                    className="border p-2 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(
                        prod.id,
                        "piecesPerBox",
                        Number(e.target.innerText.trim())
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {prod.piecesPerBox ?? "-"}
                  </td>

                  {/* Created Date */}
                  <td className="border p-2">{formatDate(prod.createdAt)}</td>

                  {/* Editable Notes */}
                  <td
                    className="border p-2 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(
                        prod.id,
                        "notes",
                        e.target.innerText.trim()
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {prod.notes ?? "-"}
                  </td>

                  {/* Delete */}
                  <td className="border p-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setDeleteProductId(prod.id);
                        setShowDeletePopup(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="font-semibold text-lg mb-2">
              Delete Product?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeletePopup(false);
                  setDeleteProductId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(deleteProductId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
