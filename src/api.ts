const BASE = import.meta.env.VITE_API_URL

// 로그인 상태로 저장한 모든 키를 비우고 로그인 화면으로 보낸다.
// BE는 무상태 JWT라 서버 호출 없이 클라이언트에서 토큰만 버리면 된다.
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('orgData')
  localStorage.removeItem('projectId')
  const loginPath = `${import.meta.env.BASE_URL}login`
  if (!window.location.pathname.endsWith('/login')) {
    window.location.replace(loginPath)
  }
}

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
    // 토큰 만료/무효(40100~40104) 등 401이면 세션을 비우고 재로그인으로 유도한다.
    // (이게 없으면 만료된 토큰이 localStorage에 남아 PrivateRoute를 통과 → 로그인 화면에 못 가는 잠김 상태가 됨)
    if (res.status === 401) {
      logout()
    }
    throw Object.assign(new Error(err.message ?? 'API error'), { code: err.code, status: res.status })
  }
  const json = await res.json()
  return (json.data !== undefined ? json.data : json) as T
}
