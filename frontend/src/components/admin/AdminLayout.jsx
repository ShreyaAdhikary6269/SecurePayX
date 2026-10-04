import { Link, useNavigate, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/feedback', label: 'Feedback' },
  { to: '/admin/models', label: 'Models' },
  { to: '/admin/audit-log', label: 'Audit log' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex">
      <aside className="w-64 shrink-0 border-r border-line bg-white flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="px-6 py-6 border-b border-line">
            <div className="font-serif text-lg font-semibold text-ink">SecurePayX</div>
            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green bg-green-soft rounded">
              Admin
            </span>
          </div>

          <nav className="py-5 px-3">
            {LINKS.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-4 py-3 mb-1 text-[15px] font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-green text-white shadow-md shadow-green/25'
                      : 'text-ink-muted hover:text-ink hover:bg-green-soft/60'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="px-3 pb-4">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 mb-2 text-[15px] font-medium text-ink-muted hover:text-ink hover:bg-green-soft/60 rounded-lg transition-colors duration-200"
          >
            ← Back to app
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-[15px] font-medium text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg border border-line hover:border-red-200 transition-colors duration-200"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-10 py-10 max-w-6xl">{children}</div>
      </main>
    </div>
  )
}