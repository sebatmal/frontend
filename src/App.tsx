import { useState } from 'react'
import { StoreProvider } from './store'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import GraphPage from './pages/GraphPage'
import MyWorkPage from './pages/MyWorkPage'
import TeamPage from './pages/TeamPage'
import SchedulePage from './pages/SchedulePage'

const TABS = { graph: '의존성 흐름', mywork: '내 작업', team: '팀', schedule: '스케줄' } as const
type TabKey = keyof typeof TABS

export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('schedule')

  if (!user) return <Login onLogin={() => setUser('km')} />

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
