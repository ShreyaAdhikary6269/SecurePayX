import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'

export default function AdminRoute() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'checking' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setState({ status: 'loggedOut' })
      return
    }

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))

        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setState({ status: 'loggedOut' })
          return
        }
        if (!res.ok) {
          setState({ status: 'problem', text: `The server answered ${res.status}. ${data.message || ''}` })
          return
        }

        const user = data.user || {}
        setState({
          status: user.role === 'admin' ? 'admin' : 'notAdmin',
          email: user.email,
          role: user.role,
        })
      })
      .catch(() => setState({ status: 'problem', text: 'The backend is not reachable on port 5000.' }))
  }, [])

  const signOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (state.status === 'checking') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Checking access…</div>
  }
  if (state.status === 'loggedOut') return <Navigate to="/login" replace />
  if (state.status === 'admin') return <Outlet />

  const isProblem = state.status === 'problem'

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md bg-white border border-line rounded-xl shadow-sm p-8 text-center">
        <h1 className="font-serif text-xl font-semibold text-ink mb-3">
          {isProblem ? 'Could not check admin access' : 'This account is not an admin'}
        </h1>

        {isProblem ? (
          <p className="text-sm text-ink-muted mb-5">{state.text}</p>
        ) : (
          <p className="text-sm text-ink-muted mb-5">
            You are logged in as <b>{state.email || 'unknown'}</b>, role: <b>{state.role || 'none'}</b>.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-white bg-green hover:bg-green-strong rounded-lg"
          >
            Sign out and log in again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-lg"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}