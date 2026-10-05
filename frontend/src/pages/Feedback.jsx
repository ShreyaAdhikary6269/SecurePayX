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
  const color = tone === 'danger' ? 'text-red-700' : tone === 'amber' ? 'text-amber-700' : 'text-ink'
  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
      <div className="text-xs font-medium text-ink-muted mb-2">{label}</div>
      <div className={`font-serif text-3xl font-semibold ${color}`}>{value}</div>
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
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Alert feedback</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-6 max-w-2xl">
        Tell us whether each fraud alert was right. Your answers show the team how often alerts are wrong. They do not
        change your account, and the model is not retrained automatically.
      </p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {notice && (
        <div className="mb-5 p-3 bg-green-soft border border-green/20 text-green text-sm rounded-lg flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-green hover:text-green-strong" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {!loading && !feedbackAvailable && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
          Your earlier answers cannot be loaded right now, so alerts you answered before may appear as unanswered. New
          answers are still saved.
        </div>
      )}

      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Flagged alerts" value={alerts.length} />
          <StatCard label="Waiting for your answer" value={counts.waiting} tone={counts.waiting > 0 ? 'amber' : undefined} />
          <StatCard label="You said: fraud" value={counts.confirmed} />
          <StatCard label="You said: not fraud" value={counts.notFraud} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setVisible(PAGE_SIZE)
            }}
            className={`px-3.5 py-1.5 text-sm border rounded-full transition-colors ${
              tab === t.id ? 'border-green text-green bg-green-soft' : 'border-line text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && alerts.length === 0 && <p className="text-sm text-ink-muted">Loading your alerts…</p>}

      {!loading && shown.length === 0 && (
        <div className="border border-line border-dashed rounded-xl p-10 text-center">
          <p className="text-sm text-ink-muted max-w-md mx-auto">{emptyText}</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((a) => {
          const verdict = answers[a.id]
          const isSaving = !!saving[a.id]
          const showButtons = !verdict || editing.has(a.id)

          return (
            <div
              key={a.id}
              className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  !
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">
                    {TYPE_LABELS[a.paymentType] || a.paymentType} · {a.amount}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    Fraud probability {formatPercent(a.fraudProbability)} · {a.checkedAt}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {showButtons ? (
                  <>
                    <span className="text-xs text-ink-muted mr-1">Was this alert right?</span>
                    <button
                      onClick={() => submit(a.id, 'confirmed')}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-green border border-green/30 bg-white hover:bg-green hover:text-white rounded-md disabled:opacity-50 transition-colors"
                    >
                      Yes, it was fraud
                    </button>
                    <button
                      onClick={() => submit(a.id, 'not_fraud')}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-ink-muted border border-line bg-white hover:bg-bg-subtle rounded-md disabled:opacity-50 transition-colors"
                    >
                      No, not fraud
                    </button>
                    {isSaving && <span className="text-xs text-ink-muted">Saving…</span>}
                    {verdict && !isSaving && (
                      <button onClick={() => stopEditing(a.id)} className="text-xs text-ink-muted hover:text-ink">
                        Cancel
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium border rounded-full ${
                        verdict === 'confirmed'
                          ? 'bg-green-soft text-green border-green/20'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      You said: {verdict === 'confirmed' ? 'fraud' : 'not fraud'}
                    </span>
                    <button onClick={() => startEditing(a.id)} className="text-xs text-green hover:text-green-strong font-medium">
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
        <div className="text-center mt-5">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green transition-colors"
          >
            Show more ({filtered.length - visible} left)
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}