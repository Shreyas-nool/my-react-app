import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const PartyManagement = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val() || {};

      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      setParties(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteParty = async (party) => {
    const confirmDelete = window.confirm(
      `⚠️ Delete party "${party.name}"?\n\nThis action CANNOT be undone.`
    );

    if (!confirmDelete) return;

    try {
      await remove(ref(db, `parties/${party.id}`));
      toast.success(`Party "${party.name}" deleted`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete party");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading parties...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Panel – Party Management
          </h1>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 text-left">Party Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">City</th>
                <th className="p-3 text-right">Credit (Days)</th>
                <th className="p-3 text-right">Opening Balance</th>
                <th className="p-3 text-right">Current Balance</th>
                <th className="p-3 text-center">Created</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {parties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    No parties found
                  </td>
                </tr>
              ) : (
                parties.map((party) => (
                  <tr
                    key={party.id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="p-3 font-medium text-slate-900">
                      {party.name}
                    </td>

                    <td className="p-3">
                      {party.partyType || "-"}
                    </td>

                    <td className="p-3">
                      {party.mobile || "-"}
                    </td>

                    <td className="p-3">
                      {party.city || "-"}
                    </td>

                    <td className="p-3 text-right">
                      {party.creditPeriod ?? 0}
                    </td>

                    <td className="p-3 text-right">
                      ₹ {Number(party.openingBalance || 0).toFixed(2)}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      ₹ {Number(party.balance || 0).toFixed(2)}
                    </td>

                    <td className="p-3 text-center text-slate-600">
                      {party.createdAt
                        ? new Date(party.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-3 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteParty(party)}
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

export default PartyManagement;
