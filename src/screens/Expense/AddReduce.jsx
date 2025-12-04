import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, push, set } from "firebase/database";

const AddReduce = () => {
    const navigate = useNavigate();

    const [amount, setAmount] = useState("");
    const [expenseFor, setExpenseFor] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    const [banks, setBanks] = useState([]);

    // ---------------------------
    // FETCH BANK LIST FROM FIREBASE
    // ---------------------------
    useEffect(() => {
        const bankRef = ref(db, "banks/");
        onValue(bankRef, (snapshot) => {
            const data = snapshot.val() || {};

            const bankArray = Object.keys(data).map((id) => ({
                id,
                bankName: data[id].bankName,
                accountDetails: data[id].accountDetails,
            }));

            setBanks(bankArray);
        });
    }, []);

    // ---------------------------
    // SAVE EXPENSE
    // ---------------------------
    const handleSaveExpense = async () => {
        if (!amount || !expenseFor || !selectedBank) {
            return alert("Please fill all fields");
        }

        const today = new Date();
        const isoDate = today.toISOString().split("T")[0];

        const expenseEntry = {
            id: Date.now(),
            amount: Number(amount),
            expenseFor,
            bank: selectedBank,
            date: isoDate,
            createdAt: new Date().toISOString(),
        };

        try {
            const expRef = ref(db, "expenses/");
            const newExp = push(expRef);
            await set(newExp, expenseEntry);

            alert("Expense saved");
            navigate("/expense");
        } catch (error) {
            console.log(error);
            alert("Error saving expense");
        }
    };

    return (
        <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-4 space-y-4 overflow-hidden">

            {/* Header */}
            <header className="flex items-center justify-between py-3 border-b border-border/50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/expense")}
                    className="h-9 w-9 p-2 hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 text-center">
                    <h1 className="text-xl font-semibold text-foreground/90">
                        Expense
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        SR Enterprise
                    </p>
                </div>

                <div className="w-9" />
            </header>

            {/* MAIN */}
            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                            Add Expense
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 p-6">
                        <form className="space-y-4">

                            {/* AMOUNT */}
                            <div className="space-y-2">
                                <Label>Enter Amount</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </div>

                            {/* EXPENSE FOR */}
                            <div className="space-y-2">
                                <Label>Expense Done For</Label>
                                <Input
                                    type="text"
                                    value={expenseFor}
                                    onChange={(e) => setExpenseFor(e.target.value)}
                                    placeholder="Purpose of expense"
                                />
                            </div>

                            {/* BANK SELECT (FROM FIREBASE) */}
                            <div className="space-y-2">
                                <Label>Expense Done From</Label>
                                <Select onValueChange={setSelectedBank}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select bank" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectGroup>

                                            {banks.map((bank) => (
                                                <SelectItem
                                                    key={bank.id}
                                                    value={`${bank.bankName} - ${bank.accountDetails}`}
                                                >
                                                    {bank.bankName} — {bank.accountDetails}
                                                </SelectItem>
                                            ))}

                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* SAVE BUTTON */}
                            <Button
                                type="button"
                                onClick={handleSaveExpense}
                                className="w-full h-11 bg-primary hover:bg-primary/90"
                            >
                                <Save className="mr-2 h-4 w-4" /> Save Expense
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AddReduce;
