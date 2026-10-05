import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'

const TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
}

function StatCard({ label, value, hint, tone = 'default' }) {
  const valueColor = tone === 'danger' ? 'text-red-700' : 'text-ink'
  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
      <div className="text-xs font-medium text-ink-muted mb-2">{label}</div>
      <div className={`font-serif text-3xl font-semibold ${valueColor}`}>{value}</div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </div>
  )
}

function dayLabel(dateString) {
  const d = new Date(`${dateString}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
}

function DailyChart({ days }) {
  const max = Math.max(...days.map((d) => d.checked), 1)

  return (
    <div className="flex items-end gap-3">
      {days.map((d) => {
        const barHeight = d.checked ? Math.max((d.checked / max) * 100, 6) : 2
        const flaggedShare = d.checked ? (d.flagged / d.checked) * 100 : 0
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center">
            <span className="text-xs text-ink-muted mb-1">{d.checked}</span>
            <div className="w-full h-28 flex items-end">
              <div
                className="w-full bg-green/70 rounded-t-md overflow-hidden flex flex-col justify-end"
                style={{ height: `${barHeight}%` }}
                title={`${d.date}: ${d.checked} checked, ${d.flagged} flagged`}
              >
                <div className="w-full bg-red-600" style={{ height: `${flaggedShare}%` }} />
              </div>
            </div>
            <span className="text-[11px] text-ink-muted mt-1">{dayLabel(d.date)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.status === 403) {
        navigate('/dashboard')
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not load statistics')
      setStats(data.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Admin overview</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-8">System-wide numbers across all users.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {loading && !stats && <p className="text-sm text-ink-muted">Loading statistics…</p>}

      {stats && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total users" value={stats.totalUsers} hint={`${stats.activeUsers} active`} />
            <StatCard label="Admins" value={stats.adminCount} />
            <StatCard label="Transactions checked" value={stats.totalTransactions} />
            <StatCard
              label="Flagged as fraud"
              value={stats.totalFlagged}
              hint={`${stats.fraudRate}% of all checks`}
              tone="danger"
            />
            <StatCard label="Checks today" value={stats.checksToday} />
            <StatCard label="Flagged today" value={stats.flaggedToday} tone="danger" />
          </div>

          <div className="bg-white border border-line rounded-xl p-6 shadow-sm mb-8">
            <h2 className="font-serif text-lg font-semibold text-ink mb-1">Last 7 days</h2>
            <p className="text-xs text-ink-muted mb-5">
              Green is every check, the red part is flagged. {stats.note}
            </p>
            <DailyChart days={stats.last7Days} />
          </div>

          <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="font-serif text-lg font-semibold text-ink">By payment type</h2>
            </div>
            {stats.byType.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-10">No transactions checked yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-muted">
                    <th className="px-6 py-3 font-normal">Type</th>
                    <th className="px-6 py-3 font-normal">Checked</th>
                    <th className="px-6 py-3 font-normal">Flagged</th>
                    <th className="px-6 py-3 font-normal">Average fraud probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.byType.map((t) => (
                    <tr key={t.paymentType}>
                      <td className="px-6 py-3 text-ink">{TYPE_LABELS[t.paymentType] || t.paymentType}</td>
                      <td className="px-6 py-3 text-ink-muted">{t.checked}</td>
                      <td className="px-6 py-3 text-red-700">{t.flagged}</td>
                      <td className="px-6 py-3 text-ink-muted">
                        {t.avgProbability != null ? `${(t.avgProbability * 100).toFixed(2)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}