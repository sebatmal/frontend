import { useState, useEffect, useRef } from 'react'
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
  // 'auto' = 마지막 org 자동 연결 시도 중(목록 안 보임), 'picker' = 직접 선택
  const [mode, setMode] = useState<'auto' | 'picker'>('picker')
  const [autoOrg, setAutoOrg] = useState<string | null>(null)
  const started = useRef(false)

  // org 선택 → connect: 멤버·레포를 받아 캐시하고 본화면으로.
  // orgData 는 클라이언트 캐시라 매 연결마다 새로 받아 최신화한다.
  const connectTo = async (org: string): Promise<boolean> => {
    setConnecting(true)
    setError(null)
    try {
      const data: any = await apiFetch(`/organizations/${org}/connect`, { method: 'POST' })
      localStorage.setItem('orgData', JSON.stringify(data))
      localStorage.setItem('lastOrg', org)
      // 기존에 보던 프로젝트가 새 목록에도 있으면 유지, 아니면 첫 번째로.
      const projects: { id: number }[] = data.projects ?? []
      const savedId = localStorage.getItem('projectId')
      const keep = savedId && projects.some(p => String(p.id) === savedId)
      if (!keep) {
        if (projects[0]?.id) localStorage.setItem('projectId', String(projects[0].id))
        else localStorage.removeItem('projectId')
      }
      navigate('/', { replace: true })
      return true
    } catch (err: any) {
      setError(err.message ?? '연결에 실패했습니다.')
      return false
    } finally {
      setConnecting(false)
    }
  }

  const loadOrgs = () => {
    setLoadingOrgs(true)
    apiFetch<OrgItem[]>('/organizations')
      .then(data => {
        setOrgs(data)
        setSelected(prev => prev ?? (data[0]?.githubLogin ?? null))
      })
      .catch(err => setError(err.message ?? 'org 목록을 불러오지 못했습니다.'))
      .finally(() => setLoadingOrgs(false))
  }

  // 마지막으로 연결했던 org 가 있으면 화면 없이 자동 연결(데이터 재로드).
  // 없거나 실패하면 선택 화면으로.
  useEffect(() => {
    if (started.current) return
    started.current = true
    const last = localStorage.getItem('lastOrg')
    if (last) {
      setMode('auto')
      setAutoOrg(last)
      connectTo(last).then(ok => {
        if (!ok) { setMode('picker'); loadOrgs() }
      })
    } else {
      setMode('picker')
      loadOrgs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (mode === 'auto') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 15 }}>
          <b style={{ color: 'var(--gray-800)' }}>{autoOrg}</b> 오가니제이션에 연결 중...
        </div>
      </div>
    )
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
                {orgs.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--gray-400)', padding: '12px 0' }}>연결 가능한 오가니제이션이 없습니다.</div>
                )}
              </div>

              {error && <div style={{ fontSize: 13, color: '#e03131', marginBottom: 12, textAlign: 'left' }}>{error}</div>}

              <button
                onClick={() => selected && connectTo(selected)}
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
