import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";

const Party = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const partiesPerPage = 20;

  // 🔹 Load parties
  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const partyList = Object.entries(data).map(([id, party]) => ({
        id,
        ...party,
      }));
      setParties(partyList);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 🔹 Filtered parties
  const filteredParties = parties.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.mobile?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredParties.length / partiesPerPage);
  const indexOfLast = currentPage * partiesPerPage;
  const indexOfFirst = indexOfLast - partiesPerPage;
  const currentParties = filteredParties.slice(
    indexOfFirst,
    indexOfLast
  );

  // 🔹 Inline update handler
  const handleInlineUpdate = async (id, field, value) => {
    if (!value || value === "-") return;
    await update(ref(db, `parties/${id}`), { [field]: value });
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-semibold">Party List</h1>

        <Button onClick={() => navigate("/party/add-party")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Party
        </Button>
      </header>

      {/* SEARCH */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search by name, mobile, or place..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/3"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Party Name</th>
              <th className="border p-2">Mobile</th>
              <th className="border p-2">Place</th>
              <th className="border p-2">Balance</th>
              <th className="border p-2">Party Type</th>
            </tr>
          </thead>

          <tbody>
            {currentParties.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  No parties found
                </td>
              </tr>
            ) : (
              currentParties.map((party) => (
                <tr key={party.id} className="hover:bg-gray-50">
                  <td className="border p-2">{party.name}</td>

                  <td
                    className="border p-2 cursor-text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(
                        party.id,
                        "mobile",
                        e.target.innerText.trim()
                      )
                    }
                  >
                    {party.mobile ?? "-"}
                  </td>

                  <td
                    className="border p-2 cursor-text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(
                        party.id,
                        "city",
                        e.target.innerText.trim()
                      )
                    }
                  >
                    {party.city ?? "-"}
                  </td>

                  <td className="border p-2">
                    {Number(party.balance || 0).toFixed(2)}
                  </td>

                  <td className="border p-2">
                    {party.partyType ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>

          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={currentPage === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Party;
