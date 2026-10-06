import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet } from '../../components/admin/AdminApi'
import { Badge, Pager, TYPE_LABELS, fmtDateTime, formatPercent } from '../../components/admin/AdminUi'

const PAGE_SIZE = 20

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
      <div className="text-xs font-medium text-ink-muted mb-2">{label}</div>
      <div className={`font-serif text-3xl font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-ink'}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </div>
  )
}

export default function AdminFeedback() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [paging, setPaging] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')

    try {
      const data = await adminGet('feedback', { page, limit: PAGE_SIZE }, navigate)
      if (id !== requestId.current || !data) return

      if (data.feedback.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }

      setSummary(data.summary)
      setRows(data.feedback)
      setPaging({ total: data.total, totalPages: data.totalPages })
    } catch (err) {
      if (id === requestId.current) setError(err.message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, navigate])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Feedback</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-6">
        Users can mark a flagged alert as correctly flagged or as not fraud. This shows how often the model's alerts
        were judged wrong.
      </p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Feedback received" value={summary.total} />
          <StatCard label="Confirmed fraud" value={summary.confirmed} hint="The alert was right" />
          <StatCard label="Marked not fraud" value={summary.notFraud} hint="The alert was a false alarm" tone="danger" />
          <StatCard
            label="False-alarm rate"
            value={`${summary.falseAlarmRate}%`}
            hint="Share of rated alerts marked not fraud"
            tone={summary.falseAlarmRate > 0 ? 'danger' : undefined}
          />
        </div>
      )}

      <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">Loading feedback…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            No feedback yet. Users can answer "Was this right?" on flagged alerts in their dashboard.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/50">
                  <th className="px-4 py-3 font-normal">User</th>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Fraud probability</th>
                  <th className="px-4 py-3 font-normal">User's verdict</th>
                  <th className="px-4 py-3 font-normal">Transaction</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((f) => (
                  <tr key={f.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="px-4 py-3 text-ink">{f.userEmail}</td>
                    <td className="px-4 py-3 text-ink-muted">{TYPE_LABELS[f.paymentType] || f.paymentType || '-'}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatPercent(f.fraudProbability)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={f.verdict === 'confirmed' ? 'green' : 'amber'}>
                        {f.verdict === 'confirmed' ? 'Confirmed fraud' : 'Not fraud'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">#{f.transactionId}</td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{fmtDateTime(f.createdAt)}</td>
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
          noun="feedback entries"
          onPage={setPage}
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}