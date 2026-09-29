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
 * Bar chart of checked-transaction volume by hour of day, colored by that
 * hour's fraud ratio. Purely client-side — aggregates the `transactions`
 * prop already fetched by Dashboard, no new backend field needed beyond
 * each transaction having a `createdAt` timestamp.
 */
export default function TimeOfDayChart({ transactions }) {
  const buckets = bucketByHour(transactions)
  const maxTotal = Math.max(...buckets.map((b) => b.total), 1)

  return (
    <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-ink mb-1">Fraud by time of day</h3>
      <p className="text-xs text-ink-muted mb-5">Checked transactions by hour — fraud tends to cluster at unusual hours</p>

      {transactions.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-10">No data yet</p>
      ) : (
        <div className="flex items-end gap-[3px] h-32">
          {buckets.map((b, hour) => {
            const heightPct = (b.total / maxTotal) * 100
            const fraudRatio = b.total > 0 ? b.fraud / b.total : 0
            const color = fraudRatio > 0.5 ? '#DC2626' : fraudRatio > 0.2 ? '#F59E0B' : '#059669'
            return (
              <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{ height: `${Math.max(heightPct, b.total > 0 ? 6 : 2)}%`, backgroundColor: b.total > 0 ? color : '#F0F0F0' }}
                />
                <div className="absolute -top-8 hidden group-hover:block px-2 py-1 bg-ink text-white text-[10px] rounded whitespace-nowrap z-10 pointer-events-none">
                  {hour}:00 — {b.total} checked, {b.fraud} fraud
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-between text-[10px] text-ink-muted mt-2">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  )
}