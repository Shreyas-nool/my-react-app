import React, { useEffect, useState, useMemo } from "react";

// Mock data for development or fallback
const MOCK_LEDGER = {
  partyId: "123",
  partyName: "ABC Traders",
  openingBalance: 5000,
  currency: "INR",
  transactions: [
    {
      id: "t1",
      date: "2025-11-30T10:12:00.000Z",
      kind: "sale",
      invoiceNo: "INV-1001",
      products: [{ name: "T-Shirt", qty: 10, rate: 250 }],
      debit: 2500,
      credit: 0,
      notes: "Paid by bank transfer",
    },
    {
      id: "t2",
      date: "2025-12-01T15:00:00.000Z",
      kind: "purchase",
      invoiceNo: "INV-1002",
      products: [{ name: "Jeans", qty: 5, rate: 500 }],
      debit: 0,
      credit: 2500,
      notes: "",
    },
  ],
};

export default function PartyLedger({ partyId = "abc123" }) {
  const [data, setData] = useState(MOCK_LEDGER); // default to mock data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [showOnlyWithNotes, setShowOnlyWithNotes] = useState(false);

  // Fetch ledger from API (if available)
  useEffect(() => {
    if (!partyId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/parties/${partyId}/ledger`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        json.openingBalance = Number(json.openingBalance || 0);
        json.currency = json.currency || "INR";
        json.transactions = (json.transactions || []).map((t) => ({
          id: t.id || `${t.kind}-${Math.random().toString(36).slice(2, 8)}`,
          date: t.date,
          kind: t.kind || "other",
          invoiceNo: t.invoiceNo || "",
          products: t.products || [],
          debit: Number(t.debit || 0),
          credit: Number(t.credit || 0),
          notes: t.notes || "",
        }));
        json.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load ledger. Using mock data.");
        setData(MOCK_LEDGER);
      })
      .finally(() => setLoading(false));
  }, [partyId]);

  // Filtered transactions based on search and notes
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.transactions.filter((t) => {
      if (showOnlyWithNotes && !t.notes) return false;
      if (!q) return true;
      if ((t.invoiceNo || "").toLowerCase().includes(q)) return true;
      if ((t.notes || "").toLowerCase().includes(q)) return true;
      if ((t.kind || "").toLowerCase().includes(q)) return true;
      if (t.products.some((p) => (p.name || "").toLowerCase().includes(q))) return true;
      return false;
    });
  }, [data, query, showOnlyWithNotes]);

  // Calculate running balance
  const rowsWithBalance = useMemo(() => {
    if (!data) return [];
    let balance = Number(data.openingBalance || 0);
    return filtered.map((t) => {
      balance = balance + (t.debit || 0) - (t.credit || 0);
      return { ...t, runningBalance: balance };
    });
  }, [data, filtered]);

  // Export CSV
  function exportCSV() {
    if (!data) return;
    const hdr = [
      "Date",
      "Type",
      "Invoice No",
      "Products",
      "Debit",
      "Credit",
      "Notes",
      `Running Balance (${data.currency})`,
    ];
    const lines = [hdr.join(",")];
    let balance = Number(data.openingBalance || 0);
    lines.push(["(opening)", "", "", "", "", "", "", balance].join(","));
    for (const t of (data.transactions || [])) {
      balance = balance + (t.debit || 0) - (t.credit || 0);
      const products = (t.products || []).map((p) => `${p.name} x${p.qty || 1}`).join("; ");
      const row = [
        new Date(t.date).toLocaleString(),
        t.kind,
        t.invoiceNo || "",
        `"${products}"`,
        t.debit || 0,
        t.credit || 0,
        `"${(t.notes || "").replace(/\"/g, '""')}"`,
        balance,
      ];
      lines.push(row.join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.partyId || "ledger"}-ledger.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!partyId) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">No partyId supplied to PartyLedger component.</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-xl font-semibold">Ledger — {data?.partyName || partyId}</h2>
          <div className="text-sm text-slate-500">
            Opening balance: {data ? `${data.openingBalance} ${data.currency}` : "—"}
          </div>
          {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search invoice / product / notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyWithNotes}
              onChange={(e) => setShowOnlyWithNotes(e.target.checked)}
            />
            <span className="text-sm">Only with notes</span>
          </label>
          <button onClick={exportCSV} className="bg-slate-800 text-white px-3 py-1 rounded">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        {loading && <div className="p-4">Loading...</div>}
        {!loading && data && (
          <table className="min-w-full text-sm divide-y">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Invoice</th>
                <th className="p-2 text-left">Products / Details</th>
                <th className="p-2 text-right">Debit ({data.currency})</th>
                <th className="p-2 text-right">Credit ({data.currency})</th>
                <th className="p-2 text-left">Notes</th>
                <th className="p-2 text-right">Balance ({data.currency})</th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-slate-100">
                <td className="p-2">(opening)</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
                <td className="p-2 text-right">—</td>
                <td className="p-2 text-right">—</td>
                <td className="p-2">—</td>
                <td className="p-2 text-right">{data.openingBalance}</td>
              </tr>

              {rowsWithBalance.length > 0 ? (
                rowsWithBalance.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-2 align-top">{new Date(t.date).toLocaleString()}</td>
                    <td className="p-2 align-top capitalize">{t.kind}</td>
                    <td className="p-2 align-top">{t.invoiceNo || "—"}</td>
                    <td className="p-2 align-top whitespace-normal text-xs">
                      {t.products.length ? (
                        <div className="space-y-1">
                          {t.products.map((p, idx) => (
                            <div key={idx}>
                              <strong className="mr-1">{p.name}</strong>
                              <span className="text-slate-600">x{p.qty || 1}</span>
                              {p.rate ? <span className="ml-2">@ {p.rate}</span> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-600">—</div>
                      )}
                    </td>
                    <td className="p-2 text-right align-top">{t.debit || ""}</td>
                    <td className="p-2 text-right align-top">{t.credit || ""}</td>
                    <td className="p-2 align-top text-xs">{t.notes || ""}</td>
                    <td className="p-2 text-right align-top">{t.runningBalance}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Tip: the ledger shows all incoming/outgoing amounts in a single table.
      </div>
    </div>
  );
}
