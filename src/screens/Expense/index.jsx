import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Diff } from "lucide-react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ExpenseScreen = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/")} // Or back to dashboard/home
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
                <Button
                    onClick={() => navigate("/expense/create-expense")}
                    className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                >
                    <Diff className="h-4 w-4 mr-2" />
                    Add/Reduce Money
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
                                            Expense Done for
                                        </TableHead>
                                        <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Expense Done In
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ExpenseScreen;
