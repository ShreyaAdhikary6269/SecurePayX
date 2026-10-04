import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  // checking | admin | notAdmin | loggedOut | error
  const [status, setStatus] = useState('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatus('loggedOut')
      return
    }

    let cancelled = false
    setStatus('checking')

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setStatus('loggedOut')
          return
        }
        if (res.status === 403) {
          setStatus('notAdmin')
          return
        }
        if (!res.ok) {
          setStatus('error')
          return
        }
        const data = await res.json()
        setStatus(data.user && data.user.role === 'admin' ? 'admin' : 'notAdmin')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-ink-muted text-sm">
        Checking access…
      </div>
    )
  }

  if (status === 'loggedOut') return <Navigate to="/login" replace />
  if (status === 'notAdmin') return <Navigate to="/dashboard" replace />

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-center px-6">
        <p className="text-ink mb-1 font-medium">Could not check admin access</p>
        <p className="text-sm text-ink-muted mb-5">Make sure the backend is running on port 5000.</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="px-4 py-2 text-sm font-medium text-white bg-green hover:bg-green-strong rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return <Outlet />
}