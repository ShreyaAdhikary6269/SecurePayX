import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function ShieldMark() {
  return (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z"
        stroke="#14532D"
        strokeWidth="1.5"
      />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke="#14532D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LINKS = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/check', label: 'Check transaction' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/alerts', label: 'Fraud alerts' },
  { to: '/upload', label: 'Batch upload' },
  { to: '/reports', label: 'Reports' },
  { to: '/profile', label: 'Profile' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-bg flex flex-col justify-between h-screen sticky top-0">
      <div>
        <Link to="/" className="flex items-center gap-2 px-5 py-5 border-b border-line">
          <ShieldMark />
          <span className="font-serif text-base text-ink">SecurePayX</span>
        </Link>
        <nav className="py-4">
          {LINKS.map((link, i) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`relative block px-5 py-2.5 text-sm transition-all duration-200 animate-fade-in-left group ${
                  isActive ? 'text-ink bg-bg-subtle' : 'text-ink-muted hover:text-ink hover:bg-bg-subtle'
                }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-0.5 bg-green origin-center transition-transform duration-200 ${
                    isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                  }`}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="text-left px-5 py-4 text-sm text-ink-muted hover:text-ink border-t border-line transition-colors"
      >
        Sign out
      </button>
    </aside>
  );
}

/**
 * Wrap any authenticated page's content with this layout to get the
 * sidebar (with links to every page) automatically. Also redirects to
 * /login if there's no token in localStorage.
 *
 * Usage:
 *   export default function Transactions() {
 *     return (
 *       <DashboardLayout>
 *         <h1>Transactions</h1>
 *         ...
 *       </DashboardLayout>
 *     );
 *   }
 */
export default function Dashboardlayout({ children }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        .animate-fade-in-left { animation: fade-in-left 0.4s ease-out forwards; }
        .animate-pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
        .row-hover { transition: background-color 0.15s ease; }
        .row-hover:hover { background-color: #F5F9F6; }
      `}</style>
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-5xl">{children}</main>
    </div>
  );
}