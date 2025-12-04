// src/screens/warehouse/AddWarehouse.jsx
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

import { db } from "../../firebase";
import { ref, push, set } from "firebase/database";
import { useState } from "react";

const AddWarehouse = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const saveWarehouse = async () => {
        if (!name.trim()) return alert("Enter warehouse name");

        setLoading(true);

        const warehouseRef = ref(db, "warehouse");
        const newRef = push(warehouseRef);

        await set(newRef, {
            name,
            createdAt: new Date().toISOString(),
        });

        setLoading(false);
        navigate("/warehouse");
    };

    return (
        <div className="flex flex-col max-w-7xl mx-auto mt-10 h-screen bg-background p-4">
            <header className="flex items-center justify-between py-3 border-b border-border/50">
                <Button variant="ghost" size="sm" onClick={() => navigate("/warehouse")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 text-center">
                    <h1 className="text-xl font-semibold">Warehouse</h1>
                    <p className="text-xs text-muted-foreground">SR Enterprise</p>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <Card className="max-w-md mx-auto mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Add New Warehouse</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Warehouse Name</Label>
                            <Input
                                type="text"
                                placeholder="Enter warehouse name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={saveWarehouse}
                            disabled={loading}
                            className="w-full h-11"
                        >
                            <Save className="mr-2" />
                            {loading ? "Saving..." : "Save Warehouse"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AddWarehouse;
