import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../firebase";
import { ref, get, set } from "firebase/database";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "../../components/ui/command";
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
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");

  /* ---------------- LOAD ENTITIES ---------------- */
  useEffect(() => {
    get(ref(db, "parties")).then(
      (s) => s.exists() && setParties(Object.values(s.val()))
    );
    get(ref(db, "banks")).then(
      (s) => s.exists() && setBanks(Object.values(s.val()))
    );
    get(ref(db, "accounts")).then(
      (s) => s.exists() && setAccounts(Object.values(s.val()))
    );
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

  const renderDropdown = (
    type,
    value,
    setValue,
    open,
    setOpen,
    search,
    setSearch
  ) => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || "Select"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[240px]">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No result</CommandEmpty>
            {getEntitiesByType(type)
              .filter((e) =>
                getEntityName(type, e)
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((e) => {
                const name = getEntityName(type, e);
                return (
                  <CommandItem
                    key={name}
                    onSelect={() => {
                      setValue(name);
                      setOpen(false);
                      setSearch("");
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

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromType || !fromName || !toType || !toName || !amount) {
      alert("Fill all fields");
      return;
    }

    const amt = Number(amount);
    const dateKey = date.toISOString().split("T")[0];
    const txnId = Date.now().toString();

    const payload = {
      txnId,
      fromType,
      fromName,
      toType,
      toName,
      amount: amt,
      date: dateKey,
      note: note || "-",
      createdAt: Date.now(),
    };

    const nodeMap = {
      party: "parties",
      bank: "banks",
      account: "accounts",
    };

    const updateBalance = async (type, name, delta) => {
      const balRef = ref(db, `${nodeMap[type]}/${name}/balance`);
      const snap = await get(balRef);
      const current = snap.exists() ? Number(snap.val()) : 0;
      await set(balRef, current + delta);
    };

    const saveEntry = async (type, name) => {
      await set(
        ref(db, `${nodeMap[type]}/${name}/entries/${dateKey}/${txnId}`),
        payload
      );
    };

    const savePaymentLedger = async (type, name) => {
      await set(
        ref(db, `payments/${type}/${name}/${dateKey}/${txnId}`),
        payload
      );
    };

    try {
      /* 1️⃣ BALANCES */
      await updateBalance(fromType, fromName, -amt);
      await updateBalance(toType, toName, amt);

      /* 2️⃣ ENTITY ENTRIES */
      await saveEntry(fromType, fromName);
      await saveEntry(toType, toName);

      /* 3️⃣ PAYMENTS (GLOBAL LEDGER) */
      await savePaymentLedger(fromType, fromName);
      await savePaymentLedger(toType, toName);

      alert("Transaction Added Successfully");
      navigate("/payment");
    } catch (err) {
      console.error(err);
      alert("Error saving transaction");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex justify-center px-4 pt-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate("/payment")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-semibold">Add Transaction</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Date</label>
                  <DatePicker
                    selected={date}
                    onChange={setDate}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label>Amount</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>From Type</label>
                  <select
                    className="w-full border rounded p-2"
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

                <div>
                  <label>From</label>
                  {fromType &&
                    renderDropdown(
                      fromType,
                      fromName,
                      setFromName,
                      fromOpen,
                      setFromOpen,
                      fromSearch,
                      setFromSearch
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>To Type</label>
                  <select
                    className="w-full border rounded p-2"
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

                <div>
                  <label>To</label>
                  {toType &&
                    renderDropdown(
                      toType,
                      toName,
                      setToName,
                      toOpen,
                      setToOpen,
                      toSearch,
                      setToSearch
                    )}
                </div>
              </div>

              <div>
                <label>Notes</label>
                <textarea
                  className="w-full border rounded p-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button className="w-full mt-4">Save Transaction</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
