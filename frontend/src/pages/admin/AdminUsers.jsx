import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const API = 'http://localhost:5000'
const PAGE_SIZE = 15

// Returns true when the response means "go somewhere else" (and does it)
function authRedirect(res, navigate) {
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    return true
  }
  if (res.status === 403) {
    navigate('/dashboard')
    return true
  }
  return false
}

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '-')
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString() : 'Never')

function Badge({ children, tone }) {
  const tones = {
    green: 'bg-green-soft text-green border-green/20',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-bg-subtle text-ink-muted border-line',
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${tones[tone]}`}>
      {children}
    </span>
  )
}

export default function AdminUsers() {
  const navigate = useNavigate()

  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [paging, setPaging] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [working, setWorking] = useState(false)
  const requestId = useRef(0)

  // Who is logged in (so the admin cannot act on their own row)
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setMe(data.user))
      .catch(() => {})
  }, [])

  // Wait a moment after typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    if (status) params.set('status', status)

    try {
      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (id !== requestId.current) return
      if (authRedirect(res, navigate)) return

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not load users')

      // Landed on an empty page (for example after a filter): go back one page
      if (data.users.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }

      setUsers(data.users)
      setPaging({ total: data.total, totalPages: data.totalPages })
    } catch (err) {
      if (id === requestId.current) setError(err.message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, search, role, status, navigate])

  useEffect(() => {
    load()
  }, [load])

  const askToggleActive = (u) => {
    setNotice('')
    setConfirm(
      u.isActive
        ? {
            user: u,
            body: { isActive: false },
            title: `Deactivate ${u.email}?`,
            message:
              'They will be blocked immediately and cannot log in until you reactivate the account. Their data is kept.',
            confirmLabel: 'Deactivate',
            danger: true,
            doneText: 'was deactivated',
          }
        : {
            user: u,
            body: { isActive: true },
            title: `Reactivate ${u.email}?`,
            message: 'They will be able to log in again.',
            confirmLabel: 'Reactivate',
            danger: false,
            doneText: 'was reactivated',
          }
    )
  }

  const askToggleRole = (u) => {
    setNotice('')
    setConfirm(
      u.role === 'admin'
        ? {
            user: u,
            body: { role: 'user' },
            title: `Remove admin rights from ${u.email}?`,
            message: 'They will lose access to the admin area but keep their normal account.',
            confirmLabel: 'Remove admin',
            danger: true,
            doneText: 'is now a normal user',
          }
        : {
            user: u,
            body: { role: 'admin' },
            title: `Make ${u.email} an admin?`,
            message:
              'They will get full access to the admin area, including user management. Only do this for people you trust.',
            confirmLabel: 'Make admin',
            danger: true,
            doneText: 'is now an admin',
          }
    )
  }

  const applyChange = async () => {
    if (!confirm) return
    setWorking(true)
    setError('')

    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API}/api/admin/users/${confirm.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(confirm.body),
      })
      if (authRedirect(res, navigate)) return

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not update the user')

      setNotice(`${confirm.user.email} ${confirm.doneText}.`)
      setConfirm(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirm(null)
    } finally {
      setWorking(false)
    }
  }

  const hasFilters = searchInput || role || status

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setRole('')
    setStatus('')
    setPage(1)
  }

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-2xl text-ink">Users</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg hover:border-green hover:text-green disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="text-ink-muted mb-6">Search accounts, switch them off, and manage admin rights.</p>

      {/* Filters */}
      <div className="bg-white border border-line rounded-xl p-4 mb-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Search by email</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:border-green"
          >
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:border-green"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-ink-muted hover:text-red-600 transition-colors"
          >
            Clear filters
          </button>
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

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            {hasFilters ? 'No users match these filters.' : 'No users yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-bg-subtle/50">
                  <th className="px-4 py-3 font-normal">User</th>
                  <th className="px-4 py-3 font-normal">Role</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Checks / flagged</th>
                  <th className="px-4 py-3 font-normal">Joined</th>
                  <th className="px-4 py-3 font-normal">Last login</th>
                  <th className="px-4 py-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => {
                  const isMe = me && me.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="px-4 py-3 text-ink">
                        {u.email}
                        {isMe && <span className="ml-2 text-xs text-ink-muted">(you)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === 'admin' ? 'green' : 'gray'}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {u.checked} / <span className={u.flagged > 0 ? 'text-red-700' : ''}>{u.flagged}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-ink-muted">{fmtDateTime(u.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => askToggleRole(u)}
                            disabled={isMe}
                            title={isMe ? 'You cannot change your own role' : ''}
                            className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          </button>
                          <button
                            onClick={() => askToggleActive(u)}
                            disabled={isMe}
                            title={isMe ? 'You cannot deactivate your own account' : ''}
                            className={`px-3 py-1.5 text-xs font-medium border rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                              u.isActive
                                ? 'text-red-700 border-red-200 hover:bg-red-50'
                                : 'text-green border-green/30 hover:bg-green-soft'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {paging.total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm">
            <span className="text-ink-muted">
              Page {page} of {paging.totalPages} · {paging.total} {paging.total === 1 ? 'user' : 'users'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(paging.totalPages, p + 1))}
                disabled={page >= paging.totalPages || loading}
                className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-md hover:border-green hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? confirm.title : ''}
        message={confirm ? confirm.message : ''}
        confirmLabel={confirm ? confirm.confirmLabel : 'Confirm'}
        danger={confirm ? confirm.danger : false}
        busy={working}
        onConfirm={applyChange}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  )
}