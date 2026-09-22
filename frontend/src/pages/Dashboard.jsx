import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Dashboardlayout from './Dashboardlayout';

function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const numericTarget = Number(target) || 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(numericTarget * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value);
}

function StatCard({ label, value, decimals = 0, suffix = '', delay = 0 }) {
  const animated = useCountUp(value, 1000, decimals);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="border border-line p-5 opacity-0 animate-fade-in-up hover:border-green hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(20,83,45,0.15)] transition-all duration-300"
    >
      <div className="text-sm text-ink-muted mb-2">{label}</div>
      <div className="font-serif text-3xl text-ink tabular-nums">
        {animated}
        {suffix}
      </div>
    </div>
  );
}

function TypeBar({ label, count, max, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 bg-bg-subtle overflow-hidden">
        <div
          className="h-full bg-green transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Could not load dashboard data');
        }

        const data = await response.json();
        setStats(data.stats);
        setRecent(data.recentTransactions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const byTypeEntries = stats?.byType ? Object.entries(stats.byType) : [];
  const maxTypeCount = byTypeEntries.length
    ? Math.max(...byTypeEntries.map(([, c]) => c))
    : 0;

  return (
    <Dashboardlayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-serif text-2xl text-ink">Overview</h1>
        {!loading && !error && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
            Live
          </div>
        )}
      </div>
      <p className="text-ink-muted mb-8">A summary of checks run across all payment types.</p>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-bg-subtle animate-pulse-dot" />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in-up">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Transactions checked" value={stats.totalChecked ?? 0} delay={0} />
            <StatCard label="Fraud flagged" value={stats.totalFraud ?? 0} delay={80} />
            <StatCard
              label="Fraud rate"
              value={stats.fraudRate ?? 0}
              decimals={2}
              suffix="%"
              delay={160}
            />
            <StatCard label="Payment types active" value={stats.activeTypes ?? 3} delay={240} />
          </div>

          <div className="border border-line opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-lg text-ink">By payment type</h2>
            </div>
            <div className="divide-y divide-line">
              {byTypeEntries.map(([type, count], i) => (
                <TypeBar
                  key={type}
                  label={PAYMENT_TYPE_LABELS[type] || type}
                  count={count}
                  max={maxTypeCount}
                  delay={i * 120}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Recent activity</h2>
          <Link to="/transactions" className="text-sm text-green hover:text-green-strong underline underline-offset-4">
            View all
          </Link>
        </div>

        {!loading && recent.length === 0 && (
          <p className="text-sm text-ink-muted">No transactions checked yet.</p>
        )}

        {recent.length > 0 && (
          <div className="border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Result</th>
                  <th className="px-4 py-3 font-normal">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((tx, i) => (
                  <tr
                    key={tx.id}
                    style={{ animationDelay: `${450 + i * 60}ms` }}
                    className="opacity-0 animate-fade-in-up row-hover"
                  >
                    <td className="px-4 py-3 text-ink-muted">
                      {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                    </td>
                    <td className="px-4 py-3 text-ink">{tx.amount}</td>
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
      </div>

      <div className="mt-10 pt-6 border-t border-line">
        <p className="text-xs text-ink-muted mb-3">Go to another section</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/check" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Check transaction</Link>
          <Link to="/transactions" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Transactions</Link>
          <Link to="/alerts" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Fraud alerts</Link>
          <Link to="/upload" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Batch upload</Link>
          <Link to="/reports" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Reports</Link>
          <Link to="/profile" className="px-3.5 py-2 text-sm border border-line text-ink hover:border-green hover:text-green transition-colors">Profile</Link>
        </div>
      </div>
    </Dashboardlayout>
  );
}