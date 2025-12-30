import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
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
  const [total, setTotal] = useState(0);

  // ----------------------------------
  // FETCH EXPENSES
  // ----------------------------------
  useEffect(() => {
    const expRef = ref(db, "expenses");

    onValue(expRef, (snapshot) => {
      const data = snapshot.val() || {};
      let all = [];

      Object.entries(data).forEach(([date, cats]) => {
        Object.entries(cats).forEach(([category, entities]) => {
          Object.entries(entities).forEach(([entity, items]) => {
            Object.entries(items).forEach(([id, exp]) => {
              all.push({
                ...exp,
                _path: `expenses/${date}/${category}/${entity}/${id}`,
              });
            });
          });
        });
      });

      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(all);
      setFiltered(all);
    });
  }, []);

  // ----------------------------------
  // DATE FILTER
  // ----------------------------------
  useEffect(() => {
    let data = [...expenses];

    if (fromDate)
      data = data.filter(
        (e) => new Date(e.date) >= new Date(fromDate)
      );

    if (toDate)
      data = data.filter(
        (e) => new Date(e.date) <= new Date(toDate)
      );

    setFiltered(data);

    const sum = data.reduce((acc, cur) => acc + Number(cur.amount), 0);
    setTotal(sum);
  }, [fromDate, toDate, expenses]);

  // ----------------------------------
  // DELETE
  // ----------------------------------
  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;

    await remove(ref(db, exp._path));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 mt-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">Expenses</h1>
        <Button onClick={() => navigate("/expense/create-expense")}>
          Add Expense
        </Button>
      </div>

      {/* SUMMARY CARD */}
      {/* SUMMARY CARD */}
<Card className="mb-3">
  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-2 px-3">

    {/* TOTAL */}
    <div>
      <p className="text-[11px] text-muted-foreground leading-none">
        Total Expense
      </p>
      <p className="text-lg font-semibold text-red-600 leading-tight">
        ₹{total.toFixed(2)}
      </p>
    </div>

    {/* DATE FILTER */}
    <div className="flex gap-2">
      <DatePicker
        selected={fromDate}
        onChange={(d) => setFromDate(d)}
        placeholderText="From"
        className="border px-2 py-1 rounded text-sm w-[110px]"
      />
      <DatePicker
        selected={toDate}
        onChange={(d) => setToDate(d)}
        placeholderText="To"
        className="border px-2 py-1 rounded text-sm w-[110px]"
      />
    </div>

  </CardContent>
</Card>


      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-center">Expense For</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Done From</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((exp, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        {new Date(exp.date).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        ₹{Number(exp.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {exp.expenseFor}
                      </TableCell>
                      <TableCell className="text-center capitalize">
                        {exp.category}
                      </TableCell>
                      <TableCell className="text-center">
                        {exp.entity}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleDelete(exp)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseScreen;
