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

  // FETCH PURCHASES FROM FIREBASE
  useEffect(() => {
    const purchasesRef = ref(db, "purchases");
    const unsub = onValue(purchasesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const arr = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          amount: data[key].total || 0, // amount = total
          paid: 0, // no paid system yet
        }));

        // sort newest first
        arr.sort((a, b) => (a.date < b.date ? 1 : -1));
        setPurchases(arr);
      } else {
        setPurchases([]);
      }
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

  // Total footer amounts
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
    if (!confirm("Delete this purchase? This action cannot be undone.")) return;
    try {
      await remove(ref(db, `purchases/${id}`));
    } catch (err) {
      console.error("Failed to delete purchase:", err);
      alert("Failed to delete. See console.");
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-8 w-8 p-0 sm:p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">Purchases</h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-semibold">₹{totals.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Paid: ₹{totals.paid.toLocaleString()}</div>
            <div className="text-xs text-red-600">Pending: ₹{totalPending.toLocaleString()}</div>
          </div>

          <Button onClick={() => navigate("/purchase/add")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:block">Add Purchase</span>
          </Button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">Purchase Records</CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : purchases.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No purchases found.</div>
            ) : (
              <div className="space-y-6">
                
                {Object.entries(grouped).map(([supplier, items]) => {
                  const supplierAmount = items.reduce((a, b) => a + Number(b.amount || 0), 0);
                  const supplierPaid = items.reduce((a, b) => a + Number(b.paid || 0), 0);
                  const supplierPending = supplierAmount - supplierPaid;

                  return (
                    <div key={supplier} className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 bg-muted/40">
                        <div>
                          <div className="font-semibold">{supplier}</div>
                          <div className="text-xs text-muted-foreground">Entries: {items.length}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">₹{supplierAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Paid: ₹{supplierPaid.toLocaleString()}</div>
                          <div className="text-xs text-red-600">Pending: ₹{supplierPending.toLocaleString()}</div>
                        </div>
                      </div>

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
                            const pending = Number(it.amount || 0) - Number(it.paid || 0);

                            return (
                              <tr key={it.id} className="border-t hover:bg-gray-50">
                                <td className="p-2">{it.date || it.createdAt || "—"}</td>
                                <td className="p-2">₹{Number(it.amount).toLocaleString()}</td>
                                <td className="p-2">₹{Number(it.paid).toLocaleString()}</td>
                                <td className="p-2">₹{pending.toLocaleString()}</td>
                                <td className="p-2">{it.notes || "-"}</td>
                                <td className="p-2 text-right">
                                  <button onClick={() => navigate(`/purchase/edit/${it.id}`)} className="mr-3 text-blue-600 hover:underline inline-flex items-center">
                                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                                  </button>
                                  <button onClick={() => handleDelete(it.id)} className="text-red-600 inline-flex items-center">
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
