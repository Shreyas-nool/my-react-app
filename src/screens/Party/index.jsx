import { ArrowLeft, Plus, ArrowUpDown, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";
import { useEffect, useState } from "react";

// 🔹 Firebase
import { db } from "../../firebase";
import { ref, set, onValue } from "firebase/database";

const Party = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [editMobile, setEditMobile] = useState("");
  const [editCity, setEditCity] = useState("");

  // 🔹 Load parties
  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setParties([]);
        return;
      }

      // parties -> uuid -> partyObject
      const partyList = Object.entries(data).map(([id, party]) => ({
        id,
        ...party,
      }));

      setParties(partyList);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Search filter
  const filteredParties = parties.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.mobile?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  // 🔹 Sort by Party Name
  const sortedParties = [...filteredParties].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";
    return sortOrder === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  const startEdit = (party) => {
    setEditingPartyId(party.id);
    setEditMobile(party.mobile || "");
    setEditCity(party.city || "");
  };

  const cancelEdit = () => {
    setEditingPartyId(null);
    setEditMobile("");
    setEditCity("");
  };

  const saveEdit = async (id) => {
    try {
      await set(ref(db, `parties/${id}/mobile`), editMobile);
      await set(ref(db, `parties/${id}/city`), editCity);
      setEditingPartyId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update party.");
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen p-4 space-y-4 overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-lg font-semibold">Parties</h1>

        <Button onClick={() => navigate("/party/add-party")}>
          <Plus className="h-4 w-4 mr-1" /> Add Party
        </Button>
      </header>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by name, mobile or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/3"
        />

        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === "asc" ? "A → Z" : "Z → A"}
        </Button>
      </div>

      {/* Table */}
      <main className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center">
              All Parties
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table className="border text-center">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="font-semibold text-center">Party Name</TableHead>
                    <TableHead className="font-semibold text-center">Mobile</TableHead>
                    <TableHead className="font-semibold text-center">Place</TableHead>
                    <TableHead className="font-semibold text-center">Balance</TableHead>
                    <TableHead className="font-semibold text-center">Party Type</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedParties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No parties found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedParties.map((party) => (
                      <TableRow key={party.id} className="hover:bg-gray-50">
                        <TableCell>{party.name}</TableCell>

                        {/* Editable Mobile */}
                        <TableCell>
                          {editingPartyId === party.id ? (
                            <input
                              type="text"
                              value={editMobile}
                              onChange={(e) => setEditMobile(e.target.value)}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            party.mobile || "-"
                          )}
                        </TableCell>

                        {/* Editable City */}
                        <TableCell>
                          {editingPartyId === party.id ? (
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            party.city || "-"
                          )}
                        </TableCell>

                        <TableCell>{Number(party.balance || 0).toFixed(2)}</TableCell>
                        <TableCell>{party.partyType}</TableCell>

                        {/* Actions */}
                        <TableCell className="flex justify-center gap-2">
                          {editingPartyId === party.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => saveEdit(party.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEdit(party)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Party;
