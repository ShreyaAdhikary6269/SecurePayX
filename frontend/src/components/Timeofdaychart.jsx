import { useEffect, useState } from 'react'

const CARD_SHADOW = '0 1px 2px rgba(6,40,28,.05), 0 10px 30px -14px rgba(6,40,28,.16)'

function bucketByHour(transactions) {
  const buckets = Array.from({ length: 24 }, () => ({ total: 0, fraud: 0 }))
  transactions.forEach((t) => {
    if (!t.createdAt) return
    const hour = new Date(t.createdAt).getHours()
    buckets[hour].total += 1
    if (t.isFraud) buckets[hour].fraud += 1
  })
  return buckets
}

/**
 * Bar chart of checked-transaction volume by hour of day, coloured by that
 * hour's fraud ratio. Purely client-side: it uses the `transactions` prop
 * already fetched by Dashboard (each needs a `createdAt` timestamp).
 */
export default function TimeOfDayChart({ transactions, delay = 0 }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150)
    return () => clearTimeout(t)
  }, [])

  const buckets = bucketByHour(transactions)
  const maxTotal = Math.max(...buckets.map((b) => b.total), 1)

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="rounded-2xl border border-line bg-white/85 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-green/40"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">Fraud by time of day</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Checked transactions by hour. Fraud tends to cluster at unusual hours.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />
              Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
              Watch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#F43F5E' }} />
              High fraud ratio
            </span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">No data yet</p>
        ) : (
          <div className="flex items-end gap-[3px] h-32 mt-6">
            {buckets.map((b, hour) => {
              const heightPct = (b.total / maxTotal) * 100
              const fraudRatio = b.total > 0 ? b.fraud / b.total : 0
              const color = fraudRatio > 0.5 ? '#F43F5E' : fraudRatio > 0.2 ? '#F59E0B' : '#059669'
              const target = Math.max(heightPct, b.total > 0 ? 6 : 2)

              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: ready ? `${target}%` : '2%',
                      backgroundColor: b.total > 0 ? color : '#E8F0EC',
                      opacity: b.total > 0 ? 0.92 : 1,
                      transition: 'height 800ms cubic-bezier(0.22,1,0.36,1)',
                      transitionDelay: `${hour * 18}ms`,
                    }}
                  />
                  <div className="absolute -top-9 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md whitespace-nowrap z-10 pointer-events-none">
                    {hour}:00 · {b.total} checked, {b.fraud} fraud
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-between text-[10px] text-ink-muted mt-2">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
      </div>
    </div>
  )
}