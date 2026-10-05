import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet } from '../../components/admin/AdminApi'
import { Badge, Pager, fmtDateTime } from '../../components/admin/AdminUi'

const PAGE_SIZE = 25

const ACTIONS = {
  'user.deactivate': { label: 'Deactivated a user', tone: 'red' },
  'user.reactivate': { label: 'Reactivated a user', tone: 'green' },
  'user.role_change': { label: 'Changed a role', tone: 'amber' },
}

function describe(action, details) {
  if (!details) return '-'
  if (action === 'user.role_change') return `${details.from} → ${details.to}`
  if (action === 'user.deactivate' || action === 'user.reactivate') {
    return `${details.from ? 'Active' : 'Deactivated'} → ${details.to ? 'Active' : 'Deactivated'}`
  }
  return JSON.stringify(details)
}

export default function AdminAuditLog() {
  const navigate = useNavigate()
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
      const data = await adminGet('audit-log', { page, limit: PAGE_SIZE }, navigate)
      if (id !== requestId.current || !data) return

      if (data.entries.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }

      setRows(data.entries)
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
        <h1 className="font-serif text-2xl text-ink">Audit log</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-6">
        A record of every change an admin makes: who did it, to whom, and when. Newest first. This log is kept in
        memory (the latest 500 entries), so it clears when the backend restarts.
      </p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">Loading audit log…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            No admin actions yet. Deactivating a user or changing a role on the Users page will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/50">
                  <th className="px-4 py-3 font-normal">When</th>
                  <th className="px-4 py-3 font-normal">Admin</th>
                  <th className="px-4 py-3 font-normal">Action</th>
                  <th className="px-4 py-3 font-normal">User affected</th>
                  <th className="px-4 py-3 font-normal">Change</th>
                  <th className="px-4 py-3 font-normal">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => {
                  const meta = ACTIONS[e.action] || { label: e.action, tone: 'gray' }
                  return (
                    <tr key={e.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
                      <td className="px-4 py-3 text-ink">{e.adminEmail}</td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink">{e.targetEmail || '-'}</td>
                      <td className="px-4 py-3 text-ink-muted">{describe(e.action, e.details)}</td>
                      <td className="px-4 py-3 text-ink-muted">{e.ip || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pager
          page={page}
          totalPages={paging.totalPages}
          total={paging.total}
          noun={paging.total === 1 ? 'entry' : 'entries'}
          onPage={setPage}
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}