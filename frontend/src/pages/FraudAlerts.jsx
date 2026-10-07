import React, { useEffect, useState } from 'react';
import DashboardLayout from './Dashboardlayout';

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
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header with emerald green styling and smooth hover effect */}
        <div className="mb-8 cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
          <h1 className="text-3xl font-normal text-emerald-900 tracking-tight mb-2">
            Fraud alerts
          </h1>
          <p className="text-emerald-700/80 text-base font-normal">
            Transactions that were flagged as fraud, filterable by payment type.
          </p>
        </div>

        {!loading && !error && (
          <div className="mb-6 flex items-center gap-2.5 px-4 py-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-sm w-fit shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-medium text-rose-900">{flagged.length}</span>
            <span className="text-rose-700/80">flagged out of {transactions.length} checked</span>
          </div>
        )}

        {/* Prominent Filter Buttons with soft emerald green active states */}
        <div className="flex flex-wrap gap-3 mb-8">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 text-sm font-normal rounded-xl border transition-all duration-200 active:scale-[0.98] shadow-sm ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-emerald-500/5'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-slate-500 font-normal">
            Loading fraud alerts...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="border border-slate-200 border-dashed rounded-2xl p-12 text-center bg-white shadow-sm">
            <p className="text-sm text-slate-500 font-normal">
              {flagged.length === 0
                ? 'No fraud has been flagged yet.'
                : 'No flagged transactions match this filter.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white border border-rose-200/80 shadow-sm rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-rose-100 bg-rose-50/50 text-rose-800 text-xs uppercase tracking-wider font-normal">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Fraud probability</th>
                  <th className="px-6 py-4">Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-normal text-slate-900">
                      {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-normal">{tx.amount}</td>
                    <td className="px-6 py-4 text-rose-700 font-normal">
                      {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-normal">{tx.checkedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}