import { ArrowLeft, Plus, RefreshCcw, Save } from "lucide-react";
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

const TransferStock = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-1 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/warehouse")} // Or back to dashboard/home
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground/90">
                        Transfer
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        SR Enterprise
                    </p>
                </div>
                {/* <Button
                    onClick={() => navigate("/party/add-party")}
                    className="h-8 sm:h-9 text-sm font-medium bg-primary hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Party
                </Button> */}
            </header>

            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-md mx-auto">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            Transfer Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="">Date</Label>
                                <Input type="date"></Input>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="">Transfer from</Label>
                                <Input type="text"></Input>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="">Set Quantity</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g 10"
                                ></Input>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="">Product Category</Label>
                                <Input
                                    type="number"
                                    placeholder="enter party category"
                                ></Input>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="">Product Name</Label>
                                <Input
                                    type="number"
                                    placeholder="enter party name"
                                ></Input>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="">Transfer To</Label>
                                <Input type="text"></Input>
                            </div>

                            <Button className="w-full h-10 sm:h-11 text-sm font-medium bg-primary hover:bg-primary/90">
                                <RefreshCcw /> Transfer
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default TransferStock;
