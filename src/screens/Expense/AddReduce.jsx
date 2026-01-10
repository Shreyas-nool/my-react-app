import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const { state } = useLocation(); // get lock info from navigation

  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [expenseFor, setExpenseFor] = useState("");
  const [category, setCategory] = useState(""); // party / bank / account
  const [entity, setEntity] = useState(""); // selected party/bank/account

  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [entityOpen, setEntityOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Lock category/entity if coming from BankLedger
  useEffect(() => {
    if (state?.lockCategory && state?.lockEntity) {
      setCategory(state.lockCategory);
      setEntity(state.lockEntity);
    }
  }, [state]);

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
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={!!state?.lockEntity} // lock if needed
        >
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
              .map((e, idx) => {
                const name = getEntityName(e);
                return (
                  <CommandItem
                    key={name || idx}
                    onSelect={() => {
                      if (!state?.lockEntity) { // prevent selection if locked
                        setEntity(name);
                        setEntityOpen(false);
                        setSearchText("");
                      }
                    }}
                    disabled={!!state?.lockEntity} // lock selection
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
    const expenseID = Date.now(); // unique ID for expense

    const expenseEntry = {
      amount: Number(expenseAmount.toFixed(2)),
      category,
      date: date.toISOString(),
      expenseFor,
      entity,
      createdAt: new Date().toISOString(),
    };

    try {
      // Determine correct base node
      let baseNode = "";
      if (category === "party") baseNode = "parties";
      if (category === "account") baseNode = "accounts";
      if (category === "bank") baseNode = "banks";

      if (!baseNode) throw new Error("Invalid category selected");

      // Update balance
      const balanceRef = ref(db, `${baseNode}/${entity}/balance`);
      const snap = await get(balanceRef);
      const currentBalance = snap.exists() ? Number(snap.val()) : 0;
      await set(balanceRef, currentBalance - expenseAmount);

      // Save expense under entity node
      const expenseRef = ref(db, `${baseNode}/${entity}/expenses/${expenseID}`);
      await set(expenseRef, expenseEntry);

      // Save to global expenses node
      const globalExpenseRef = ref(db, `expenses/${category}/${entity}/${expenseID}`);
      await set(globalExpenseRef, expenseEntry);

      alert("✅ Expense saved successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("❌ Error saving expense");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-accent rounded-full"
        >
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
                dateFormat="dd / MM / yyyy"
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

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Expense Done From</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full border p-2 rounded"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setEntity(""); }}
                disabled={!!state?.lockCategory} // lock if needed
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
