import React, { useEffect, useState } from 'react';
import DashboardLayout from './Dashboardlayout';
import TransactionFilters from '../components/Transactionfilters';
import ExportButton from '../components/Exportbutton';

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
  const [visible, setVisible] = useState([]);

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

  // TransactionFilters expects `createdAt`; this data uses `checkedAt`, so
  // it's mapped across without touching the shared component.
  const filterInput = filtered.map((t) => ({ ...t, createdAt: t.checkedAt }));

  const exportRows = visible.map((tx) => ({
    id: tx.id,
    paymentType: PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType,
    amount: tx.amount,
    fraudProbability: tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '',
    result: tx.isFraud ? 'Flagged' : 'Cleared',
    checkedAt: tx.checkedAt,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header with emerald green styling and hover effect */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
            <h1 className="text-3xl font-normal text-emerald-900 tracking-tight mb-2">
              Transactions
            </h1>
            <p className="text-emerald-700/80 text-base font-normal">
              All transactions you have checked, across every payment type.
            </p>
          </div>
          <ExportButton
            data={exportRows}
            filename="transactions"
            columns={[
              { key: 'id', label: 'Transaction ID' },
              { key: 'paymentType', label: 'Payment type' },
              { key: 'amount', label: 'Amount' },
              { key: 'fraudProbability', label: 'Fraud probability' },
              { key: 'result', label: 'Result' },
              { key: 'checkedAt', label: 'Checked' },
            ]}
          />
        </div>

        {/* Prominent Filter Buttons */}
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

        {!loading && !error && transactions.length > 0 && (
          <div className="mb-6">
            <TransactionFilters transactions={filterInput} onFilteredChange={setVisible} />
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-sm text-slate-500 font-normal">
            Loading transactions...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="border border-slate-200 border-dashed rounded-2xl p-12 text-center bg-white shadow-sm">
            <p className="text-sm text-slate-500 font-normal">
              {transactions.length === 0
                ? 'No transactions checked yet.'
                : 'No transactions match this filter.'}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider font-normal">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Fraud probability</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-normal text-slate-900">
                      {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-normal">{tx.amount}</td>
                    <td className="px-6 py-4 text-slate-600 font-normal">
                      {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 font-normal">
                      {tx.isFraud ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Cleared
                        </span>
                      )}
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