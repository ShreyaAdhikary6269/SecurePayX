import React, { useState } from 'react';
import DashboardLayout from './Dashboardlayout';

const PAYMENT_TYPES = [
  { id: 'creditcard', label: 'Credit / debit card', columns: 'Amount, Time' },
  { id: 'paysim', label: 'Mobile wallet / UPI', columns: 'type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest' },
  { id: 'banksim', label: 'Banking', columns: 'age, gender, category, amount' },
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
}

export default function UploadTransactions() {
  const [selectedType, setSelectedType] = useState(null);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setResults([]);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSV(event.target.result);
        setRows(parsed);
      } catch (err) {
        setError('Could not parse this CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRunBatch = async () => {
    if (!selectedType || rows.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setResults([]);
    setError('');

    const token = localStorage.getItem('token');
    const batchResults = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const response = await fetch(`http://localhost:5000/api/fraud/predict/${selectedType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(rows[i]),
        });

        const data = await response.json();

        if (response.ok) {
          batchResults.push({ ...rows[i], ...data });
        } else {
          batchResults.push({ ...rows[i], error: data.message || 'Failed' });
        }
      } catch (err) {
        batchResults.push({ ...rows[i], error: 'Network error' });
      }

      setProgress(i + 1);
    }

    setResults(batchResults);
    setProcessing(false);
  };

  const flaggedCount = results.filter((r) => r.is_fraud).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header with emerald theme and smooth hover effect */}
        <div className="mb-8 cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
          <h1 className="text-3xl font-normal text-emerald-800 tracking-tight mb-2">
            Batch upload
          </h1>
          <p className="text-emerald-700/80 text-base font-normal">
            Upload a CSV of transactions to check many at once.
          </p>
        </div>

        {/* Payment Type Selector Cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {PAYMENT_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`text-left p-6 rounded-2xl border transition-all shadow-sm active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-emerald-500/5'
                    : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <h3 className="text-base font-medium text-slate-900 mb-1">{type.label}</h3>
                <p className="text-xs text-slate-500 font-normal">Columns: {type.columns}</p>
              </button>
            );
          })}
        </div>

        {selectedType && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm max-w-xl mb-8">
            <label className="block text-sm font-normal text-slate-700 mb-2">
              CSV file (columns: {PAYMENT_TYPES.find((t) => t.id === selectedType)?.columns})
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:border file:border-slate-200 file:rounded-xl file:bg-slate-50 file:text-sm file:font-normal file:text-slate-700 hover:file:border-emerald-300 hover:file:bg-emerald-50/50 transition-all cursor-pointer"
            />

            {fileName && rows.length > 0 && (
              <p className="text-xs font-normal text-emerald-800 mt-3 bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl">
                {fileName} — {rows.length} row{rows.length !== 1 ? 's' : ''} loaded
              </p>
            )}

            {error && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleRunBatch}
              disabled={rows.length === 0 || processing}
              className="mt-6 w-full py-3 text-sm font-normal text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {processing ? `Checking ${progress} / ${rows.length}...` : `Check ${rows.length || ''} transaction${rows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-normal text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-900">{flaggedCount}</span>
                <span>flagged out of {results.length} checked</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs uppercase tracking-wider font-normal">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Fraud probability</th>
                    <th className="px-6 py-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-normal">{i + 1}</td>
                      <td className="px-6 py-4 text-slate-900 font-normal">
                        {r.error ? '-' : `${(r.fraud_probability * 100).toFixed(2)}%`}
                      </td>
                      <td className="px-6 py-4">
                        {r.error ? (
                          <span className="text-slate-500">{r.error}</span>
                        ) : r.is_fraud ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}