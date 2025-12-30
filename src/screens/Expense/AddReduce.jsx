import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "../../components/ui/command";
import { db } from "../../firebase";
import { ref, get, set } from "firebase/database";
import { cn } from "../../lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddExpense() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [expenseFor, setExpenseFor] = useState("");
  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");

  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [entityOpen, setEntityOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Load parties, banks, accounts
  useEffect(() => {
    get(ref(db, "parties")).then(s => s.exists() && setParties(Object.values(s.val())));
    get(ref(db, "banks")).then(s => s.exists() && setBanks(Object.values(s.val())));
    get(ref(db, "accounts")).then(s => s.exists() && setAccounts(Object.values(s.val())));
  }, []);

  const getEntitiesByCategory = () => {
    if (category === "party") return parties;
    if (category === "bank") return banks;
    if (category === "account") return accounts;
    return [];
  };

  const getEntityName = (e) => e?.name || e?.bankName || e?.accountName || "";

  const renderEntityDropdown = () => (
    <Popover open={entityOpen} onOpenChange={setEntityOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {entity || "-- Select --"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[260px] shadow-lg rounded-md border border-border">
        <Command>
          <CommandInput placeholder="Search..." onValueChange={setSearchText} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {getEntitiesByCategory()
              .filter(e => getEntityName(e).toLowerCase().includes(searchText.toLowerCase()))
              .map(e => {
                const name = getEntityName(e);
                return (
                  <CommandItem
                    key={name}
                    onSelect={() => { setEntity(name); setEntityOpen(false); setSearchText(""); }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        entity === name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {name}
                  </CommandItem>
                );
              })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const handleSaveExpense = async () => {
    if (!amount || !expenseFor || !category || !entity) {
      return alert("Please fill all fields");
    }

    const expenseAmount = Number(amount);
    const dateKey = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const dateID = date.toISOString().replace(/[:.]/g, "-"); // unique ID

    const expenseEntry = {
      date: date.toISOString(),
      amount: Number(expenseAmount.toFixed(2)), // decimal-safe
      expenseFor,
      category,
      entity,
      createdAt: new Date().toISOString(),
    };

    try {
      // Update entity balance
      const balanceRef = ref(db, `${category}/${entity}/balance`);
      const snap = await get(balanceRef);
      const currentBalance = snap.exists() ? Number(snap.val()) : 0;
      const newBalance = (currentBalance - expenseAmount).toFixed(2);
      await set(balanceRef, Number(newBalance));

      // Save expense in hierarchical structure: expenses/date/category/entity/dateID
      await set(ref(db, `expenses/${dateKey}/${category}/${entity}/${dateID}`), expenseEntry);

      alert("Expense saved successfully");
      navigate("/expense");
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/expense")} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold text-foreground/90">Add Expense</h1>
        <div className="w-8" />
      </header>

      {/* Form */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Expense Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <DatePicker
                selected={date}
                onChange={setDate}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Expense Done For</Label>
            <Input
              type="text"
              value={expenseFor}
              onChange={(e) => setExpenseFor(e.target.value)}
            />
          </div>

          {/* DONE FROM TEXT */}
        <div className="sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">
            Expense Done From
            </p>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full border p-2 rounded"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setEntity(""); }}
              >
                <option value="">Select Category</option>
                <option value="party">Party</option>
                <option value="bank">Bank</option>
                <option value="account">Account</option>
              </select>
            </div>

            {category && (
              <div>
                <Label>{category.charAt(0).toUpperCase() + category.slice(1)}</Label>
                {renderEntityDropdown()}
              </div>
            )}
          </div>

          <Button
            className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
            onClick={handleSaveExpense}
          >
            <Save className="h-4 w-4" /> Save Expense
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
