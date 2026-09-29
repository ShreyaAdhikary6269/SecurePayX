import { useEffect, useState } from 'react'

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

function parseAmount(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return Number.isNaN(num) ? 0 : num
}

/**
 * Self-contained filter bar for a transactions / fraud-alerts table.
 * Manages its own filter state and reports the filtered list back via
 * onFilteredChange whenever anything changes (including once on mount).
 *
 * Works alongside the existing payment-type filter — this only adds
 * search-by-ID, date range, and amount range on top of it.
 *
 * Usage:
 *   const [filtered, setFiltered] = useState(transactions)
 *   <TransactionFilters transactions={transactions} onFilteredChange={setFiltered} />
 *   // ...render your existing table using `filtered` instead of `transactions`
 *
 * Expects each transaction to have: id, amount (number or formatted
 * string like "Rs 12,450" — both work), paymentType, createdAt (ISO string).
 */
export default function TransactionFilters({ transactions = [], onFilteredChange }) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  useEffect(() => {
    const q = search.trim().toLowerCase()
    const min = minAmount !== '' ? parseFloat(minAmount) : null
    const max = maxAmount !== '' ? parseFloat(maxAmount) : null
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null // inclusive end of day

    const result = transactions.filter((t) => {
      if (q) {
        const idMatch = String(t.id ?? '').toLowerCase().includes(q)
        const typeMatch = (PAYMENT_TYPE_LABELS[t.paymentType] || t.paymentType || '').toLowerCase().includes(q)
        if (!idMatch && !typeMatch) return false
      }

      const amt = parseAmount(t.amount)
      if (min != null && amt < min) return false
      if (max != null && amt > max) return false

      if (t.createdAt) {
        const ts = new Date(t.createdAt).getTime()
        if (from != null && ts < from) return false
        if (to != null && ts > to) return false
      }

      return true
    })

    onFilteredChange(result)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, minAmount, maxAmount, transactions])

  const hasActiveFilters = search || dateFrom || dateTo || minAmount || maxAmount

  const clearAll = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
  }

  return (
    <div className="bg-white border border-line rounded-xl p-4 mb-5 flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Transaction ID or payment type"
          className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Min amount</label>
        <input
          type="number"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          placeholder="0"
          className="w-28 px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Max amount</label>
        <input
          type="number"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          placeholder="Any"
          className="w-28 px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
        />
      </div>

      {hasActiveFilters && (
        <button onClick={clearAll} className="px-3 py-2 text-sm font-medium text-ink-muted hover:text-red-600 transition-colors">
          Clear filters
        </button>
      )}
    </div>
  )
}