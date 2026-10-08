import React from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import NotificationBell from '../components/Notificationbell'
import ChatWidget from '../components/Chatwidget'
import AlertToaster from '../components/Alerttoaster'
import SecurityBackground from '../components/Securitybackground'

/* ---------- icons ---------- */
function Icon({ children, className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

const OverviewIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
)
const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3 20 6v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)
const TransactionsIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h13l-3-3" />
    <path d="M20 17H7l3 3" />
  </Icon>
)
const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Icon>
)
const ReportsIcon = (p) => (
  <Icon {...p}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </Icon>
)
const FeedbackIcon = (p) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </Icon>
)
const UploadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </Icon>
)
const UserIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </Icon>
)
const LogoutIcon = (p) => (
  <Icon {...p}>
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="m10 8-4 4 4 4" />
    <path d="M6 12h10" />
  </Icon>
)
const ChevronIcon = (p) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)
const AdminIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3 20 6v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3Z" />
    <circle cx="12" cy="11" r="2" />
    <path d="M12 13v3" />
  </Icon>
)

/* ---------- menu ---------- */
const GROUPS = [
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: OverviewIcon },
      { to: '/check', label: 'Check transaction', icon: CheckIcon },
      { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
      { to: '/alerts', label: 'Fraud alerts', icon: AlertIcon },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: ReportsIcon },
      { to: '/feedback', label: 'Feedback', icon: FeedbackIcon },
      { to: '/upload', label: 'Batch upload', icon: UploadIcon },
    ],
  },
  {
    title: 'Account',
    items: [{ to: '/profile', label: 'Profile', icon: UserIcon }],
  },
]

const ALL_LINKS = GROUPS.flatMap((g) => g.items)

/* ---------- helpers ---------- */
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function displayName(email) {
  const base = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim()
  if (!base) return 'Account'
  return base.replace(/\b\w/g, (c) => c.toUpperCase())
}

function initialsOf(email) {
  const parts = displayName(email).split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

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

/* ---------- sidebar ---------- */
function NavItem({ to, label, icon: ItemIcon, active, collapsed, index }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      style={{ animationDelay: `${index * 35}ms` }}
      className={`group relative flex items-center rounded-xl py-2.5 mb-1 text-[14.5px] font-medium transition-colors duration-200 animate-fade-in-left ${
        collapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
      } ${
        active
          ? 'text-white font-semibold bg-emerald-600 shadow-sm shadow-emerald-200'
          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-300" />}
      <ItemIcon
        className={`relative w-[19px] h-[19px] shrink-0 transition-colors ${
          active ? 'text-white' : 'text-emerald-500 group-hover:text-emerald-600'
        }`}
      />
      {!collapsed && <span className="relative truncate">{label}</span>}
    </Link>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = React.useState(() => localStorage.getItem('sidebarCollapsed') === '1')
  const [user, setUser] = React.useState(readStoredUser)

  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0')
  }, [collapsed])

  // Ask the server who is signed in (also confirms the admin role)
  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    let cancelled = false

    fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.user) setUser(data.user)
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

  const isAdmin = !!(user && user.role === 'admin')
  const email = (user && user.email) || ''
  const name = displayName(email)
  const initials = initialsOf(email)

  let counter = 0

  return (
    <aside
      className={`shrink-0 h-screen sticky top-0 z-30 flex flex-col border-r border-slate-200 transition-[width] duration-300 ease-out bg-white ${
        collapsed ? 'w-[84px]' : 'w-[272px]'
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 z-40 w-6 h-6 rounded-full bg-white text-slate-600 border border-slate-200 shadow-md flex items-center justify-center hover:text-emerald-600 hover:scale-110 transition-all"
      >
        <ChevronIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      <Link to="/dashboard" className={`flex items-center py-6 ${collapsed ? 'justify-center' : 'gap-3 px-5'}`}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg,#10B981,#0D9488)',
            boxShadow: '0 8px 20px -6px rgba(16,185,129,0.4)',
          }}
        >
          <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
            <path d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z" stroke="white" strokeWidth="1.7" />
            <path d="M11 15.5 14.3 19 21.5 11.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-serif text-lg font-semibold text-slate-900 leading-tight">SecurePayX</div>
            <div className="text-[11px] tracking-wide text-slate-500">Fraud intelligence</div>
          </div>
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group, gi) => (
          <div key={group.title}>
            {collapsed ? (
              gi > 0 && <div className="mx-3 my-3 border-t border-slate-200" />
            ) : (
              <div className="px-3.5 mt-4 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group.title}
              </div>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                collapsed={collapsed}
                index={counter++}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Signed-in account */}
      <div className="p-3 border-t border-slate-100">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative" title={email}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#10B981,#0D9488)' }}
              >
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                title="Admin area"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 hover:bg-slate-100 transition-colors"
              >
                <AdminIcon className="w-[19px] h-[19px]" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogoutIcon className="w-[19px] h-[19px]" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-3 border border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#10B981,#0D9488)' }}
                >
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
                <div className="text-xs text-slate-500 truncate" title={email}>
                  {email || 'Signed in'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span
                className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isAdmin ? 'Administrator' : 'Member'}
              </span>
              <span className="text-[11px] text-slate-400">Signed in</span>
            </div>

            <div className="mt-3 flex gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  <AdminIcon className="w-4 h-4" />
                  Admin area
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg border border-slate-200 bg-white hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              >
                <LogoutIcon className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ---------- background ---------- */
// Memoised, so page changes and sidebar clicks never redraw it.
// The glows are plain gradients (no blur filters), which keeps the page responsive.
const Background = React.memo(function Background() {
  return (
    <>
      {/* Same connected-dots background as Home, but softer */}
      <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none">
        <SecurityBackground className="absolute inset-0" density={60} />
      </div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-security-grid opacity-[0.015]" />
        <div
          className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full animate-drift-slow"
          style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.07), transparent 70%)' }}
        />
        <div
          className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full animate-drift-slower"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07), transparent 70%)' }}
        />
      </div>
    </>
  )
})

/* ---------- layout ---------- */
// True when a page is already inside the persistent shell below
const ShellContext = React.createContext(false)

function Chrome({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Check the login on every page change
  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate, location.pathname])

  // Start each page at the top
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const current = ALL_LINKS.find((l) => l.to === location.pathname)
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen font-sans flex relative isolate text-slate-800 bg-bg">
      <style>{`
        @keyframes fade-in-up { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
        @keyframes fade-in-left { from { opacity:0; transform:translateX(-10px);} to {opacity:1; transform:translateX(0);} }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(16px,-20px,0); } }
        @keyframes drift-slow { 0%,100% { transform:translate3d(0,0,0) scale(1);} 50% { transform:translate3d(40px,-30px,0) scale(1.08);} }
        @keyframes drift-slower { 0%,100% { transform:translate3d(0,0,0) scale(1);} 50% { transform:translate3d(-50px,40px,0) scale(1.1);} }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-fade-in-left { animation: fade-in-left 0.45s ease-out both; }
        .animate-pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
        .animate-float { animation: float 10s ease-in-out infinite; will-change: transform; }
        .animate-drift-slow { animation: drift-slow 16s ease-in-out infinite; will-change: transform; }
        .animate-drift-slower { animation: drift-slower 20s ease-in-out infinite; will-change: transform; }
        .bg-security-grid {
          background-image: linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .row-hover { transition: background-color 0.15s ease; }
        .row-hover:hover { background-color: #F0F7F3; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-fade-in-left, .animate-float,
          .animate-drift-slow, .animate-drift-slower { animation: none; }
        }
      `}</style>

      <Background />
      <Sidebar />

      <main className="flex-1 min-w-0 relative overflow-x-clip">
        <div className="relative z-10">
          <header
            className="sticky top-0 z-20 flex items-center justify-between gap-3 px-8 py-3.5 border-b border-slate-200/60"
            style={{ background: 'rgba(255,255,255,0.92)' }}
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{today}</div>
              <div className="text-[15px] font-semibold text-slate-800">{current ? current.label : 'SecurePayX'}</div>
            </div>
            <NotificationBell />
          </header>

          {/* Extra space at the bottom keeps the floating chat button off the last buttons */}
          <div className="px-8 pt-8 pb-28 max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </main>

      <AlertToaster />
      <ChatWidget />
    </div>
  )
}

// Used as a layout route in App.jsx: the sidebar, header, chat and background
// stay mounted while only the page content changes.
export function DashboardShell() {
  return (
    <Chrome>
      <ShellContext.Provider value={true}>
        <Outlet />
      </ShellContext.Provider>
    </Chrome>
  )
}

// Pages still wrap themselves in <DashboardLayout>. Inside the shell it adds nothing.
export default function DashboardLayout({ children }) {
  const inShell = React.useContext(ShellContext)
  if (inShell) return <>{children}</>
  return <Chrome>{children}</Chrome>
}