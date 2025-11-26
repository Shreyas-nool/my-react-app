import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const Banks = () => {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);

    // 🔥 Fetch banks from DB
    useEffect(() => {
        const bankRef = ref(db, "banks");

        onValue(bankRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setBanks([]);
                return;
            }

            const list = Object.keys(data).map((id) => ({
                id,
                ...data[id],
            }));

            setBanks(list);
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
                        Banks
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        SR Enterprise
                    </p>
                </div>

                <Button
                    onClick={() => navigate("/banks/add-bank")}
                    className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Bank
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-7xl mx-auto">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            All Banks
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Bank Name
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Account Details
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {banks.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                className="text-center text-muted-foreground py-6"
                                            >
                                                No banks added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        banks.map((bank) => (
                                            <TableRow key={bank.id}>
                                                <TableCell>{bank.bankName}</TableCell>
                                                <TableCell>{bank.accountDetails}</TableCell>
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

export default Banks;
