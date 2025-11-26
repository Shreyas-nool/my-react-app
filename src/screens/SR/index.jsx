import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
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

const SrBankPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const paymentsRef = ref(db, "payments");
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setPayments([]);

      const allPayments = Object.entries(data)
        .map(([id, payment]) => ({ id, ...payment }))
        .filter((p) => p.bank.startsWith("SR")); // Filter for SR bank

      setPayments(allPayments);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
      
      {/* HEADER */}
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
            SR Bank Payments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        <div className="w-8" />
      </header>

      {/* TABLE */}
      <main className="flex-1 overflow-y-auto">
        <Card className="max-w-7xl mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold">
              Payment Records
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            {payments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No payments found for SR bank.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sr No.</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Bank</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {payments.map((p, index) => (
                      <TableRow key={p.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{p.party}</TableCell>
                        <TableCell>₹{p.amount}</TableCell>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.bank}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SrBankPayments;
