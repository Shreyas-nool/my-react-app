import { useState } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { ref, get, set } from "firebase/database";
import { Button } from "../../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_ACCOUNTS = [
  "JR",
  "Talha",
  "SR",
  "Mumbai Payment",
  "Malad Payment",
];

const AdminDefaultAccounts = () => {
  const navigate = useNavigate();
  const [openingBalances, setOpeningBalances] = useState({});

  const createAccount = async (accountName, openingBalance = 0) => {
    try {
      if (openingBalance < 0) {
        toast.error("Opening balance cannot be negative");
        return;
      }

      const accountRef = ref(db, `accounts/${accountName}`);
      const snapshot = await get(accountRef);

      if (snapshot.exists()) {
        toast.info(`${accountName} already exists`);
        return;
      }

      await set(accountRef, {
        name: accountName,
        type: "account",
        balance: openingBalance,
        openingBalance: openingBalance,
        createdAt: new Date().toISOString(),
        entries: { expenses: {} },
      });

      toast.success(`${accountName} account created with balance ${openingBalance}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create account");
    }
  };

  return (
    <div className="bg-white min-h-screen p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Create Default Accounts</h1>
      </div>

      <p className="text-sm text-slate-600 mb-8">
        Enter opening balance for each account and click "Create".
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_ACCOUNTS.map((account) => (
          <div
            key={account}
            className="p-4 border rounded-lg shadow-sm bg-slate-50 flex flex-col gap-3"
          >
            <label className="text-sm font-medium text-slate-700">{account}</label>
            <input
              type="number"
              placeholder="Opening Balance"
              min="0"
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              value={openingBalances[account] || ""}
              onChange={(e) =>
                setOpeningBalances((prev) => ({
                  ...prev,
                  [account]: e.target.value,
                }))
              }
            />
            <Button
              type="button"
              variant="outline"
              className="mt-auto"
              onClick={() =>
                createAccount(account, Number(openingBalances[account] || 0))
              }
            >
              Create {account}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDefaultAccounts;
