import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function BellIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

/**
 * Bell + badge + dropdown preview of the latest fraud alerts.
 * "Unread" is tracked client-side via a lastSeenAlertsAt timestamp in
 * localStorage, so no backend "read" flag is required — opening the
 * dropdown marks everything currently loaded as seen.
 *
 * Backend expectation: GET /api/alerts?limit=8  ->  { alerts: [
 *   { id, paymentType, amount, fraudProbability, createdAt }, ...
 * ] }
 * If that route doesn't exist yet, the bell just shows 0 quietly.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('lastSeenAlertsAt') || '0')
  const ref = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('http://localhost:5000/api/alerts?limit=8', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = alerts.filter((a) => new Date(a.createdAt).getTime() > Number(lastSeen)).length

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) {
      const now = String(Date.now())
      localStorage.setItem('lastSeenAlertsAt', now)
      setLastSeen(now)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-green-soft/60 transition-colors duration-200"
        aria-label="Fraud alert notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-xl shadow-xl shadow-black/5 overflow-hidden z-50 animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-sm font-semibold text-ink">Fraud alerts</span>
            <Link to="/alerts" onClick={() => setOpen(false)} className="text-xs text-green hover:text-green-strong font-medium">
              View all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-ink-muted text-center py-8">Loading…</p>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">No fraud alerts yet</p>
            ) : (
              alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-bg-subtle transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">!</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {PAYMENT_TYPE_LABELS[a.paymentType] || a.paymentType} · {a.amount}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {a.fraudProbability != null ? `${(a.fraudProbability * 100).toFixed(0)}% risk` : ''} · {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}