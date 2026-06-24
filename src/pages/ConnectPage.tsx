import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

interface OrgItem {
  githubLogin: string
  avatarUrl: string
  description: string
}

export default function ConnectPage() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<OrgItem[]>('/organizations')
      .then(data => {
        setOrgs(data)
        if (data.length > 0) setSelected(data[0].githubLogin)
      })
      .catch(err => setError(err.message ?? 'org 목록을 불러오지 못했습니다.'))
      .finally(() => setLoadingOrgs(false))
  }, [])

  const handleConnect = async () => {
    if (!selected) return
    setConnecting(true)
    setError(null)
    try {
      const data: any = await apiFetch(`/organizations/${selected}/connect`, { method: 'POST' })
      localStorage.setItem('orgData', JSON.stringify(data))
      if (data.projects?.[0]?.id) {
        localStorage.setItem('projectId', String(data.projects[0].id))
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? '연결에 실패했습니다.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380, textAlign: 'center', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <img src="/frontend/logo.png" alt="DevFlow" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <b style={{ fontSize: 24, color: 'var(--gray-900)' }}>DevFlow</b>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 15, margin: '6px 0 24px', lineHeight: 1.5 }}>
          연결할 오가니제이션을 선택하세요.
        </p>

        <div className="card">
          {loadingOrgs ? (
            <div style={{ fontSize: 14, color: 'var(--gray-400)', padding: '12px 0' }}>목록 불러오는 중...</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {orgs.map(org => (
                  <div
                    key={org.githubLogin}
                    onClick={() => setSelected(org.githubLogin)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: `2px solid ${selected === org.githubLogin ? 'var(--primary)' : 'var(--gray-200)'}`, cursor: 'pointer', background: selected === org.githubLogin ? 'var(--primary-light, #f3f0ff)' : '#fff', transition: 'border-color 0.15s' }}
                  >
                    <img src={org.avatarUrl} alt={org.githubLogin} style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{org.githubLogin}</div>
                      {org.description && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{org.description}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {error && <div style={{ fontSize: 13, color: '#e03131', marginBottom: 12, textAlign: 'left' }}>{error}</div>}

              <button
                onClick={handleConnect}
                disabled={!selected || connecting}
                style={{ width: '100%', height: 48, border: 'none', borderRadius: 12, background: !selected || connecting ? 'var(--gray-300)' : 'var(--primary)', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: !selected || connecting ? 'not-allowed' : 'pointer' }}
              >
                {connecting ? '연결 중...' : '프로젝트 시작 →'}
              </button>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>멤버·레포지토리를 자동으로 불러옵니다</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
