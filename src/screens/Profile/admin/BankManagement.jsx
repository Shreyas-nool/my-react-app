import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Trash2, Landmark } from "lucide-react";
import { toast } from "react-toastify";

const BankManagement = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const banksRef = ref(db, "banks");

    const unsubscribe = onValue(banksRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      setBanks(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteBank = async (bank) => {
    const confirmDelete = window.confirm(
      `⚠️ Delete bank "${bank.bankName}"?\n\nThis action CANNOT be undone.`
    );

    if (!confirmDelete) return;

    try {
      await remove(ref(db, `banks/${bank.id}`));
      toast.success(`Bank "${bank.bankName}" deleted`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete bank");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading banks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Panel – Bank Management
          </h1>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 text-left">Bank Name</th>
                <th className="p-3 text-right">Opening Balance</th>
                <th className="p-3 text-right">Current Balance</th>
                <th className="p-3 text-center">Created At</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {banks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No banks found
                  </td>
                </tr>
              ) : (
                banks.map((bank) => (
                  <tr key={bank.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-indigo-600" />
                      {bank.bankName}
                    </td>

                    <td className="p-3 text-right">
                      {Number(bank.openingBalance || 0).toFixed(2)}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      {Number(bank.balance || 0).toFixed(2)}
                    </td>

                    <td className="p-3 text-center text-slate-600">
                      {bank.createdAt
                        ? new Date(bank.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-3 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBank(bank)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BankManagement;
