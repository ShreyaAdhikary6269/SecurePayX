import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from './Dashboardlayout'

const API = 'http://localhost:5000'
const PAGE_SIZE = 12

const TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

const TABS = [
  { id: 'all', label: 'All flagged alerts' },
  { id: 'waiting', label: 'Waiting for my answer' },
  { id: 'answered', label: 'Answered' },
]

function formatPercent(p) {
  if (p == null || Number.isNaN(Number(p))) return '-'
  const pct = Number(p) * 100
  if (pct < 0.01) return '<0.01%'
  if (pct > 99.99) return '>99.99%'
  return `${pct.toFixed(2)}%`
}

function StatCard({ label, value, tone }) {
  const color = 
    tone === 'danger' ? 'text-rose-600' : 
    tone === 'amber' ? 'text-amber-600' : 
    tone === 'emerald' ? 'text-emerald-600' : 
    'text-slate-900'

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:border-emerald-500/40 transition-colors">
      <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-3xl font-semibold tracking-tight ${color}`}>{value}</div>
    </div>
  )
}

export default function Feedback() {
  const navigate = useNavigate()

  const [alerts, setAlerts] = useState([])
  const [answers, setAnswers] = useState({}) // transaction id -> 'confirmed' | 'not_fraud'
  const [feedbackAvailable, setFeedbackAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [saving, setSaving] = useState({})
  const [editing, setEditing] = useState(() => new Set())

  const goToLogin = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }, [navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const [txRes, fbRes] = await Promise.all([
        fetch(`${API}/api/transactions`, { headers }),
        fetch(`${API}/api/feedback`, { headers }),
      ])

      if (txRes.status === 401 || fbRes.status === 401) {
        goToLogin()
        return
      }
      if (!txRes.ok) throw new Error('Could not load your transactions')

      const txData = await txRes.json()
      setAlerts((txData.transactions || []).filter((t) => t.isFraud))

      if (fbRes.ok) {
        const fbData = await fbRes.json()
        const map = {}
        ;(fbData.feedback || []).forEach((f) => {
          map[String(f.transactionId)] = f.verdict
        })
        setAnswers(map)
        setFeedbackAvailable(true)
      } else {
        setAnswers({})
        setFeedbackAvailable(false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [goToLogin])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (id, verdict) => {
    setSaving((s) => ({ ...s, [id]: true }))
    setError('')
    setNotice('')
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: id, verdict }),
      })

      if (res.status === 401) {
        goToLogin()
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not save your answer')

      setAnswers((a) => ({ ...a, [id]: verdict }))
      setEditing((e) => {
        const next = new Set(e)
        next.delete(id)
        return next
      })
      setNotice(verdict === 'confirmed' ? 'Thanks. Marked as fraud.' : 'Thanks. Marked as not fraud.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving((s) => {
        const next = { ...s }
        delete next[id]
        return next
      })
    }
  }

  const startEditing = (id) => {
    setNotice('')
    setEditing((e) => new Set(e).add(id))
  }

  const stopEditing = (id) => {
    setEditing((e) => {
      const next = new Set(e)
      next.delete(id)
      return next
    })
  }

  const counts = useMemo(() => {
    let confirmed = 0
    let notFraud = 0
    alerts.forEach((a) => {
      if (answers[a.id] === 'confirmed') confirmed += 1
      if (answers[a.id] === 'not_fraud') notFraud += 1
    })
    return { confirmed, notFraud, waiting: alerts.length - confirmed - notFraud }
  }, [alerts, answers])

  const filtered = useMemo(() => {
    if (tab === 'waiting') return alerts.filter((a) => !answers[a.id])
    if (tab === 'answered') return alerts.filter((a) => answers[a.id])
    return alerts
  }, [alerts, answers, tab])

  const shown = filtered.slice(0, visible)

  const emptyText =
    alerts.length === 0
      ? 'No fraud alerts yet. When a transaction is flagged, you can tell us here whether the alert was right.'
      : tab === 'waiting'
      ? 'You have answered every alert. Thank you.'
      : 'You have not answered any alerts yet.'

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="cursor-default inline-block transition-transform duration-300 hover:translate-x-1.5 hover:scale-[1.01]">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Alert feedback
            </h1>
            <p className="text-slate-600 text-base font-normal max-w-2xl">
              Tell us whether each fraud alert was right. Your answers show the team how often alerts are wrong. They do not
              change your account, and the model is not retrained automatically.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30 disabled:opacity-45 transition-all shadow-sm active:scale-[0.98] w-fit"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 shadow-sm">
            <svg className="w-5 h-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm flex items-center justify-between gap-3 shadow-sm">
            <span className="font-medium">{notice}</span>
            <button onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-100/60 transition-colors" aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {!loading && !feedbackAvailable && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm shadow-sm">
            Your earlier answers cannot be loaded right now, so alerts you answered before may appear as unanswered. New
            answers are still saved.
          </div>
        )}

        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard label="Flagged alerts" value={alerts.length} />
            <StatCard label="Waiting for your answer" value={counts.waiting} tone={counts.waiting > 0 ? 'amber' : 'emerald'} />
            <StatCard label="You said: fraud" value={counts.confirmed} tone="emerald" />
            <StatCard label="You said: not fraud" value={counts.notFraud} />
          </div>
        )}

        {/* Prominent Tab Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {TABS.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  setVisible(PAGE_SIZE)
                }}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 active:scale-[0.98] shadow-sm ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/20 shadow-md'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {loading && alerts.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500 font-medium">
            Loading your alerts…
          </div>
        )}

        {!loading && shown.length === 0 && (
          <div className="border border-slate-200 border-dashed rounded-2xl p-12 text-center bg-white shadow-sm">
            <p className="text-sm text-slate-500 max-w-md mx-auto">{emptyText}</p>
          </div>
        )}

        <div className="space-y-4">
          {shown.map((a) => {
            const verdict = answers[a.id]
            const isSaving = !!saving[a.id]
            const showButtons = !verdict || editing.has(a.id)

            return (
              <div
                key={a.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-sm">
                    !
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {TYPE_LABELS[a.paymentType] || a.paymentType} · <span className="text-emerald-700 font-bold">{a.amount}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Fraud probability <span className="font-semibold text-slate-700">{formatPercent(a.fraudProbability)}</span> · {a.checkedAt}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {showButtons ? (
                    <>
                      <span className="text-xs font-medium text-slate-500 mr-1">Was this alert right?</span>
                      <button
                        onClick={() => submit(a.id, 'confirmed')}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
                      >
                        Yes, it was fraud
                      </button>
                      <button
                        onClick={() => submit(a.id, 'not_fraud')}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-xl disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
                      >
                        No, not fraud
                      </button>
                      {isSaving && <span className="text-xs text-slate-500 font-medium">Saving…</span>}
                      {verdict && !isSaving && (
                        <button onClick={() => stopEditing(a.id)} className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1">
                          Cancel
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium border rounded-full shadow-sm ${
                          verdict === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${verdict === 'confirmed' ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                        You said: {verdict === 'confirmed' ? 'fraud' : 'not fraud'}
                      </span>
                      <button onClick={() => startEditing(a.id)} className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 underline underline-offset-2">
                        Change answer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length > visible && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30 transition-all shadow-sm active:scale-[0.98]"
            >
              Show more ({filtered.length - visible} left)
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}