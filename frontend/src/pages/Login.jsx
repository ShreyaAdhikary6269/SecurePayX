import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SecurityBackground from '../components/Securitybackground';

function ShieldMark() {
  return (
    <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2 27 6.5V15c0 8-4.7 13.4-11 15-6.3-1.6-11-7-11-15V6.5L16 2Z"
        stroke="#14532D"
        strokeWidth="1.5"
      />
      <path d="M11 15.5 14.3 19 21.5 11.5" stroke="#14532D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoleToggle({ role, setRole }) {
  return (
    <div>
      <span className="block text-sm mb-1.5 text-ink-muted">Sign in as</span>
      <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 border border-line">
        {['user', 'admin'].map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={`py-2.5 text-sm font-medium capitalize transition-colors ${
              role === r ? 'bg-green text-white' : 'bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = !!(location.state && location.state.registered);

  const [email, setEmail] = useState((location.state && location.state.email) || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState((location.state && location.state.role) || 'user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const actualRole = (data.user && data.user.role) || 'user';
      if (actualRole !== role) {
        throw new Error(`This account is not registered as ${role}. Select "${actualRole}" and try again.`);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate(actualRole === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Could not reach the server. Make sure the backend is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green';

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-ink font-sans relative isolate overflow-hidden">
      <SecurityBackground className="fixed inset-0 -z-10" density={90} />
      <style>{`
        @keyframes drift-slow { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(40px,-30px) scale(1.08);} }
        @keyframes drift-slower { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-50px,40px) scale(1.1);} }
        .animate-drift-slow { animation: drift-slow 16s ease-in-out infinite; }
        .animate-drift-slower { animation: drift-slower 20s ease-in-out infinite; }
        .bg-security-grid {
          background-image: linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-security-grid opacity-[0.03]" />
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-green/10 blur-3xl animate-drift-slow" />
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-green-bright/10 blur-3xl animate-drift-slower" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 font-serif text-xl text-ink mb-6">
          <ShieldMark />
          <span>SecurePayX</span>
        </Link>
        <h2 className="font-serif text-2xl text-ink">Sign in to your account</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Or{' '}
          <Link to="/register" className="text-green hover:text-green-strong underline underline-offset-4">
            create a new account
          </Link>
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-line py-8 px-4 sm:px-10 shadow-[0_30px_80px_-30px_rgba(5,150,105,0.3)]">
          {justRegistered && !error && (
            <div className="mb-4 p-3 bg-green-soft border border-green/20 text-green text-xs text-center">
              Account created. You can sign in now.
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <RoleToggle role={role} setRole={setRole} />

            <div>
              <label htmlFor="email" className="block text-sm mb-1.5 text-ink-muted">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1.5 text-ink-muted">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs text-ink-muted hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm text-white bg-green hover:bg-green-strong transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : `Sign in as ${role}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}