import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { db } from "../../firebase";
import { ref, onValue, remove } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ExpenseScreen = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [total, setTotal] = useState(0);

  /* ---------------- FETCH EXPENSES ---------------- */
  useEffect(() => {
    const expRef = ref(db, "expenses");

    onValue(expRef, (snapshot) => {
      const data = snapshot.val() || {};
      let all = [];

      Object.entries(data).forEach(([category, entities]) => {
        Object.entries(entities || {}).forEach(([entity, items]) => {
          if (entity === "Malad Payment") return;

          Object.entries(items || {}).forEach(([id, exp]) => {
            all.push({
              ...exp,
              category,
              entity,
              _path: `expenses/${category}/${entity}/${id}`,
            });
          });
        });
      });

      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(all);
      setFiltered(all);
    });
  }, []);

  /* ---------------- FILTER (DATE + SEARCH) ---------------- */
  useEffect(() => {
    let data = [...expenses];

    if (fromDate) {
      data = data.filter((e) => new Date(e.date) >= fromDate);
    }

    if (toDate) {
      data = data.filter((e) => new Date(e.date) <= toDate);
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      data = data.filter((e) =>
        (e.expenseFor || "").toLowerCase().includes(search)
      );
    }

    setFiltered(data);

    const sum = data.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    setTotal(sum);
  }, [fromDate, toDate, searchText, expenses]);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;
    await remove(ref(db, exp._path));
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto mt-10 p-4 space-y-4">

      {/* HEADER */}
      <div className="relative flex flex-wrap gap-2 items-center border-b pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <DatePicker
          selected={fromDate}
          onChange={setFromDate}
          placeholderText="From"
          className="border rounded px-2 py-1 text-sm"
          isClearable
        />

        <DatePicker
          selected={toDate}
          onChange={setToDate}
          placeholderText="To"
          className="border rounded px-2 py-1 text-sm"
          isClearable
        />

        <Button
          className="ml-auto h-9 text-sm"
          onClick={() => navigate("/expense/create-expense")}
        >
          Add Expense
        </Button>
      </div>

      {/* TITLE + TOTAL (CENTER) + SEARCH (RIGHT) */}
      <div className="grid grid-cols-3 items-center w-full">

        {/* LEFT EMPTY (BALANCE COLUMN) */}
        <div />

        {/* CENTER TITLE + TOTAL */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <p className="text-red-600 font-semibold">
            Total: {total.toFixed(2)}
          </p>
        </div>

        {/* RIGHT SEARCH */}
        <div className="flex justify-end">
          <input
            type="text"
            placeholder="Search expense for..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-64"
          />
        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded shadow bg-white">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-100 text-lg">
              <th className="border p-3">Date</th>
              <th className="border p-3">Amount</th>
              <th className="border p-3">Expense For</th>
              <th className="border p-3">Category</th>
              <th className="border p-3">Done From</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((exp, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-3">
                    {new Date(exp.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="border p-3 font-semibold text-red-600">
                    {Number(exp.amount).toFixed(2)}
                  </td>
                  <td className="border p-3">{exp.expenseFor}</td>
                  <td className="border p-3 capitalize">{exp.category}</td>
                  <td className="border p-3">{exp.entity}</td>
                  <td className="border p-3">
                    <button
                      onClick={() => handleDelete(exp)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseScreen;
