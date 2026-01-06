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

  // 🔹 Filtered parties based on search
  const filteredParties = parties.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.mobile?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const indexOfLast = currentPage * partiesPerPage;
  const indexOfFirst = indexOfLast - partiesPerPage;
  const currentParties = filteredParties.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredParties.length / partiesPerPage);

  // 🔹 Inline update handler
  const handleInlineUpdate = async (id, field, value) => {
    if (value === "" || value === "-" || value === undefined) return;

    const partyRef = ref(db, `parties/${id}`);
    await update(partyRef, {
      [field]: value,
    });
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

        <h1 className="text-2xl sm:text-2xl font-semibold text-foreground/90">
          Party List
        </h1>

        <Button
          onClick={() => navigate("/party/add-party")}
          className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Party
        </Button>
      </header>

      {/* Search */}
      <div className="flex justify-center my-2">
        <input
          type="text"
          placeholder="Search by name, mobile, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/3"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100 text-sm sm:text-base">
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
                <td colSpan={5} className="text-center p-4">
                  No parties found.
                </td>
              </tr>
            ) : (
              currentParties.map((party) => (
                <tr key={party.id} className="hover:bg-gray-50 text-sm sm:text-base">

                  {/* Party Name */}
                  <td className="border p-2">{party.name}</td>

                  {/* Editable Mobile */}
                  <td
                    className="border p-2 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(party.id, "mobile", e.target.innerText.trim())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {party.mobile ?? "-"}
                  </td>

                  {/* Editable Place/City */}
                  <td
                    className="border p-2 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleInlineUpdate(party.id, "city", e.target.innerText.trim())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {party.city ?? "-"}
                  </td>

                  {/* Balance */}
                  <td className="border p-2">{Number(party.balance || 0).toFixed(2)}</td>

                  {/* Party Type */}
                  <td className="border p-2">{party.partyType ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
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
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

    </div>
  );
};

export default Party;
