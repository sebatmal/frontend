import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { StoreProvider } from './store'
import Login from './pages/Login'
import CallbackPage from './pages/CallbackPage'
import ConnectPage from './pages/ConnectPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import GraphPage from './pages/GraphPage'
import MyWorkPage from './pages/MyWorkPage'
import TeamPage from './pages/TeamPage'
import SchedulePage from './pages/SchedulePage'
import { apiFetch } from './api'
import type { User, ApiProject, ApiMember } from './types'

const TABS = { schedule: '스케줄', graph: '의존성 흐름', mywork: '내 작업', team: '팀 대시보드' } as const
type TabKey = keyof typeof TABS

function getOrgProjects(): ApiProject[] {
  const raw = localStorage.getItem('orgData')
  if (!raw) return []
  try { return JSON.parse(raw)?.projects ?? [] } catch { return [] }
}

// connect 결과(orgData)는 클라이언트 캐시라 새 기기·캐시 삭제·로그아웃 시 사라진다.
// 토큰만 있고 org 연결이 없으면 앱 본화면 대신 /connect 로 보내 연결 로직을 다시 태운다.
function hasOrgConnection(): boolean {
  const raw = localStorage.getItem('orgData')
  if (!raw) return false
  try { return Array.isArray(JSON.parse(raw)?.projects) } catch { return false }
}

function MainApp() {
  const [tab, setTab] = useState<TabKey>('schedule')
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(() => {
    const c = localStorage.getItem('user')
    return c ? JSON.parse(c) : null
  })

  const orgProjects = getOrgProjects()

  const projectId = (() => {
    const saved = localStorage.getItem('projectId')
    if (saved) return saved
    const first = orgProjects[0]?.id
    if (first) { localStorage.setItem('projectId', String(first)); return String(first) }
    return null
  })()

  const [project, setProject] = useState<ApiProject | null>(null)
  const [members, setMembers] = useState<ApiMember[]>([])

  useEffect(() => {
    apiFetch<User>('/me')
      .then(u => { setUser(u); localStorage.setItem('user', JSON.stringify(u)) })
      .catch(err => {
        if (err.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
        }
      })
  }, [])

  useEffect(() => {
    if (!projectId) return
    setProject(null)
    setMembers([])
    apiFetch<ApiProject>(`/projects/${projectId}`).then(setProject).catch(() => {})
    apiFetch<ApiMember[]>(`/projects/${projectId}/members`).then(setMembers).catch(() => {})
  }, [projectId])

  return (
    <StoreProvider projectId={projectId} apiMembers={members} userId={user?.id ?? null}>
      <div className="app">
        <Sidebar
          tab={tab} onTab={setTab}
          allProjects={orgProjects}
          members={members}
          userId={user?.id ?? null}
        />
        <div className="main">
          <Topbar crumb={TABS[tab]} user={user} project={project} />
          <div className="content">
            {tab === 'graph' && <GraphPage />}
            {tab === 'mywork' && <MyWorkPage />}
            {tab === 'team' && <TeamPage />}
            {tab === 'schedule' && <SchedulePage currentWeek={project?.currentWeek ?? 0} />}
          </div>
        </div>
      </div>
    </StoreProvider>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// 토큰은 있지만 org 연결이 없으면 /connect 로 — 연결 후 다시 들어오면 통과.
function RequireOrg({ children }: { children: React.ReactNode }) {
  return hasOrgConnection() ? <>{children}</> : <Navigate to="/connect" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/connect" element={<PrivateRoute><ConnectPage /></PrivateRoute>} />
      <Route path="/*" element={<PrivateRoute><RequireOrg><MainApp /></RequireOrg></PrivateRoute>} />
    </Routes>
  )
}
