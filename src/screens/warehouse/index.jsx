// src/screens/Warehouse/index.jsx
import React, { useEffect, useState } from "react";
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

import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const WareHouse = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const warehouseRef = ref(db, "warehouse");
    onValue(warehouseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const array = Object.keys(data).map((id) => ({
          id,
          ...data[id],
        }));
        setWarehouses(array);
      } else {
        setWarehouses([]);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-6 sm:mt-10 h-screen bg-background p-2 sm:p-4 space-y-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Warehouse</h1>
          <p className="text-xs text-muted-foreground">SR Enterprise</p>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex space-x-3">
          <Button
            onClick={() => navigate("/warehouse/add-warehouse")}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Warehouse
          </Button>

          <Button
            onClick={() => navigate("/warehouse/transfer-stock")}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Transfer Stock
          </Button>
        </div>
      </header>

      {/* MOBILE BUTTONS */}
      <div className="flex flex-col sm:hidden gap-3">
        <Button
          onClick={() => navigate("/warehouse/add-warehouse")}
          className="w-full text-sm py-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Warehouse
        </Button>

        <Button
          onClick={() => navigate("/warehouse/transfer-stock")}
          className="w-full text-sm py-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Transfer Stock
        </Button>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">All Warehouses</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Warehouse Name</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell className="text-center py-6">Loading...</TableCell>
                    </TableRow>
                  ) : warehouses.length > 0 ? (
                    warehouses.map((w) => (
                      <TableRow
                        key={w.id}
                        className="hover:bg-muted/30 cursor-pointer transition"
                        onClick={() =>
                          navigate(`/warehouse/${encodeURIComponent(w.name)}/stocks`, {
                            state: { warehouseId: w.id }
                          })
                        }
                      >
                        <TableCell className="font-medium text-sm sm:text-base">
                          {w.name}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-center py-6 text-muted-foreground">
                        No warehouses found.
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
