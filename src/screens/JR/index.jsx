import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Repeat } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

const JrBankPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);

  const CURRENT_BANK = "JR";

  useEffect(() => {
    const paymentsRef = ref(db, "payments");

    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPayments([]);
        setBalance(0);
        return;
      }

      // Filter payments for JR bank (using first word)
      const jrPayments = Object.values(data).filter(
        (p) => p.bank && p.bank.trim().split(" ")[0] === CURRENT_BANK
      );

      setPayments(jrPayments);

      // Calculate balance
      const total = jrPayments.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      setBalance(total);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-2 sm:p-4 space-y-4 overflow-hidden">
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
          <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">JR</h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        <div className="w-8" />
      </header>

      {/* Balance Card */}
      <div className="flex justify-between items-center bg-white shadow-md rounded-2xl p-6 border border-gray-100">
        <div className="text-2xl font-bold text-gray-800">Balance: {balance.toLocaleString()}</div>
        <div className="flex gap-3">
          <Button
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => navigate("/jr/add-reduce-money")}
          >
            <Plus className="h-4 w-4" /> Add/Reduce Money
          </Button>

          <Button
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => navigate("/jr/transfer-money")}
          >
            <Repeat className="h-4 w-4" /> Transfer Money
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <main className="flex-1 overflow-y-auto">
        {payments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No payments found for JR bank.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map((p, index) => {
                  const isNegative = p.amount.toString().startsWith("-");
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{p.party}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell className={isNegative ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{p.bank}</TableCell>
                      <TableCell>{p.notes || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default JrBankPayments;
