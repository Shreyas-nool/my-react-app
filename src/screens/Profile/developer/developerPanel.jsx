import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import {
  ArrowLeft,
  Bug,
  Database,
  ShieldCheck,
  Activity,
} from "lucide-react";

const DeveloperPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Developer Panel
          </h1>
        </div>

        {/* Developer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Error Logs */}
          <button
            onClick={() => navigate("/developer/errors")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-red-600 hover:bg-red-50 transition"
          >
            <div className="flex items-center gap-3">
              <Bug className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold">Errors Report</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              View all runtime errors logged from your app.
            </p>
          </button>

          {/* DB Inspector */}
          <button
            onClick={() => navigate("/developer/db-inspector")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-indigo-600 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold">DB Inspector</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Validate and inspect Firebase data.
            </p>
          </button>

          {/* DB Access Logs ✅ NEW */}
          <button
            onClick={() => navigate("/developer/db-access-logs")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-violet-600 hover:bg-violet-50 transition"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-violet-600" />
              <h3 className="text-lg font-semibold">DB Access Logs</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              See which Firebase nodes are being accessed and from where.
            </p>
          </button>

          {/* Security */}
          <button
            onClick={() => navigate("/developer/security")}
            className="rounded-lg border border-slate-300 p-6 text-left hover:border-emerald-600 hover:bg-emerald-50 transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h3 className="text-lg font-semibold">Security Checks</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              DB rules, auth & access verification.
            </p>
          </button>

        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;