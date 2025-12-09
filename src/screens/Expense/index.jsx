import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Diff } from "lucide-react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const ExpenseScreen = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);

    // -----------------------------
    // FETCH ALL EXPENSES
    // -----------------------------
    useEffect(() => {
        const expRef = ref(db, "expenses/");
        onValue(expRef, (snapshot) => {
            const data = snapshot.val() || {};

            // Flatten: expenses > bank > entries
            let allExpenses = [];

            Object.keys(data).forEach((bankName) => {
                const bankExpenses = data[bankName] || {};
                Object.values(bankExpenses).forEach((exp) => {
                    allExpenses.push(exp);
                });
            });

            // Sort by newest first
            allExpenses.sort((a, b) => Number(b.id) - Number(a.id));

            setExpenses(allExpenses);
        });
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
                        Expense
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        SR Enterprise
                    </p>
                </div>

                {/* BUTTON NAME CHANGED */}
                <Button
                    onClick={() => navigate("/expense/create-expense")}
                    className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                >
                    <Diff className="h-4 w-4 mr-2" />
                    Add Expense
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-7xl mx-auto">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            All Expenses
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Amount
                                        </TableHead>
                                        <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Expense Done For
                                        </TableHead>

                                        {/* NAME CHANGED HERE */}
                                        <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Expense Done From
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                {/* BODY SHOWING ALL EXPENSES */}
                                <TableBody>
                                    {expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-center text-sm text-muted-foreground py-4"
                                            >
                                                No expenses found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((exp) => (
                                            <TableRow key={exp.id}>
                                                <TableCell className="text-sm">
                                                    ₹{exp.amount}
                                                </TableCell>

                                                <TableCell className="text-sm">
                                                    {exp.expenseFor}
                                                </TableCell>

                                                <TableCell className="text-sm">
                                                    {exp.bank}
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

export default ExpenseScreen;
