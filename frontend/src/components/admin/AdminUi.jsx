export const TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

export const fmtDateTime = (v) => (v ? new Date(v).toLocaleString() : '-')

// Probability (0 to 1) as a percentage with two decimals
export function formatPercent(p) {
  if (p == null || Number.isNaN(Number(p))) return '-'
  const pct = Number(p) * 100
  if (pct < 0.01) return '<0.01%'
  if (pct > 99.99) return '>99.99%'
  return `${pct.toFixed(2)}%`
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    green: 'bg-green-soft text-green border-green/20',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-bg-subtle text-ink-muted border-line',
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Pager({ page, totalPages, total, noun, onPage, loading }) {
  if (!total) return null
  const btn =
    'px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm">
      <span className="text-ink-muted">
        Page {page} of {totalPages} · {total} {noun}
      </span>
      <div className="flex gap-2">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1 || loading} className={btn}>
          Previous
        </button>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className={btn}
        >
          Next
        </button>
      </div>
    </div>
  )
}