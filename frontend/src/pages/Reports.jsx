import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';

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
    <div className="px-5 py-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink tabular-nums">
          {fraud} / {checked} flagged ({fraudRate.toFixed(1)}%)
        </span>
      </div>
      <div className="h-1.5 bg-bg-subtle overflow-hidden">
        <div
          className="h-full bg-red-500 transition-[width] duration-700 ease-out"
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

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl text-ink mb-1">Reports</h1>
      <p className="text-ink-muted mb-8">Analytics and summary across all payment types.</p>

      {loading && <p className="text-sm text-ink-muted">Loading report data...</p>}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && totalChecked === 0 && (
        <div className="border border-line border-dashed p-10 text-center">
          <p className="text-sm text-ink-muted">No data yet. Check some transactions to see reports here.</p>
        </div>
      )}

      {!loading && !error && totalChecked > 0 && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="border border-line p-5">
              <div className="text-sm text-ink-muted mb-2">Overall fraud rate</div>
              <div className="font-serif text-3xl text-ink">{overallFraudRate.toFixed(2)}%</div>
            </div>
            <div className="border border-line p-5">
              <div className="text-sm text-ink-muted mb-2">Average fraud probability</div>
              <div className="font-serif text-3xl text-ink">{(avgFraudProbability * 100).toFixed(2)}%</div>
            </div>
            <div className="border border-line p-5">
              <div className="text-sm text-ink-muted mb-2">Total checked</div>
              <div className="font-serif text-3xl text-ink">{totalChecked}</div>
            </div>
          </div>

          <div className="border border-line mb-10">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-lg text-ink">Fraud rate by payment type</h2>
            </div>
            <div className="divide-y divide-line">
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

          <div className="border border-line">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-lg text-ink">Highest risk transactions</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Fraud probability</th>
                  <th className="px-4 py-3 font-normal">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {highestRisk.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-ink-muted">
                      {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                    </td>
                    <td className="px-4 py-3 text-ink">{tx.amount}</td>
                    <td className="px-4 py-3 text-ink">
                      {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{tx.checkedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}