import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from './store'
import Login from './pages/Login'
import CallbackPage from './pages/CallbackPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import GraphPage from './pages/GraphPage'
import MyWorkPage from './pages/MyWorkPage'
import TeamPage from './pages/TeamPage'
import SchedulePage from './pages/SchedulePage'

const TABS = { schedule: '스케줄', graph: '의존성 흐름', mywork: '내 작업', team: '팀 대시보드' } as const
type TabKey = keyof typeof TABS

function MainApp() {
  const [tab, setTab] = useState<TabKey>('schedule')

  return (
    <StoreProvider>
      <div className="app">
        <Sidebar tab={tab} onTab={setTab} />
        <div className="main">
          <Topbar crumb={TABS[tab]} />
          <div className="content">
            {tab === 'graph' && <GraphPage />}
            {tab === 'mywork' && <MyWorkPage />}
            {tab === 'team' && <TeamPage />}
            {tab === 'schedule' && <SchedulePage />}
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/*" element={<PrivateRoute><MainApp /></PrivateRoute>} />
    </Routes>
  )
}
