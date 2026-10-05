export const API = 'http://localhost:5000'

// GET /api/admin/<path>. Returns the JSON, or null when it already redirected
// (not logged in -> login page, not an admin -> dashboard).
export async function adminGet(path, params, navigate) {
  const token = localStorage.getItem('token')
  const query = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''

  const res = await fetch(`${API}/api/admin/${path}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    return null
  }
  if (res.status === 403) {
    navigate('/dashboard')
    return null
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}