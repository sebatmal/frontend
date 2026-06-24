import { project, members, ME } from '../mock/data'
import { IconGraph, IconUser, IconTeam, IconCal } from './icons'

const NAV = [
  { key: 'graph', label: '의존성 흐름', Icon: IconGraph },
  { key: 'mywork', label: '내 작업', Icon: IconUser, badge: 2 },
  { key: 'team', label: '팀', Icon: IconTeam },
  { key: 'schedule', label: '스케줄', Icon: IconCal },
] as const

export default function Sidebar({ tab, onTab }: { tab: string; onTab: (k: any) => void }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/logo.png" alt="DevFlow" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div><b>DevFlow</b><br /><span>v0.1.0</span></div>
      </div>

      <div className="side-sec">Project</div>
      <div className="proj">
        <b>{project.name}</b>
        <div className="sp">● {project.sprint}</div>
      </div>

      <nav className="nav">
        {NAV.map(({ key, label, Icon, badge }: any) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => onTab(key)}>
            <Icon /> {label}
            {badge && <span className="badge-mini">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="side-sec">Team</div>
      <div>
        {members.map((m) => (
          <div className="member" key={m.id}>
            <span className="avatar" style={{ width: 28, height: 28, background: m.color }}>{m.initials}</span>
            <div>
              <div className="nm">{m.name}{m.id === ME ? ' (나)' : ''}</div>
              <div className="role">{m.role}</div>
            </div>
            <span className="live" />
          </div>
        ))}
      </div>
    </aside>
  )
}
