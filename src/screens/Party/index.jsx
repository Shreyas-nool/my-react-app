import { ArrowLeft, Plus } from "lucide-react";
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

// 🧩 Firebase imports
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const Party = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);

  // 🔹 Load parties from Firebase Realtime Database
  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsubscribe = onValue(partiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const partyList = Object.values(data);
        setParties(partyList);
      } else {
        setParties([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
            Parties
          </h1>
        </div>

        <Button
          onClick={() => navigate("/party/add-party")}
          className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Party
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold">
              All Parties
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>

                    <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Party Name
                    </TableHead>

                    <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Mobile
                    </TableHead>

                    <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      City
                    </TableHead>

                    <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Opening Balance
                    </TableHead>

                    <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Party Type
                    </TableHead>

                  </TableRow>
                </TableHeader>

                <TableBody>
                  {parties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No parties added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    parties.map((party, index) => (
                      <TableRow key={index}>
                        <TableCell>{party.name}</TableCell>

                        <TableCell>{party.mobile || "-"}</TableCell>

                        <TableCell>{party.city || "-"}</TableCell>

                        <TableCell>{party.openingBalance || 0}</TableCell>

                        <TableCell>{party.partyType}</TableCell>
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
