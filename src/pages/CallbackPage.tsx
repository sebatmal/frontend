import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      navigate('/')
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/auth/github/callback?code=${code}`)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('token', data.token)
        navigate('/')
      })
      .catch(() => navigate('/'))
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 15 }}>로그인 중...</div>
    </div>
  )
}
