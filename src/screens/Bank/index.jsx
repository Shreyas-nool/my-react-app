import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

// No commas, 2 decimals
const formatNumber = (num) => {
    const n = Number(num);
    if (isNaN(n)) return "0.00";
    return n.toFixed(2);
};

const BanksList = () => {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);

    useEffect(() => {
        const bankRef = ref(db, "banks");
        onValue(bankRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setBanks([]);
                return;
            }
            const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
            setBanks(list);
        });
    }, []);

    return (
        <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">
            <header className="flex items-center justify-between border-b pb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold text-foreground/90">Banks</h1>

                <Button
                    onClick={() => navigate("/banks/add-bank")}
                    className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New Bank
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>All Banks</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Bank Name</TableHead>
                                <TableHead className="text-center">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                        No banks added yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banks.map((bank) => (
                                    <TableRow
                                        key={bank.id}
                                        className="cursor-pointer hover:bg-gray-100"
                                        onClick={() => navigate(`/banks/${bank.id}`)}
                                    >
                                        <TableCell className="text-center">{bank.bankName}</TableCell>
                                        <TableCell className="text-center">{formatNumber(bank.balance)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default BanksList;
