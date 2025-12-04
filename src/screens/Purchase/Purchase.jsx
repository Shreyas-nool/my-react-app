// src/screens/purchase/Purchases.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { db } from "../../firebase";
import { ref, onValue, remove } from "firebase/database";

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH PURCHASES
  useEffect(() => {
    const purchasesRef = ref(db, "purchases");
    const unsub = onValue(purchasesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const arr = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          amount: data[key].total || 0,
          paid: 0,
        }));

        arr.sort((a, b) => (a.date < b.date ? 1 : -1));
        setPurchases(arr);
      } else setPurchases([]);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Group by supplier
  const grouped = purchases.reduce((acc, p) => {
    const supplier = p.supplier || "—";
    if (!acc[supplier]) acc[supplier] = [];
    acc[supplier].push(p);
    return acc;
  }, {});

  const totals = purchases.reduce(
    (acc, p) => {
      acc.amount += Number(p.amount || 0);
      acc.paid += Number(p.paid || 0);
      return acc;
    },
    { amount: 0, paid: 0 }
  );

  const totalPending = totals.amount - totals.paid;

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase?")) return;
    try {
      await remove(ref(db, `purchases/${id}`));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-6 sm:mt-10 h-screen bg-background p-2 sm:p-4 space-y-3 overflow-hidden">

      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 sm:h-9 sm:w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Purchases</h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        {/* Desktop totals */}
        <div className="hidden sm:block text-right mr-3">
          <div className="text-xs">Total: ₹{totals.amount.toLocaleString()}</div>
          <div className="text-xs">Paid: ₹{totals.paid.toLocaleString()}</div>
          <div className="text-xs text-red-600">Pending: ₹{totalPending.toLocaleString()}</div>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => navigate("/purchase/add")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:block">Add Purchase</span>
        </Button>
      </header>

      {/* Mobile Totals */}
      <div className="sm:hidden grid grid-cols-3 text-center text-xs bg-muted p-2 rounded-md">
        <div>Total<br /><span className="font-semibold">₹{totals.amount.toLocaleString()}</span></div>
        <div>Paid<br /><span className="font-semibold">₹{totals.paid.toLocaleString()}</span></div>
        <div className="text-red-600">Pending<br /><span className="font-semibold">₹{totalPending.toLocaleString()}</span></div>
      </div>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto pb-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">Purchase Records</CardTitle>
          </CardHeader>

          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : purchases.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No purchases found.</div>
            ) : (
              <div className="space-y-6">

                {Object.entries(grouped).map(([supplier, items]) => {
                  const supplierAmount = items.reduce((a, b) => a + Number(b.amount), 0);
                  const supplierPaid = items.reduce((a, b) => a + Number(b.paid), 0);
                  const supplierPending = supplierAmount - supplierPaid;

                  return (
                    <div key={supplier} className="border rounded-lg overflow-hidden">

                      {/* Supplier Header */}
                      <div className="flex items-center justify-between p-3 bg-muted/40">
                        <div>
                          <div className="font-semibold">{supplier}</div>
                          <div className="text-xs text-muted-foreground">Entries: {items.length}</div>
                        </div>

                        <div className="text-right text-xs sm:text-sm">
                          <div>₹{supplierAmount.toLocaleString()}</div>
                          <div className="text-muted-foreground">Paid: ₹{supplierPaid.toLocaleString()}</div>
                          <div className="text-red-600">Pending: ₹{supplierPending.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* TABLE - Desktop */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 text-xs text-muted-foreground">
                            <tr>
                              <th className="p-2 text-left">Date</th>
                              <th className="p-2 text-left">Amount (₹)</th>
                              <th className="p-2 text-left">Paid (₹)</th>
                              <th className="p-2 text-left">Pending (₹)</th>
                              <th className="p-2 text-left">Notes</th>
                              <th className="p-2 text-right">Actions</th>
                            </tr>
                          </thead>

                          <tbody>
                            {items.map((it) => {
                              const pending = Number(it.amount) - Number(it.paid);

                              return (
                                <tr key={it.id} className="border-t hover:bg-gray-50">
                                  <td className="p-2">{it.date || it.createdAt || "—"}</td>
                                  <td className="p-2">₹{Number(it.amount).toLocaleString()}</td>
                                  <td className="p-2">₹{Number(it.paid).toLocaleString()}</td>
                                  <td className="p-2">₹{pending.toLocaleString()}</td>
                                  <td className="p-2">{it.notes || "-"}</td>

                                  <td className="p-2 text-right flex gap-3 justify-end">
                                    <button onClick={() => navigate(`/purchase/edit/${it.id}`)} className="text-blue-600 flex items-center">
                                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(it.id)} className="text-red-600 flex items-center">
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE LIST VIEW */}
                      <div className="sm:hidden divide-y">
                        {items.map((it) => {
                          const pending = Number(it.amount) - Number(it.paid);

                          return (
                            <div key={it.id} className="p-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{it.date}</span>
                                <span className="text-sm font-semibold">₹{it.amount.toLocaleString()}</span>
                              </div>

                              <div className="mt-2 text-xs">
                                <div>Paid: ₹{it.paid.toLocaleString()}</div>
                                <div className="text-red-600">Pending: ₹{pending.toLocaleString()}</div>
                                <div>Notes: {it.notes || "-"}</div>
                              </div>

                              <div className="flex justify-end gap-4 mt-3">
                                <button
                                  onClick={() => navigate(`/purchase/edit/${it.id}`)}
                                  className="text-blue-600 flex items-center text-sm"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(it.id)}
                                  className="text-red-600 flex items-center text-sm"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}

              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Purchases;
