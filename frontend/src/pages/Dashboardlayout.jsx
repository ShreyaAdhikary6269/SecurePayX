import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import SecurityBackground from '../components/Securitybackground'
import NotificationBell from '../components/Notificationbell'
import ChatWidget from '../components/Chatwidget'
import AlertToaster from '../components/Alerttoaster'

function ShieldMark({ className = 'w-7 h-7', stroke = '#059669' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 32 32" fill="none">
      <path d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z" stroke={stroke} strokeWidth="1.5" />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const LINKS = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/check', label: 'Check transaction' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/alerts', label: 'Fraud alerts' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/upload', label: 'Batch upload' },
  { to: '/reports', label: 'Reports' },
  { to: '/profile', label: 'Profile' },
]

// Returns true if there is no token or its `exp` time has passed.
function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAdmin, setIsAdmin] = React.useState(false)

  // Ask the server whether this account is an admin (decides if the Admin link shows)
  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    let cancelled = false

    fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.user && data.user.role === 'admin') setIsAdmin(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className="w-64 shrink-0 border-r border-line bg-white flex flex-col justify-between h-screen sticky top-0 z-20">
      <div className="overflow-y-auto">
        <Link to="/" className="flex items-center gap-2.5 px-6 py-6 border-b border-line group">
          <ShieldMark className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-serif text-lg font-semibold text-ink">SecurePayX</span>
        </Link>
        <nav className="py-5 px-3">
          {LINKS.map((link, i) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`relative flex items-center gap-2 px-4 py-3 mb-1 text-[15px] font-medium rounded-lg transition-all duration-200 animate-fade-in-left ${
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
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-3 mb-2 text-[15px] font-medium text-green bg-green-soft hover:bg-green hover:text-white rounded-lg transition-colors duration-200"
          >
            Admin area
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg border border-line hover:border-red-200 transition-colors duration-200"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex relative isolate">
      <style>{`
        @keyframes fade-in-up { from { opacity:0; transform:translateY(12px);} to {opacity:1; transform:translateY(0);} }
        @keyframes fade-in-left { from { opacity:0; transform:translateX(-8px);} to {opacity:1; transform:translateX(0);} }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        .animate-fade-in-left { animation: fade-in-left 0.4s ease-out forwards; }
        .animate-pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
        .row-hover { transition: background-color 0.15s ease; }
        .row-hover:hover { background-color: #F4FAF7; }
        .bg-security-grid {
          background-image: linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-security-grid opacity-[0.025]" />
          <SecurityBackground className="opacity-40" density={35} linkDistance={110} />
        </div>

        <div className="relative z-10">
          <header className="flex items-center justify-end gap-3 px-10 py-4 border-b border-line bg-white/70 backdrop-blur-sm">
            <NotificationBell />
          </header>
          <div className="px-10 py-10 max-w-6xl">{children}</div>
        </div>
      </main>

      <AlertToaster />
      <ChatWidget />
    </div>
  )
}