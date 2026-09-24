import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

function useCountUp(target, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0)
  const frame = useRef()

  useEffect(() => {
    const numericTarget = Number(target) || 0
    const start = performance.now()

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(numericTarget * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value)
}

function StatIcon({ type }) {
  const icons = {
    checked: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    flagged: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M12 2.5 21 7v6c0 5-3.7 8.4-9 9.5-5.3-1.1-9-4.5-9-9.5V7l9-4.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
    rate: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    types: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M7 6V5a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  }
  return icons[type] || null
}

function StatCard({ label, value, decimals = 0, suffix = '', delay = 0, icon, accent = 'green' }) {
  const animated = useCountUp(value, 1100, decimals)

  const accents = {
    green: { icon: 'bg-green text-white', glow: 'bg-green/15' },
    red: { icon: 'bg-red-600 text-white', glow: 'bg-red-500/15' },
    amber: { icon: 'bg-amber-500 text-white', glow: 'bg-amber-500/15' },
  }
  const a = accents[accent] || accents.green

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="relative bg-white border border-line p-6 opacity-0 animate-fade-in-up hover:border-green/40 hover:shadow-xl hover:shadow-green/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${a.glow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${a.icon}`}>
        <StatIcon type={icon} />
      </div>
      <div className="text-sm text-ink-muted mb-1 font-medium">{label}</div>
      <div className="font-serif text-3xl font-semibold text-ink tabular-nums">
        {animated}{suffix}
      </div>
    </div>
  )
}

function TypeBar({ label, count, max, delay = 0 }) {
  const [width, setWidth] = useState(0)
  const pct = max > 0 ? Math.round((count / max) * 100) : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150 + delay)
    return () => clearTimeout(t)
  }, [pct, delay])

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-ink-muted font-medium">{label}</span>
        <span className="text-ink font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green to-green-bright rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Could not load dashboard data')
        const data = await response.json()
        setStats(data.stats)
        setRecent(data.recentTransactions || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const byTypeEntries = stats?.byType ? Object.entries(stats.byType) : []
  const maxTypeCount = byTypeEntries.length ? Math.max(...byTypeEntries.map(([, c]) => c)) : 0

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-serif text-3xl font-semibold text-ink">Overview</h1>
        {!loading && !error && (
          <div className="flex items-center gap-2 text-sm text-green font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
            </span>
            Live
          </div>
        )}
      </div>
      <p className="text-ink-muted text-lg mb-10">A summary of checks run across all payment types.</p>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-bg-subtle rounded-lg animate-pulse-dot" />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-fade-in-up">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            <StatCard label="Transactions checked" value={stats.totalChecked ?? 0} icon="checked" accent="green" delay={0} />
            <StatCard label="Fraud flagged" value={stats.totalFraud ?? 0} icon="flagged" accent="red" delay={80} />
            <StatCard
              label="Fraud rate"
              value={stats.fraudRate ?? 0}
              decimals={2}
              suffix="%"
              icon="rate"
              accent="amber"
              delay={160}
            />
            <StatCard label="Payment types active" value={stats.activeTypes ?? 3} icon="types" accent="green" delay={240} />
          </div>

          <div
            className="bg-white border border-line mb-12 opacity-0 animate-fade-in-up overflow-hidden"
            style={{ animationDelay: '300ms' }}
          >
            <div className="border-b border-line px-6 py-5 bg-bg-subtle/50">
              <h2 className="font-serif text-xl font-semibold text-ink">By payment type</h2>
            </div>
            <div className="divide-y divide-line">
              {byTypeEntries.length === 0 && (
                <p className="px-6 py-8 text-sm text-ink-muted text-center">No data yet.</p>
              )}
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

      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent activity</h2>
          <Link to="/transactions" className="text-sm text-green hover:text-green-strong font-medium underline underline-offset-4">
            View all
          </Link>
        </div>

        {!loading && recent.length === 0 && (
          <div className="border border-dashed border-line rounded-lg p-10 text-center">
            <p className="text-sm text-ink-muted">No transactions checked yet.</p>
          </div>
        )}

        {recent.length > 0 && (
          <div className="bg-white border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/50">
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Amount</th>
                  <th className="px-5 py-3.5 font-medium">Result</th>
                  <th className="px-5 py-3.5 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((tx, i) => (
                  <tr
                    key={tx.id}
                    style={{ animationDelay: `${450 + i * 60}ms` }}
                    className="opacity-0 animate-fade-in-up row-hover"
                  >
                    <td className="px-5 py-3.5 text-ink-muted">{PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}</td>
                    <td className="px-5 py-3.5 text-ink font-medium">{tx.amount}</td>
                    <td className="px-5 py-3.5">
                      {tx.isFraud ? (
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-green font-medium">
                          <span className="w-2 h-2 rounded-full bg-green" />
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{tx.checkedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-line">
        <p className="text-xs text-ink-muted mb-3 font-medium uppercase tracking-wide">Go to another section</p>
        <div className="flex flex-wrap gap-2">
          {[
            ['/check', 'Check transaction'],
            ['/transactions', 'Transactions'],
            ['/alerts', 'Fraud alerts'],
            ['/upload', 'Batch upload'],
            ['/reports', 'Reports'],
            ['/profile', 'Profile'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="px-4 py-2 text-sm font-medium border border-line text-ink hover:border-green hover:text-green hover:bg-green-soft/40 transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}