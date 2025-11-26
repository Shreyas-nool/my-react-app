import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
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

const warehouse = [
    {
        _id: 1,
        name: "Bhiwandi 1",
        location: "Bhiwandi",
    },
    {
        _id: 2,
        name: "Bhiwandi 2",
        location: "Govandi",
    },
];

const WareHouse = () => {
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
                        Warehouse
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        SR Enterprise
                    </p>
                </div>
                <div className="space-x-4">
                    <Button
                        onClick={() => navigate("/warehouse/add-warehouse")}
                        className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Warehouse
                    </Button>
                    <Button
                        onClick={() => navigate("/warehouse/transfer-stock")}
                        className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Transfer Stock
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-7xl mx-auto">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            All Warehouses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Warehouse Name
                                        </TableHead>
                                        {/* <TableHead className="w-[150px] text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                            Warehouse Location
                                        </TableHead> */}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {warehouse.length > 0 ? (
                                        warehouse.map((ware) => (
                                            <TableRow
                                                key={ware._id}
                                                className="hover:bg-muted/30 transition-colors border-b border-border/20"
                                            >
                                                <TableCell className="font-medium text-sm">
                                                    {ware.name || "N/A"}
                                                </TableCell>
                                                {/* <TableCell className="text-sm">
                                                    {ware.location || "N/A"}
                                                </TableCell> */}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No products found.
                                            </TableCell>
                                        </TableRow>
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

export default WareHouse;
