import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CallbackPage() {
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      navigate('/login')
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/auth/github/callback?code=${code}`)
      .then(res => {
        if (!res.ok) throw new Error('login failed')
        return res.json()
      })
      .then(data => {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/connect')
      })
      .catch(() => navigate('/login'))
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 15 }}>로그인 중...</div>
    </div>
  )
}
