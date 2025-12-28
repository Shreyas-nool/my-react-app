import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../firebase";
import { ref, get, set } from "firebase/database";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "../../components/ui/command";
import { cn } from "../../lib/utils";

export default function AddPayment() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [fromType, setFromType] = useState("");
  const [fromName, setFromName] = useState("");
  const [toType, setToType] = useState("");
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Load data
  useEffect(() => {
    get(ref(db, "parties")).then(s => s.exists() && setParties(Object.values(s.val())));
    get(ref(db, "banks")).then(s => s.exists() && setBanks(Object.values(s.val())));
    get(ref(db, "accounts")).then(s => s.exists() && setAccounts(Object.values(s.val())));
  }, []);

  const getEntitiesByType = (type) => {
    if (type === "party") return parties;
    if (type === "bank") return banks;
    if (type === "account") return accounts;
    return [];
  };

  const getEntityName = (type, entity) => {
    if (!entity) return "";
    if (type === "party") return entity.name || "";
    if (type === "bank") return entity.bankName || "";
    if (type === "account") return entity.name || entity.accountName || "";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromType || !fromName || !toType || !toName || !amount) {
      return alert("Fill all required fields");
    }

    const transactionAmount = Number(amount);
    const dateKey = date.toISOString().split("T")[0];
    const entryId = `payment_${Date.now()}`;

    const payload = {
      fromType,
      fromName,
      toType,
      toName,
      amount: transactionAmount,
      date: dateKey,
      note,
      createdAt: new Date().toISOString(),
    };

    try {
      const updateBalance = async (type, name, delta) => {
        const map = {
          party: "parties",
          bank: "banks",
          account: "accounts",
        };

        const balanceRef = ref(db, `${map[type]}/${name}/balance`);
        const snap = await get(balanceRef);
        const current = snap.exists() ? snap.val() : 0;

        await set(balanceRef, current + delta);
      };

      // Update balances
      await updateBalance(fromType, fromName, -transactionAmount);
      await updateBalance(toType, toName, transactionAmount);

      // ✅ Save payment under the PARTY involved
      let partyName = null;

      if (fromType === "party") {
        partyName = fromName;
      } else if (toType === "party") {
        partyName = toName;
      }

      if (partyName) {
        await set(
          ref(db, `payments/${partyName}/${dateKey}/${entryId}`),
          payload
        );
      }

      alert("Transaction saved successfully!");
      navigate("/payment");
    } catch (err) {
      console.error(err);
      alert("Error saving transaction");
    }
  };

  const renderSearchableDropdown = (type, value, setValue, open, setOpen) => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || "-- Select --"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[260px]">
        <Command>
          <CommandInput placeholder="Search..." onValueChange={setSearchText} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {getEntitiesByType(type)
              .filter(e =>
                getEntityName(type, e)
                  .toLowerCase()
                  .includes(searchText.toLowerCase())
              )
              .map(e => {
                const name = getEntityName(type, e);
                return (
                  <CommandItem
                    key={name}
                    onSelect={() => {
                      setValue(name);
                      setOpen(false);
                      setSearchText("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === name ? "opacity-100" : "opacity-0"
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

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <header className="flex items-center justify-between border-b pb-3 mb-6">
        <Button variant="ghost" onClick={() => navigate("/payment")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Add Transaction</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>Date</label>
                <DatePicker
                  selected={date}
                  onChange={setDate}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label>Amount</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>From Type</label>
                <select
                  className="w-full border p-2 rounded"
                  value={fromType}
                  onChange={(e) => {
                    setFromType(e.target.value);
                    setFromName("");
                  }}
                >
                  <option value="">Select</option>
                  <option value="party">Party</option>
                  <option value="bank">Bank</option>
                  <option value="account">Account</option>
                </select>
              </div>
              {fromType &&
                renderSearchableDropdown(fromType, fromName, setFromName, fromOpen, setFromOpen)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>To Type</label>
                <select
                  className="w-full border p-2 rounded"
                  value={toType}
                  onChange={(e) => {
                    setToType(e.target.value);
                    setToName("");
                  }}
                >
                  <option value="">Select</option>
                  <option value="party">Party</option>
                  <option value="bank">Bank</option>
                  <option value="account">Account</option>
                </select>
              </div>
              {toType &&
                renderSearchableDropdown(toType, toName, setToName, toOpen, setToOpen)}
            </div>

            <div>
              <label>Notes</label>
              <textarea
                className="w-full border p-2 rounded"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button className="w-full">Save Transaction</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
