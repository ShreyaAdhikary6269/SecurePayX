import { Link, useNavigate, useLocation } from 'react-router-dom'
import SecurityBackground from '../Securitybackground'

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
    <div className="min-h-screen bg-bg text-ink font-sans flex relative isolate">
      <style>{`
        @keyframes drift-slow { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(40px,-30px) scale(1.08);} }
        @keyframes drift-slower { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-50px,40px) scale(1.1);} }
        .animate-drift-slow { animation: drift-slow 16s ease-in-out infinite; }
        .animate-drift-slower { animation: drift-slower 20s ease-in-out infinite; }
        .bg-security-grid {
          background-image: linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px);
          background-size: 48px 48px;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-drift-slow, .animate-drift-slower { animation: none; }
        }
      `}</style>

      {/* Same background as Home / Login / Dashboard, softened */}
      <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none">
        <SecurityBackground className="absolute inset-0" density={60} />
      </div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-security-grid opacity-[0.015]" />
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-green/5 blur-3xl animate-drift-slow" />
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-green-bright/5 blur-3xl animate-drift-slower" />
      </div>

      <aside className="w-64 shrink-0 border-r border-line bg-white flex flex-col justify-between h-screen sticky top-0 z-30">
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

      <main className="flex-1 min-w-0 relative z-10">
        <div className="px-10 py-10 max-w-6xl">{children}</div>
      </main>
    </div>
  )
}