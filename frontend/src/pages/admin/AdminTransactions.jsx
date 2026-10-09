import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet } from '../../components/admin/AdminApi'
import { Badge, Pager, TYPE_LABELS, fmtDateTime, formatPercent } from '../../components/admin/AdminUi'

const PAGE_SIZE = 20
const EXPORT_PAGE_SIZE = 100
const MAX_EXPORT_PAGES = 50 // 5,000 rows

const EMPTY_FILTERS = {
  search: '',
  paymentType: '',
  result: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
}

function buildParams(f) {
  const p = {}
  if (f.search.trim()) p.search = f.search.trim()
  if (f.paymentType) p.paymentType = f.paymentType
  if (f.result === 'flagged') p.isFraud = 'true'
  if (f.result === 'cleared') p.isFraud = 'false'
  if (f.from) p.from = f.from
  if (f.to) p.to = f.to
  if (f.minAmount !== '') p.minAmount = f.minAmount
  if (f.maxAmount !== '') p.maxAmount = f.maxAmount
  return p
}

// Quote a CSV cell, and defuse spreadsheet formulas (=, +, -, @ at the start)
function csvCell(value) {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30'

export default function AdminTransactions() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [paging, setPaging] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const requestId = useRef(0)

  const setField = (name, value) => setFilters((f) => ({ ...f, [name]: value }))

  // Apply filters a moment after the last change
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied(filters)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [filters])

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')

    try {
      const data = await adminGet('transactions', { ...buildParams(applied), page, limit: PAGE_SIZE }, navigate)
      if (id !== requestId.current || !data) return

      if (data.transactions.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }

      setRows(data.transactions)
      setPaging({ total: data.total, totalPages: data.totalPages })
    } catch (err) {
      if (id === requestId.current) setError(err.message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [applied, page, navigate])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    setExporting(true)
    setError('')
    setNotice('')

    try {
      const all = []
      const base = buildParams(applied)
      let p = 1
      let totalPages = 1

      while (p <= totalPages && p <= MAX_EXPORT_PAGES) {
        const data = await adminGet('transactions', { ...base, page: p, limit: EXPORT_PAGE_SIZE }, navigate)
        if (!data) return
        all.push(...data.transactions)
        totalPages = data.totalPages
        p += 1
      }

      if (all.length === 0) {
        setNotice('Nothing to export for these filters.')
        return
      }

      const header = ['Transaction ID', 'User', 'Payment type', 'Amount', 'Fraud probability', 'Result', 'Threshold', 'Date']
      const lines = all.map((t) =>
        [
          t.id,
          t.userEmail,
          TYPE_LABELS[t.paymentType] || t.paymentType,
          t.amount,
          t.fraudProbability != null ? `${(t.fraudProbability * 100).toFixed(4)}%` : '',
          t.isFraud ? 'Flagged' : 'Cleared',
          t.thresholdUsed ?? '',
          new Date(t.createdAt).toISOString(),
        ]
          .map(csvCell)
          .join(',')
      )
      const csv = [header.map(csvCell).join(','), ...lines].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `admin-transactions-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setNotice(
        totalPages > MAX_EXPORT_PAGES
          ? `Exported the first ${all.length} rows (limit reached). Narrow the filters to export the rest.`
          : `Exported ${all.length} rows.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const hasFilters = Object.values(filters).some((v) => v !== '')

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={exportCsv}
            disabled={exporting || paging.total === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green hover:bg-green-strong rounded-lg disabled:opacity-40 transition-colors"
          >
            {exporting ? 'Exporting…' : 'Download CSV'}
          </button>
        </div>
      </div>
      <p className="text-ink-muted mb-6">Every check made by every user. Raw model inputs are never shown here.</p>

      <div className="bg-white border border-line rounded-xl p-4 mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Search by user email</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Payment type</label>
          <select value={filters.paymentType} onChange={(e) => setField('paymentType', e.target.value)} className={inputClass}>
            <option value="">All types</option>
            <option value="creditcard">Credit / debit card</option>
            <option value="paysim">Mobile wallet / UPI</option>
            <option value="banksim">Banking</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Result</label>
          <select value={filters.result} onChange={(e) => setField('result', e.target.value)} className={inputClass}>
            <option value="">All results</option>
            <option value="flagged">Flagged</option>
            <option value="cleared">Cleared</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">From</label>
          <input type="date" value={filters.from} onChange={(e) => setField('from', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">To</label>
          <input type="date" value={filters.to} onChange={(e) => setField('to', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Min amount</label>
          <input
            type="number"
            min="0"
            value={filters.minAmount}
            onChange={(e) => setField('minAmount', e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Max amount</label>
          <input
            type="number"
            min="0"
            value={filters.maxAmount}
            onChange={(e) => setField('maxAmount', e.target.value)}
            placeholder="Any"
            className={inputClass}
          />
        </div>
        {hasFilters && (
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-sm font-medium text-ink-muted hover:text-red-600 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="mb-5 p-3 bg-green-soft border border-green/20 text-green text-sm rounded-lg flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-green hover:text-green-strong" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">Loading transactions…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            {hasFilters ? 'No transactions match these filters.' : 'No transactions have been checked yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/50">
                  <th className="px-4 py-3 font-normal">User</th>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Fraud probability</th>
                  <th className="px-4 py-3 font-normal">Result</th>
                  <th className="px-4 py-3 font-normal">Threshold</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="px-4 py-3 text-ink">{t.userEmail}</td>
                    <td className="px-4 py-3 text-ink-muted">{TYPE_LABELS[t.paymentType] || t.paymentType}</td>
                  <td className="px-4 py-3 text-ink">₹{Number(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatPercent(t.fraudProbability)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={t.isFraud ? 'red' : 'green'}>{t.isFraud ? 'Flagged' : 'Cleared'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{t.thresholdUsed != null ? t.thresholdUsed : '-'}</td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pager
          page={page}
          totalPages={paging.totalPages}
          total={paging.total}
          noun={paging.total === 1 ? 'transaction' : 'transactions'}
          onPage={setPage}
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}