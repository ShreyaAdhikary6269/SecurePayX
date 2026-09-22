import React, { useEffect, useState } from 'react';
import Dashboardlayout from './Dashboardlayout';

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
};

const FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'creditcard', label: 'Credit / debit card' },
  { id: 'paysim', label: 'Mobile wallet / UPI' },
  { id: 'banksim', label: 'Banking' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Could not load transactions');
        }

        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.paymentType === filter);

  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Transactions</h1>
      <p className="text-ink-muted mb-6">All transactions you have checked, across every payment type.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 text-sm border transition-colors ${
              filter === f.id
                ? 'border-green text-green bg-green-soft'
                : 'border-line text-ink-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-muted">Loading transactions...</p>}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-line border-dashed p-10 text-center">
          <p className="text-sm text-ink-muted">
            {transactions.length === 0
              ? 'No transactions checked yet.'
              : 'No transactions match this filter.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th className="px-4 py-3 font-normal">Type</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Fraud probability</th>
                <th className="px-4 py-3 font-normal">Result</th>
                <th className="px-4 py-3 font-normal">Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-bg-subtle transition-colors">
                  <td className="px-4 py-3 text-ink-muted">
                    {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                  </td>
                  <td className="px-4 py-3 text-ink">{tx.amount}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {tx.isFraud ? (
                      <span className="inline-flex items-center gap-1.5 text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-green">
                        <span className="w-1.5 h-1.5 rounded-full bg-green" />
                        Cleared
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{tx.checkedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Dashboardlayout>
  );
}