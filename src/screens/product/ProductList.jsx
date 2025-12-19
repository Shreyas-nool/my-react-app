import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { ref, onValue, remove, update } from "firebase/database";

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

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

  // Delete product
  const handleDelete = async (id) => {
    const productRef = ref(db, `products/${id}`);
    await remove(productRef);
  };

  // Inline update handler
  const handleInlineUpdate = async (id, field, value) => {
    if (value === "" || value === "-" || value === undefined) return;

    const productRef = ref(db, `products/${id}`);
    await update(productRef, {
      [field]: value,
    });
  };

  // Determine dynamic columns
  const showPieces = products.some((p) => p.piecesPerBox !== undefined);
  const showCreated = products.some((p) => p.createdAt);

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
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-sm sm:text-base">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Category</th>
              {showPieces && (
                <th className="border p-2 text-left">Pieces/Box</th>
              )}
              {showCreated && (
                <th className="border p-2 text-left">Created On</th>
              )}
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + (showPieces ? 1 : 0) + (showCreated ? 1 : 0)}
                  className="text-center p-4"
                >
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

                  {/* Read-only Category */}
                  <td className="border p-2">{prod.category}</td>

                  {/* Editable Pieces */}
                  {showPieces && (
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
                  )}

                  {/* Created Date */}
                  {showCreated && (
                    <td className="border p-2">{prod.createdAt ?? "-"}</td>
                  )}

                  {/* Delete */}
                  <td className="border p-2 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => handleDelete(prod.id)}
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
    </div>
  );
};

export default ProductList;
