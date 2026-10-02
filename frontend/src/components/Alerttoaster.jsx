import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const POLL_MS = 8000   // how often to check for new alerts
const TOAST_MS = 9000  // how long a popup stays on screen

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

export default function AlertToaster() {
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((key) => {
    clearTimeout(timers.current[key])
    delete timers.current[key]
    setToasts((prev) => prev.filter((t) => t.key !== key))
  }, [])

  const showToast = useCallback(
    (toast) => {
      setToasts((prev) => [toast, ...prev].slice(0, 3))
      timers.current[toast.key] = setTimeout(() => dismiss(toast.key), TOAST_MS)
    },
    [dismiss]
  )

  useEffect(() => {
    let stopped = false
    let pollTimer = null
    let seen = null // null until the first check has recorded existing alerts

    const keyOf = (a) => `${a.id}-${a.createdAt}`

    const poll = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      if (!document.hidden) {
        try {
          const res = await fetch('http://localhost:5000/api/alerts?limit=10', {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (res.status === 401) {
            stopped = true // session expired; the layout sends the user to login
            return
          }

          if (res.ok) {
            const data = await res.json()
            const alerts = data.alerts || []

            if (seen === null) {
              seen = new Set(alerts.map(keyOf)) // baseline: no popups for old alerts
            } else {
              const fresh = alerts.filter((a) => !seen.has(keyOf(a)))
              fresh.forEach((a) => seen.add(keyOf(a)))

              if (fresh.length > 0) {
                if (fresh.length > 2) {
                  showToast({
                    key: `batch-${Date.now()}`,
                    title: `${fresh.length} new fraud alerts`,
                    body: 'Open the alerts page to review them.',
                  })
                } else {
                  fresh.reverse().forEach((a) =>
                    showToast({
                      key: keyOf(a),
                      title: 'New fraud alert',
                      body: `${PAYMENT_TYPE_LABELS[a.paymentType] || a.paymentType} · ${a.amount}${
                        a.fraudProbability != null ? ` · ${(a.fraudProbability * 100).toFixed(0)}% risk` : ''
                      }`,
                    })
                  )
                }
                // Tell the notification bell to refresh its badge
                window.dispatchEvent(new Event('securepayx:new-alert'))
              }
            }
          }
        } catch {
          // backend unreachable: try again on the next round
        }
      }

      if (!stopped) pollTimer = setTimeout(poll, POLL_MS)
    }

    poll()

    return () => {
      stopped = true
      clearTimeout(pollTimer)
      Object.values(timers.current).forEach(clearTimeout)
      timers.current = {}
    }
  }, [showToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-[60] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)]">
      {toasts.map((t) => (
        <div
          key={t.key}
          role="alert"
          className="animate-fade-in-up flex items-start gap-3 p-4 bg-white border border-red-200 border-l-4 border-l-red-600 rounded-xl shadow-xl shadow-black/10"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            !
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{t.title}</div>
            <div className="text-xs text-ink-muted mt-0.5 break-words">{t.body}</div>
            <button
              onClick={() => {
                dismiss(t.key)
                navigate('/alerts')
              }}
              className="mt-2 text-xs font-medium text-green hover:text-green-strong"
            >
              View alerts
            </button>
          </div>
          <button
            onClick={() => dismiss(t.key)}
            aria-label="Dismiss alert"
            className="text-ink-muted hover:text-ink text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}