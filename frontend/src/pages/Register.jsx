import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-ink font-sans">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm mb-1.5 text-ink-muted">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-ink-muted">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
                placeholder="********"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-ink-muted">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg border border-line text-ink text-sm focus:outline-none focus:border-green"
                placeholder="********"
              />
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
