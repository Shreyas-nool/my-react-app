import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Users, Landmark, Database } from "lucide-react"; // Added Database icon

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        </div>

        {/* Admin Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Party Management */}
          <button
            onClick={() => navigate("/admin/party-management")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-indigo-600 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Party Management</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              View, audit and delete parties. Admin-only actions.
            </p>
          </button>

          {/* Bank Management */}
          <button
            onClick={() => navigate("/admin/bank-management")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-emerald-600 hover:bg-emerald-50 transition"
          >
            <div className="flex items-center gap-3">
              <Landmark className="h-6 w-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Bank Management</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              View balances, audit banks and delete bank accounts.
            </p>
          </button>

          {/* Create Default Accounts */}
          <button
            onClick={() => navigate("/admin/default-accounts")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-purple-600 hover:bg-purple-50 transition"
          >
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Create Default Accounts</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Create predefined system accounts with opening balances.
            </p>
          </button>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
