const BASE = import.meta.env.VITE_API_URL

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? 'API error'), { code: err.code, status: res.status })
  }
  const json = await res.json()
  return (json.data !== undefined ? json.data : json) as T
}
