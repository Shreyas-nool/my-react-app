import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { useState } from "react";

// 🔹 Firebase
import { db } from "../../firebase";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const AddBank = () => {
  const navigate = useNavigate();

  const [bankName, setBankName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankName.trim()) {
      return alert("Bank name is required");
    }

    const bankId = uuidv4();
    const opening = Number(openingBalance) || 0;

    const newBank = {
      id: bankId,
      bankName: bankName.trim(),
      openingBalance: opening, // shown as entered
      balance: opening,        // running balance starts here
      createdAt: new Date().toISOString(),
      entries: {},
    };

    try {
      const bankRef = ref(db, `banks/${bankId}`);
      await set(bankRef, newBank);

      alert("✅ Bank added successfully!");
      navigate("/banks");
    } catch (error) {
      console.error("Error saving bank:", error);
      alert("❌ Failed to save bank");
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-6 h-screen bg-background p-2 sm:p-4 space-y-3 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/banks")}
          className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            Add Bank
          </h1>
        </div>

        <div className="w-8 sm:w-9" />
      </header>

      {/* Form */}
      <main className="flex-1 overflow-y-auto pb-6">
        <Card className="max-w-md mx-auto shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              New Bank
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Add bank details for financial records.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="Enter opening balance"
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 gap-2 text-sm font-semibold bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4" /> Add Bank
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddBank;
