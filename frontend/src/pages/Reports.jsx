import React, { useEffect, useState } from 'react';
import DashboardLayout from './Dashboardlayout';
import ExportButton from '../components/Exportbutton';

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
};

function TypeReportBar({ label, checked, fraud, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const fraudRate = checked > 0 ? (fraud / checked) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(fraudRate), 100 + delay);
    return () => clearTimeout(t);
  }, [fraudRate, delay]);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between text-sm mb-2.5">
        <span className="font-normal text-slate-700">{label}</span>
        <span className="text-slate-600 font-normal tabular-nums">
          {fraud} / {checked} flagged <span className="text-emerald-700 font-medium">({fraudRate.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Could not load report data');
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

  const byType = {};
  transactions.forEach((t) => {
    if (!byType[t.paymentType]) {
      byType[t.paymentType] = { checked: 0, fraud: 0 };
    }
    byType[t.paymentType].checked += 1;
    if (t.isFraud) byType[t.paymentType].fraud += 1;
  });

  const totalChecked = transactions.length;
  const totalFraud = transactions.filter((t) => t.isFraud).length;
  const overallFraudRate = totalChecked > 0 ? (totalFraud / totalChecked) * 100 : 0;

  const avgFraudProbability = totalChecked > 0
    ? transactions.reduce((sum, t) => sum + (t.fraudProbability || 0), 0) / totalChecked
    : 0;

  const highestRisk = [...transactions]
    .sort((a, b) => (b.fraudProbability || 0) - (a.fraudProbability || 0))
    .slice(0, 5);

  const summaryExportRows = [
    { metric: 'Overall fraud rate', value: `${overallFraudRate.toFixed(2)}%` },
    { metric: 'Average fraud probability', value: `${(avgFraudProbability * 100).toFixed(2)}%` },
    { metric: 'Total checked', value: totalChecked },
    ...Object.entries(byType).map(([type, stats]) => ({
      metric: `${PAYMENT_TYPE_LABELS[type] || type} — fraud rate`,
      value: `${stats.fraud} / ${stats.checked} (${stats.checked > 0 ? ((stats.fraud / stats.checked) * 100).toFixed(2) : '0.00'}%)`,
    })),
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header with emerald green styling and smooth hover effect */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
            <h1 className="text-3xl font-normal text-emerald-900 tracking-tight mb-2">
              Reports
            </h1>
            <p className="text-emerald-700/80 text-base font-normal">
              Analytics and summary across all payment types.
            </p>
          </div>
          {!loading && !error && totalChecked > 0 && (
            <ExportButton
              data={summaryExportRows}
              filename="fraud-report-summary"
              columns={[
                { key: 'metric', label: 'Metric' },
                { key: 'value', label: 'Value' },
              ]}
              label="Download summary"
            />
          )}
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-slate-500 font-normal">
            Loading report data...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && totalChecked === 0 && (
          <div className="border border-slate-200 border-dashed rounded-2xl p-12 text-center bg-white shadow-sm">
            <p className="text-sm text-slate-500 font-normal">No data yet. Check some transactions to see reports here.</p>
          </div>
        )}

        {!loading && !error && totalChecked > 0 && (
          <>
            {/* Metric Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors">
                <div className="text-sm text-slate-500 font-normal mb-1">Overall fraud rate</div>
                <div className="text-3xl font-normal text-emerald-900 tracking-tight">{overallFraudRate.toFixed(2)}%</div>
              </div>
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors">
                <div className="text-sm text-slate-500 font-normal mb-1">Average fraud probability</div>
                <div className="text-3xl font-normal text-emerald-900 tracking-tight">{(avgFraudProbability * 100).toFixed(2)}%</div>
              </div>
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors">
                <div className="text-sm text-slate-500 font-normal mb-1">Total checked</div>
                <div className="text-3xl font-normal text-emerald-900 tracking-tight">{totalChecked}</div>
              </div>
            </div>

            {/* Fraud Rate by Payment Type */}
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden mb-8">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h2 className="text-base font-normal text-slate-800">Fraud rate by payment type</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {Object.entries(byType).map(([type, stats], i) => (
                  <TypeReportBar
                    key={type}
                    label={PAYMENT_TYPE_LABELS[type] || type}
                    checked={stats.checked}
                    fraud={stats.fraud}
                    delay={i * 120}
                  />
                ))}
              </div>
            </div>

            {/* Highest Risk Transactions Table */}
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h2 className="text-base font-normal text-slate-800">Highest risk transactions</h2>
                <ExportButton
                  data={highestRisk.map((tx) => ({
                    id: tx.id,
                    paymentType: PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType,
                    amount: tx.amount,
                    fraudProbability: tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '',
                    checkedAt: tx.checkedAt,
                  }))}
                  filename="highest-risk-transactions"
                  columns={[
                    { key: 'id', label: 'Transaction ID' },
                    { key: 'paymentType', label: 'Payment type' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'fraudProbability', label: 'Fraud probability' },
                    { key: 'checkedAt', label: 'Checked' },
                  ]}
                  label="Download"
                />
              </div>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs uppercase tracking-wider font-normal">
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Fraud probability</th>
                    <th className="px-6 py-4">Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highestRisk.map((tx) => (
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}