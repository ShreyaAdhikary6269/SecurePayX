import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from './Dashboardlayout'
import TimeOfDayChart from '../components/Timeofdaychart'

const API = 'http://localhost:5000'
const REQUEST_TIMEOUT_MS = 20000

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

// Colour themes for each channel (change here to restyle)
const CHANNEL_THEME = {
  creditcard: { chip: 'bg-emerald-50 text-emerald-600', gradient: 'linear-gradient(90deg,#10B981,#059669)' },
  paysim: { chip: 'bg-teal-50 text-teal-600', gradient: 'linear-gradient(90deg,#14B8A6,#0D9488)' },
  banksim: { chip: 'bg-lime-50 text-lime-700', gradient: 'linear-gradient(90deg,#84CC16,#65A30D)' },
}

const BAR_GRADIENTS = [
  'linear-gradient(180deg,#34D399,#059669)',
  'linear-gradient(180deg,#2DD4BF,#0D9488)',
  'linear-gradient(180deg,#A3E635,#65A30D)',
]

const RISK_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#F43F5E' }
const CARD_SHADOW = '0 1px 2px rgba(6,40,28,.05), 0 10px 30px -14px rgba(6,40,28,.16)'
const HERO_GRADIENT =
  'linear-gradient(120deg,#03110C 0%,#064E3B 32%,#047857 58%,#0F766E 82%,#03110C 100%)'

const CHANNEL_ICONS = {
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

/* ---------- helpers ---------- */
function useCountUp(target, duration = 1100, decimals = 0) {
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

// Becomes true shortly after mounting, so bars and lines can animate in
function useReady(delay = 80) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}

function AnimatedNumber({ value }) {
  const shown = useCountUp(value, 1100)
  return <>{shown}</>
}

function formatPercent(p) {
  if (p == null || Number.isNaN(Number(p))) return '-'
  const pct = Number(p) * 100
  if (pct < 0.01) return '<0.01%'
  if (pct > 99.99) return '>99.99%'
  return `${pct.toFixed(2)}%`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function firstName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const base = ((user && user.email) || '').split('@')[0].split(/[._-]+/)[0]
    if (!base) return ''
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return ''
  }
}

function threatLevel(totalChecked, flagRate) {
  if (totalChecked === 0) return { label: 'Awaiting data', color: '#CBD5E1' }
  if (flagRate < 2) return { label: 'All clear', color: '#34D399' }
  if (flagRate < 10) return { label: 'Elevated activity', color: '#FBBF24' }
  return { label: 'High alert', color: '#FB7185' }
}

/* ---------- building blocks ---------- */
// Outer element animates in; inner element lifts on hover
function Card({ children, className = '', delay = 0 }) {
  return (
    <div className={`animate-fade-in-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div
        className="h-full rounded-2xl border border-line bg-white/90 p-6 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-green/40"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />
}

/* ---------- hero ---------- */
function HeroSpark({ points }) {
  const w = 260
  const h = 70
  const pad = 6
  const ready = useReady(200)

  if (points.length < 2) {
    return <p className="text-xs text-emerald-100/70 py-6 text-center">Run a few checks to see the live risk trend.</p>
  }

  const coords = points.map((p, i) => [
    pad + (i / (points.length - 1)) * (w - pad * 2),
    h - pad - Math.min(Math.max(p, 0), 1) * (h - pad * 2),
  ])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
        fill="url(#heroSparkFill)"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 900ms ease 300ms' }}
      />
      <path
        d={path}
        pathLength="1"
        fill="none"
        stroke="#A7F3D0"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1, strokeDashoffset: ready ? 0 : 1, transition: 'stroke-dashoffset 1300ms ease' }}
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#fff" style={{ opacity: ready ? 1 : 0, transition: 'opacity 400ms ease 1200ms' }} />
    </svg>
  )
}

function HeroBanner({ stats, transactions, updatedAt }) {
  const totalChecked = stats?.totalChecked ?? 0
  const totalFraud = stats?.totalFraud ?? 0
  const byType = stats?.byType || {}
  const flagRate = totalChecked ? (totalFraud / totalChecked) * 100 : 0
  const level = threatLevel(totalChecked, flagRate)
  const recent = transactions.slice(0, 12).reverse().map((t) => Number(t.fraudProbability) || 0)
  const name = firstName()

  const tiles = [
    { label: 'Fraud flagged', value: totalFraud },
    { label: 'Card checks', value: byType.creditcard ?? 0 },
    { label: 'Wallet / UPI checks', value: byType.paysim ?? 0 },
    { label: 'Banking checks', value: byType.banksim ?? 0 },
  ]

  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-3xl mb-6 text-white" style={{ boxShadow: '0 24px 50px -24px rgba(6,78,59,.6)' }}>
      <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
      <div
        className="absolute -top-16 -right-10 w-72 h-72 rounded-full animate-float"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.50), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full animate-float"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35), transparent 70%)', animationDelay: '-4s' }}
      />
      <div
        className="absolute top-12 left-8 w-44 h-44 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.20), transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      <div className="relative p-8">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/15"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: level.color }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: level.color }} />
                </span>
                {level.label}
              </span>
              {updatedAt && (
                <span className="text-xs text-emerald-100/70">
                  Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <p className="text-sm text-emerald-200/90 mb-1">Fraud detection overview</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
              {greeting()}
              {name ? `, ${name}` : ''}
            </h1>
            <p className="mt-3 text-emerald-50/80 text-sm max-w-md">
              <span className="text-white font-semibold">
                <AnimatedNumber value={totalChecked} />
              </span>{' '}
              transactions analyzed
              {totalChecked > 0 && (
                <>
                  {' '}
                  · <span className="text-white font-semibold">{flagRate.toFixed(1)}%</span> flagged
                </>
              )}
            </p>
          </div>

          <div
            className="lg:col-span-2 rounded-2xl p-4 border border-white/15"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-100/80">Recent risk trend</span>
              <span className="text-[11px] text-emerald-100/50">last {Math.max(recent.length, 0)} checks</span>
            </div>
            <HeroSpark points={recent} />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-2xl p-4 border border-white/15 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              style={{ background: 'rgba(255,255,255,0.09)' }}
            >
              <div className="font-serif text-3xl font-semibold">
                <AnimatedNumber value={t.value} />
              </div>
              <div className="text-xs text-emerald-100/75 mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- cards ---------- */
function RiskDonut({ transactions }) {
  const ready = useReady(150)
  const buckets = { low: 0, medium: 0, high: 0 }
  transactions.forEach((t) => {
    const p = t.fraudProbability ?? 0
    if (p < 0.3) buckets.low++
    else if (p < 0.7) buckets.medium++
    else buckets.high++
  })
  const total = transactions.length

  const segments = [
    { key: 'low', label: 'Low', color: RISK_COLORS.low, value: buckets.low },
    { key: 'medium', label: 'Medium', color: RISK_COLORS.medium, value: buckets.medium },
    { key: 'high', label: 'High', color: RISK_COLORS.high, value: buckets.high },
  ]

  const R = 54
  const CIRC = 2 * Math.PI * R
  let offsetAcc = 0

  return (
    <Card delay={80}>
      <SectionTitle title="Risk overview" subtitle="By probability tier, not just pass/fail" />

      <div className="flex items-center gap-6 mt-5">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#E8F0EC" strokeWidth="14" />
            {total > 0 &&
              segments.map((seg, i) => {
                const dash = (seg.value / total) * CIRC
                const el = (
                  <circle
                    key={seg.key}
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={`${ready ? dash : 0} ${CIRC}`}
                    strokeDashoffset={-offsetAcc}
                    style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)', transitionDelay: `${i * 120}ms` }}
                  />
                )
                offsetAcc += dash
                return el
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-2xl font-semibold text-ink">{total}</span>
            <span className="text-[10px] text-ink-muted">checked</span>
          </div>
        </div>

        <div className="flex-1 space-y-3 text-sm">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
              <span className="text-ink-muted">{seg.label}</span>
              <span className="ml-auto text-ink font-medium">{seg.value}</span>
              <span className="w-10 text-right text-xs text-ink-muted">
                {total ? `${Math.round((seg.value / total) * 100)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TypeBarChart({ byType }) {
  const ready = useReady(150)
  const entries = Object.entries(byType)
  const max = entries.length ? Math.max(...entries.map(([, v]) => v), 1) : 1

  return (
    <Card delay={160}>
      <SectionTitle title="Checks by channel" subtitle="Volume per payment type" />

      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-12">No data yet</p>
      ) : (
        <div className="flex items-end justify-around gap-4 h-40 mt-5">
          {entries.map(([type, count], i) => {
            const heightPct = (count / max) * 100
            return (
              <div key={type} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-sm font-semibold text-ink">{count}</span>
                <div className="w-full flex items-end h-28 rounded-xl bg-green-soft/60 overflow-hidden">
                  <div
                    className="w-full rounded-xl"
                    style={{
                      height: ready ? `${Math.max(heightPct, 4)}%` : '0%',
                      background: BAR_GRADIENTS[i % BAR_GRADIENTS.length],
                      transition: 'height 900ms cubic-bezier(0.22,1,0.36,1)',
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
                <span className="text-xs text-ink-muted text-center">
                  {PAYMENT_TYPE_LABELS[type]?.split(' / ')[0] || type}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function TrendSparkline({ transactions }) {
  const ready = useReady(200)
  const recent = transactions.slice(0, 10).reverse()
  const points = recent.map((t) => (t.fraudProbability ?? 0) * 100)

  const w = 280
  const h = 100
  const pad = 8

  const path =
    points.length > 1
      ? points
          .map((v, i) => {
            const x = pad + (i / (points.length - 1)) * (w - pad * 2)
            const y = h - pad - (v / 100) * (h - pad * 2)
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
          })
          .join(' ')
      : ''

  const avg = points.length ? (points.reduce((a, b) => a + b, 0) / points.length).toFixed(1) : '0.0'

  return (
    <Card delay={240}>
      <SectionTitle title="Detection trend" subtitle="Fraud probability, last 10 checks" />
      <p className="mt-3 mb-3 font-serif text-3xl font-semibold text-ink">
        {avg}%<span className="ml-1 text-xs text-ink-muted font-sans font-normal">avg</span>
      </p>

      {points.length > 1 ? (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
            fill="url(#trendFill)"
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 900ms ease 300ms' }}
          />
          <path
            d={path}
            pathLength="1"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 1, strokeDashoffset: ready ? 0 : 1, transition: 'stroke-dashoffset 1300ms ease' }}
          />
        </svg>
      ) : (
        <p className="text-sm text-ink-muted text-center py-8">Not enough data yet</p>
      )}
    </Card>
  )
}

function ChannelsList({ byType, transactions }) {
  const ready = useReady(200)
  const channels = ['creditcard', 'paysim', 'banksim']
  const max = Math.max(...channels.map((c) => byType[c] || 0), 1)

  return (
    <Card delay={400}>
      <SectionTitle title="Payment channels" subtitle="Checks and flagged transactions per channel" />

      <div className="mt-4 space-y-4">
        {channels.map((ch) => {
          const count = byType[ch] || 0
          const fraudCount = transactions.filter((t) => t.paymentType === ch && t.isFraud).length
          const theme = CHANNEL_THEME[ch]
          return (
            <div key={ch}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.chip}`}>
                    {CHANNEL_ICONS[ch]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{PAYMENT_TYPE_LABELS[ch]}</div>
                    <div className="text-xs text-ink-muted">{count} checked</div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    fraudCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-bg-subtle text-ink-muted'
                  }`}
                >
                  {fraudCount} flagged
                </span>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-green-soft/70 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: ready ? `${(count / max) * 100}%` : '0%',
                    background: theme.gradient,
                    transition: 'width 900ms cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <Link
        to="/transactions"
        className="block text-center mt-6 py-2.5 text-sm font-medium text-green bg-green-soft hover:bg-green hover:text-white rounded-xl transition-colors duration-200"
      >
        View all transactions
      </Link>
    </Card>
  )
}

function RecentAlerts({ transactions, savedAnswers }) {
  const flagged = transactions.filter((t) => t.isFraud).slice(0, 4)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const merged = { ...savedAnswers, ...answers }

  const sendFeedback = async (txId, verdict) => {
    setAnswers((a) => ({ ...a, [txId]: verdict }))
    setErrors((e) => ({ ...e, [txId]: '' }))

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: txId, verdict }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setAnswers((a) => {
        const next = { ...a }
        delete next[txId]
        return next
      })
      setErrors((e) => ({ ...e, [txId]: 'Could not save. Please try again.' }))
    }
  }

  return (
    <Card delay={480}>
      <SectionTitle
        title="Recent alerts"
        subtitle="Tell us if an alert was right"
        action={
          <Link to="/alerts" className="text-xs font-medium text-green hover:text-green-strong">
            View all
          </Link>
        }
      />

      {flagged.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-10">No fraud flagged yet</p>
      ) : (
        <div className="mt-4 space-y-3">
          {flagged.map((tx) => {
            const verdict = merged[tx.id]
            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl border border-rose-100 transition-colors hover:border-rose-200"
                style={{ background: 'linear-gradient(135deg, rgba(255,241,242,0.9), rgba(255,255,255,0.9))' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      !
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {PAYMENT_TYPE_LABELS[tx.paymentType] || tx.paymentType}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {tx.amount} · {tx.checkedAt}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 whitespace-nowrap">
                    {formatPercent(tx.fraudProbability)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-rose-100">
                  {verdict ? (
                    <span className="text-xs text-ink-muted">
                      Thanks. You marked this as{' '}
                      <span className="font-medium text-ink">{verdict === 'confirmed' ? 'fraud' : 'not fraud'}</span>.
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-ink-muted mr-1">Was this right?</span>
                      <button
                        onClick={() => sendFeedback(tx.id, 'confirmed')}
                        className="px-2.5 py-1 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-lg transition-colors"
                      >
                        Yes, fraud
                      </button>
                      <button
                        onClick={() => sendFeedback(tx.id, 'not_fraud')}
                        className="px-2.5 py-1 text-xs font-medium text-ink-muted border border-line bg-white hover:bg-bg-subtle rounded-lg transition-colors"
                      >
                        Not fraud
                      </button>
                    </>
                  )}
                  {errors[tx.id] && <span className="text-xs text-rose-600">{errors[tx.id]}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-72 mb-6 rounded-3xl" />
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-56 mb-5" />
      <div className="grid lg:grid-cols-2 gap-5">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </>
  )
}

/* ---------- page ---------- */
export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [savedAnswers, setSavedAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = () => {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const options = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
    let cancelled = false

    const load = async () => {
      try {
        const [statsRes, txRes, fbRes] = await Promise.all([
          fetch(`${API}/api/dashboard/stats`, options),
          fetch(`${API}/api/transactions`, options),
          fetch(`${API}/api/feedback`, options).catch(() => null),
        ])
        if (cancelled) return

        if (statsRes.status === 401 || txRes.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
          return
        }

        if (!statsRes.ok) throw new Error('Could not load dashboard data')
        const statsData = await statsRes.json()
        setStats(statsData.stats)

        if (txRes.ok) {
          const txData = await txRes.json()
          setTransactions(txData.transactions || [])
        }

        if (fbRes && fbRes.ok) {
          const fbData = await fbRes.json()
          const map = {}
          ;(fbData.feedback || []).forEach((f) => {
            map[String(f.transactionId)] = f.verdict
          })
          setSavedAnswers(map)
        }

        setUpdatedAt(new Date())
      } catch (err) {
        if (cancelled) return
        setError(
          err.name === 'AbortError'
            ? 'The server took too long to answer. Please try again.'
            : err.message || 'Could not load dashboard data'
        )
      } finally {
        clearTimeout(timer)
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [navigate, reloadKey])

  return (
    <DashboardLayout>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={retry}
                className="px-4 py-1.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {stats && <HeroBanner stats={stats} transactions={transactions} updatedAt={updatedAt} />}

          {stats && !error && (
            <>
              <div className="grid lg:grid-cols-3 gap-5 mb-5">
                <RiskDonut transactions={transactions} />
                <TypeBarChart byType={stats?.byType || {}} />
                <TrendSparkline transactions={transactions} />
              </div>

              <div className="mb-5">
                <TimeOfDayChart transactions={transactions} delay={320} />
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <ChannelsList byType={stats?.byType || {}} transactions={transactions} />
                <RecentAlerts transactions={transactions} savedAnswers={savedAnswers} />
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  )
}