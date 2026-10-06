import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const COMMON_PASSWORDS = new Set([
  'password1',
  'password12',
  'password123',
  'password1234',
  'qwerty123',
  'qwerty1234',
  'abc12345',
  'abcd1234',
  'iloveyou1',
  'admin1234',
  'welcome123',
  'letmein123',
  'a1234567',
  'a12345678',
  '12345678a',
  '123456789a',
]);

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

// The same rules the server enforces (the server is always the final judge)
function getRules(password, email) {
  const lower = password.toLowerCase();
  const namePart = email.split('@')[0].trim().toLowerCase();
  const typed = password.length > 0;

  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      problem: 'Password must be at least 8 characters',
      ok: password.length >= 8 && password.length <= 128,
    },
    {
      id: 'letter',
      label: 'At least one letter',
      problem: 'Password must contain at least one letter',
      ok: /[A-Za-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least one number',
      problem: 'Password must contain at least one number',
      ok: /\d/.test(password),
    },
    {
      id: 'common',
      label: 'Not a very common password',
      problem: 'That password is too common. Please choose another one',
      ok: typed && !COMMON_PASSWORDS.has(lower),
    },
    {
      id: 'name',
      label: 'Does not contain your email name',
      problem: 'Password must not contain your email name',
      ok: typed && !(namePart.length >= 4 && lower.includes(namePart)),
    },
  ];
}

function getStrength(password, rules) {
  if (!password) return { level: 0, label: '' };
  if (!rules.every((r) => r.ok)) return { level: 1, label: 'Weak' };

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 3) return { level: 2, label: 'Fair' };
  if (points === 4) return { level: 3, label: 'Good' };
  return { level: 4, label: 'Strong' };
}

const BAR_COLORS = ['bg-line', 'bg-red-500', 'bg-amber-500', 'bg-green/70', 'bg-green'];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const rules = useMemo(() => getRules(password, email), [password, email]);
  const strength = useMemo(() => getStrength(password, rules), [password, rules]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    const failedRule = rules.find((r) => !r.ok);
    if (failedRule) {
      return setError(failedRule.problem);
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login', { state: { registered: true, email: cleanEmail } });
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

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      className="absolute inset-y-0 right-0 px-3 text-xs text-ink-muted hover:text-ink"
      aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
    >
      {showPassword ? 'Hide' : 'Show'}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 text-ink font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 font-serif text-xl text-ink mb-6">
          <ShieldMark />
          <span>SecurePayX</span>
        </Link>
        <h2 className="font-serif text-2xl text-ink">Create a new account</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-green hover:text-green-strong underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg border border-line py-8 px-4 sm:px-10">
          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister} noValidate>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                  placeholder="Choose a strong password"
                />
                {toggleButton}
              </div>

              {password && (
                <div className="mt-3">
                  <div className="flex gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          n <= strength.level ? BAR_COLORS[strength.level] : 'bg-line'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-ink-muted">
                    Strength: <span className="font-medium text-ink">{strength.label}</span>
                  </p>
                </div>
              )}

              <ul className="mt-3 space-y-1">
                {rules.map((r) => (
                  <li key={r.id} className={`text-xs flex items-center gap-2 ${r.ok ? 'text-green' : 'text-ink-muted'}`}>
                    <span aria-hidden="true" className="w-3 text-center">
                      {r.ok ? '✓' : '○'}
                    </span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm mb-1.5 text-ink-muted">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                  placeholder="Type it again"
                />
              </div>
              {confirmPassword && (
                <p className={`mt-1.5 text-xs ${confirmPassword === password ? 'text-green' : 'text-red-600'}`}>
                  {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm text-white bg-green hover:bg-green-strong transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}