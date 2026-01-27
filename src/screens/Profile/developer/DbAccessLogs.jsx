import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DbAccessLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const logsRef = ref(db, "admin/dbAccessLogs");

    onValue(logsRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setLogs(arr);
    });
  }, []);

  const filteredLogs = useMemo(() => {
    if (!filter) return logs;
    return logs.filter((l) =>
      l.path?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [logs, filter]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity /> DB Access Logs
          </h1>
        </div>

        {/* Filter */}
        <input
          type="text"
          placeholder="Filter by node (e.g. sales, parties, banks)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border rounded p-2 text-sm"
        />

        {/* Logs */}
        <div className="space-y-3">
          {filteredLogs.length === 0 && (
            <div className="text-slate-500 text-sm">
              No logs found.
            </div>
          )}

          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border rounded p-4 text-sm"
            >
              <div className="font-semibold text-indigo-700">
                {log.path}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                {new Date(log.timestamp).toLocaleString()}
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-600">
                  Stack trace
                </summary>
                <pre className="text-xs bg-slate-100 p-2 rounded mt-1 overflow-x-auto">
                  {log.stack}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DbAccessLogs;