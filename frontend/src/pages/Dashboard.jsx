import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import TimeOfDayChart from '../components/TimeOfDayChart'

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

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

const PAYMENT_TYPE_ICONS = {
  creditcard: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  paysim: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="3" y="4" width="15" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M18 9h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  banksim: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M3 9.5 12 4l9 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19M9.5 9.5V19M14.5 9.5V19M19 9.5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 19h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
}

/* ---------- Hero banner: gradient block with key stats ---------- */
function HeroBanner({ stats, loading }) {
  const totalChecked = useCountUp(stats?.totalChecked ?? 0, 1000)
  const totalFraud = useCountUp(stats?.totalFraud ?? 0, 1000)
  const byType = stats?.byType || {}

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-green via-green-strong to-[#052E22] p-8 mb-8 shadow-lg shadow-green/20">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-4 bottom-0 w-56 h-56 rounded-full bg-green-bright/20 blur-2xl" />

      <div className="relative">
        <p className="text-emerald-100 text-sm font-medium mb-1">Fraud Detection Overview</p>
        <h1 className="font-serif text-3xl font-semibold text-white mb-6">
          {loading ? '...' : totalChecked} transactions analyzed
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-serif font-semibold text-white">{loading ? '-' : totalFraud}</div>
            <div className="text-xs text-emerald-100 mt-1">Fraud flagged</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-serif font-semibold text-white">{byType.creditcard ?? 0}</div>
            <div className="text-xs text-emerald-100 mt-1">Card checks</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-serif font-semibold text-white">{byType.paysim ?? 0}</div>
            <div className="text-xs text-emerald-100 mt-1">Wallet / UPI checks</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-serif font-semibold text-white">{byType.banksim ?? 0}</div>
            <div className="text-xs text-emerald-100 mt-1">Banking checks</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Risk level donut (Low/Medium/High, not just fraud/clear) ---------- */
function RiskDonut({ transactions }) {
  const buckets = { low: 0, medium: 0, high: 0 }
  transactions.forEach((t) => {
    const p = t.fraudProbability ?? 0
    if (p < 0.3) buckets.low++
    else if (p < 0.7) buckets.medium++
    else buckets.high++
  })
  const total = transactions.length || 1

  const segments = [
    { key: 'low', color: '#059669', value: buckets.low },
    { key: 'medium', color: '#F59E0B', value: buckets.medium },
    { key: 'high', color: '#DC2626', value: buckets.high },
  ]

  const R = 54
  const CIRC = 2 * Math.PI * R
  let offsetAcc = 0

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-ink mb-1">Risk overview</h3>
      <p className="text-xs text-ink-muted mb-5">By probability tier, not just pass/fail</p>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#F0F0F0" strokeWidth="14" />
            {segments.map((seg) => {
              const frac = seg.value / total
              const dash = frac * CIRC
              const el = (
                <circle
                  key={seg.key}
                  cx="60" cy="60" r={R} fill="none" stroke={seg.color} strokeWidth="14"
                  strokeDasharray={`${dash} ${CIRC - dash}`}
                  strokeDashoffset={-offsetAcc}
                  strokeLinecap="butt"
                />
              )
              offsetAcc += dash
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-xl font-semibold text-ink">{transactions.length}</span>
            <span className="text-[10px] text-ink-muted">checked</span>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green" />
            <span className="text-ink-muted">Low</span>
            <span className="text-ink font-medium ml-auto">{buckets.low}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-ink-muted">Medium</span>
            <span className="text-ink font-medium ml-auto">{buckets.medium}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-ink-muted">High</span>
            <span className="text-ink font-medium ml-auto">{buckets.high}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Checks by type: simple bar chart ---------- */
function TypeBarChart({ byType }) {
  const entries = Object.entries(byType)
  const max = entries.length ? Math.max(...entries.map(([, v]) => v)) : 1

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-ink mb-1">Checks by channel</h3>
      <p className="text-xs text-ink-muted mb-6">Volume per payment type</p>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-10">No data yet</p>
      ) : (
        <div className="flex items-end justify-around gap-4 h-40">
          {entries.map(([type, count]) => {
            const heightPct = max > 0 ? (count / max) * 100 : 0
            return (
              <div key={type} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-sm font-semibold text-ink">{count}</span>
                <div className="w-full flex items-end h-28 bg-bg-subtle rounded-md overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-green to-green-bright rounded-md transition-all duration-700 ease-out"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs text-ink-muted text-center">{PAYMENT_TYPE_LABELS[type]?.split(' / ')[0] || type}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- Detection trend: sparkline of recent fraud probabilities ---------- */
function TrendSparkline({ transactions }) {
  const recent = transactions.slice(0, 10).reverse()
  const points = recent.map((t) => (t.fraudProbability ?? 0) * 100)

  const w = 280
  const h = 100
  const pad = 8
  const maxVal = 100

  const path = points.length > 1
    ? points.map((v, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2)
        const y = h - pad - (v / maxVal) * (h - pad * 2)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')
    : ''

  const avg = points.length ? (points.reduce((a, b) => a + b, 0) / points.length).toFixed(1) : '0.0'

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-ink mb-1">Detection trend</h3>
      <p className="text-xs text-ink-muted mb-1">Fraud probability, last 10 checks</p>
      <p className="text-2xl font-serif font-semibold text-ink mb-4">{avg}%<span className="text-xs text-ink-muted font-sans font-normal ml-1">avg</span></p>

      {points.length > 1 ? (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} fill="url(#trendFill)" />
          <path d={path} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <p className="text-sm text-ink-muted text-center py-8">Not enough data yet</p>
      )}
    </div>
  )
}

/* ---------- Payment channels list (like a "payment gateways" card) ---------- */
function ChannelsList({ byType, transactions }) {
  const channels = ['creditcard', 'paysim', 'banksim']

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-ink mb-5">Payment channels</h3>
      <div className="space-y-1">
        {channels.map((ch) => {
          const count = byType[ch] || 0
          const fraudCount = transactions.filter((t) => t.paymentType === ch && t.isFraud).length
          return (
            <div key={ch} className="flex items-center justify-between py-3 border-b border-line last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-soft text-green flex items-center justify-center">
                  {PAYMENT_TYPE_ICONS[ch]}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{PAYMENT_TYPE_LABELS[ch]}</div>
                  <div className="text-xs text-ink-muted">{count} checked</div>
                </div>
              </div>
              <span className={`text-sm font-semibold ${fraudCount > 0 ? 'text-red-600' : 'text-ink-muted'}`}>
                {fraudCount} flagged
              </span>
            </div>
          )
        })}
      </div>
      <Link
        to="/transactions"
        className="block text-center mt-5 py-2.5 text-sm font-medium text-green bg-green-soft hover:bg-green hover:text-white rounded-lg transition-colors duration-200"
      >
        View all transactions
      </Link>
    </div>
  )
}

/* ---------- Recent alerts mini list, now with prediction feedback ---------- */
function RecentAlerts({ transactions }) {
  const flagged = transactions.filter((t) => t.isFraud).slice(0, 4)
  const [feedback, setFeedback] = useState({})

  const sendFeedback = async (txId, verdict) => {
    setFeedback((f) => ({ ...f, [txId]: verdict }))
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: txId, verdict }),
      })
    } catch {
      // best-effort logging — keep the optimistic UI either way
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-lg font-semibold text-ink">Recent alerts</h3>
        <Link to="/alerts" className="text-xs text-green hover:text-green-strong font-medium">View all</Link>
      </div>

      {flagged.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-8">No fraud flagged yet</p>
      ) : (
        <div className="space-y-3">
          {flagged.map((tx) => (
            <div key={tx.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold">!</div>
                  <div>
                    <div className="text-sm font-medium text-ink">{PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}</div>
                    <div className="text-xs text-ink-muted">{tx.amount}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-red-700">
                  {tx.fraudProbability != null ? `${(tx.fraudProbability * 100).toFixed(0)}%` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-100">
                {feedback[tx.id] ? (
                  <span className="text-xs text-ink-muted">
                    Thanks — marked as {feedback[tx.id] === 'confirmed' ? 'correctly flagged' : 'not actually fraud'}.
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-ink-muted mr-1">Was this right?</span>
                    <button
                      onClick={() => sendFeedback(tx.id, 'confirmed')}
                      className="px-2.5 py-1 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-md transition-colors"
                    >
                      Yes, fraud
                    </button>
                    <button
                      onClick={() => sendFeedback(tx.id, 'not_fraud')}
                      className="px-2.5 py-1 text-xs font-medium text-ink-muted border border-line bg-white hover:bg-bg-subtle rounded-md transition-colors"
                    >
                      Not fraud
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchAll = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!statsRes.ok) throw new Error('Could not load dashboard data')
        const statsData = await statsRes.json()
        setStats(statsData.stats)

        if (txRes.ok) {
          const txData = await txRes.json()
          setTransactions(txData.transactions || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return (
    <DashboardLayout>
      <HeroBanner stats={stats} loading={loading} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid lg:grid-cols-3 gap-5 mb-5">
            <RiskDonut transactions={transactions} />
            <TypeBarChart byType={stats?.byType || {}} />
            <TrendSparkline transactions={transactions} />
          </div>

          <div className="mb-5">
            <TimeOfDayChart transactions={transactions} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChannelsList byType={stats?.byType || {}} transactions={transactions} />
            <RecentAlerts transactions={transactions} />
          </div>
        </>
      )}
    </DashboardLayout>
  )
}