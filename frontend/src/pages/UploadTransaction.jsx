import React, { useState } from 'react';
import Dashboardlayout from './Dashboardlayout';

const PAYMENT_TYPES = [
  { id: 'creditcard', label: 'Credit / debit card', columns: 'Amount, Time' },
  { id: 'paysim', label: 'Mobile wallet / UPI', columns: 'type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest' },
  { id: 'banksim', label: 'Banking', columns: 'age, gender, category, amount' },
];

// Simple CSV parser - good enough for plain numeric/text CSVs without
// embedded commas inside quoted fields. Fine for this project's datasets.
function parseCSV(text) {
  const lines = text.trim().split('\n');
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
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Batch upload</h1>
      <p className="text-ink-muted mb-8">Upload a CSV of transactions to check many at once.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {PAYMENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`text-left border p-5 transition-colors ${
              selectedType === type.id
                ? 'border-green bg-green-soft'
                : 'border-line hover:border-green'
            }`}
          >
            <h3 className="font-serif text-lg text-ink mb-1">{type.label}</h3>
            <p className="text-xs text-ink-muted">Columns: {type.columns}</p>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="border border-line p-6 max-w-lg mb-8">
          <label className="block text-sm mb-2 text-ink-muted">
            CSV file (columns: {PAYMENT_TYPES.find((t) => t.id === selectedType)?.columns})
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:border file:border-line file:bg-bg file:text-sm file:text-ink hover:file:border-green"
          />

          {fileName && rows.length > 0 && (
            <p className="text-xs text-ink-muted mt-3">
              {fileName} - {rows.length} row{rows.length !== 1 ? 's' : ''} loaded
            </p>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRunBatch}
            disabled={rows.length === 0 || processing}
            className="mt-6 w-full py-2.5 text-sm text-white bg-green hover:bg-green-strong transition-colors disabled:opacity-50"
          >
            {processing ? `Checking ${progress} / ${rows.length}...` : `Check ${rows.length || ''} transactions`}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="text-ink">{flaggedCount}</span>
            <span className="text-ink-muted">flagged out of {results.length} checked</span>
          </div>

          <div className="border border-line overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-4 py-3 font-normal">#</th>
                  <th className="px-4 py-3 font-normal">Fraud probability</th>
                  <th className="px-4 py-3 font-normal">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-4 py-3 text-ink">
                      {r.error ? '-' : `${(r.fraud_probability * 100).toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3">
                      {r.error ? (
                        <span className="text-ink-muted">{r.error}</span>
                      ) : r.is_fraud ? (
                        <span className="text-red-700">Flagged</span>
                      ) : (
                        <span className="text-green">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Dashboardlayout>
  );
}