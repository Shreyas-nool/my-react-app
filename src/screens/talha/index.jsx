import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";

const TalhaBankPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const paymentsRef = ref(db, "payments");

    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPayments([]);
        return;
      }

      // Filter payments for Talha bank
      const talhaPayments = Object.values(data).filter(
        (p) => p.bank === "Talha - Online"
      );

      setPayments(talhaPayments);
    });
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-4 overflow-hidden">
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
            Talha Bank Payments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">SR Enterprise</p>
        </div>

        <div className="w-8" /> {/* Placeholder to center title */}
      </header>

      {/* Payments Table */}
      <main className="flex-1 overflow-y-auto">
        {payments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No payments found for Talha bank.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{p.party}</TableCell>
                    <TableCell>{p.date}</TableCell>
                    <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell>{p.bank}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default TalhaBankPayments;
