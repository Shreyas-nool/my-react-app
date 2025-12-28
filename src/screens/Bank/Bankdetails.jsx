import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const formatNumber = (num) => {
  const n = Number(num);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BankDetails = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const [bank, setBank] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // Fetch bank info
    const bankRef = ref(db, `banks/${bankId}`);
    onValue(bankRef, (snapshot) => {
      if (snapshot.exists()) setBank(snapshot.val());
    });

    // Fetch transactions under this bank
    const entriesRef = ref(db, `banks/${bankId}/entries`);
    onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setEntries([]);
        return;
      }

      // Flatten entries by date
      const allEntries = [];
      Object.keys(data).forEach((dateKey) => {
        Object.entries(data[dateKey]).forEach(([entryId, entry]) => {
          allEntries.push({ id: entryId, dateKey, ...entry });
        });
      });

      // Sort by createdAt descending (newest first)
      allEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEntries(allEntries);
    });
  }, [bankId]);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
      <header className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/banks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground/90">{bank?.bankName || "Bank Details"}</h1>
        <div />
      </header>

      {bank && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">From</TableHead>
                    <TableHead className="text-center">To</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e, i) => {
                      // Determine if transaction is outgoing or incoming for this bank
                      const isOutgoing = e.fromName === bankId || e.fromName === bank?.bankName;
                      return (
                        <TableRow key={e.id} className="text-center">
                          <TableCell>{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{isOutgoing ? "Outgoing" : "Incoming"}</TableCell>
                          <TableCell>{e.fromName}</TableCell>
                          <TableCell>{e.toName}</TableCell>
                          <TableCell className={isOutgoing ? "text-red-600" : "text-green-600"}>
                            {formatNumber(e.amount)}
                          </TableCell>
                          <TableCell>{e.note || "-"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {/* Bank balance row at the end */}
                  <TableRow className="font-semibold bg-gray-100 text-center">
                    <TableCell colSpan={4} className="text-end">Balance</TableCell>
                    <TableCell>{formatNumber(bank.balance)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankDetails;
