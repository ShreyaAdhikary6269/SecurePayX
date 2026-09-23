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

export default function FraudAlerts() {
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
          throw new Error('Could not load fraud alerts');
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

  const flagged = transactions.filter((t) => t.isFraud);
  const filtered = filter === 'all' ? flagged : flagged.filter((t) => t.paymentType === filter);

  return (
    <Dashboardlayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Fraud alerts</h1>
      <p className="text-ink-muted mb-6">Transactions that were flagged as fraud, filterable by payment type.</p>

      {!loading && !error && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-ink">{flagged.length}</span>
          <span className="text-ink-muted">flagged out of {transactions.length} checked</span>
        </div>
      )}

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

      {loading && <p className="text-sm text-ink-muted">Loading fraud alerts...</p>}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-line border-dashed p-10 text-center">
          <p className="text-sm text-ink-muted">
            {flagged.length === 0
              ? 'No fraud has been flagged yet.'
              : 'No flagged transactions match this filter.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="border border-red-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-red-200 bg-red-50 text-left text-red-700">
                <th className="px-4 py-3 font-normal">Type</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Fraud probability</th>
                <th className="px-4 py-3 font-normal">Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-bg-subtle transition-colors">
                  <td className="px-4 py-3 text-ink-muted">
                    {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                  </td>
                  <td className="px-4 py-3 text-ink">{tx.amount}</td>
                  <td className="px-4 py-3 text-red-700">
                    {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '-'}
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