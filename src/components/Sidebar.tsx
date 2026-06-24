import { IconGraph, IconUser, IconTeam, IconCal } from './icons'
import type { ApiProject, ApiMember } from '../types'

const NAV = [
  { key: 'schedule', label: '스케줄', Icon: IconCal },
  { key: 'graph', label: '의존성 흐름', Icon: IconGraph },
  { key: 'mywork', label: '내 작업', Icon: IconUser, badge: 2 },
  { key: 'team', label: '팀 대시보드', Icon: IconTeam },
] as const

interface Props {
  tab: string
  onTab: (k: any) => void
  allProjects: ApiProject[]
  members: ApiMember[]
  userId: number | null
}

export default function Sidebar({ tab, onTab, allProjects, members, userId }: Props) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/frontend/logo.png" alt="DevFlow" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div><b>DevFlow</b><br /><span>v0.1.0</span></div>
      </div>

      <div className="side-sec">Project</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {allProjects.map(p => (
          <div key={p.id} className="proj">
            <b>{p.name}</b>
            {p.sprintLabel && <div className="sp">● {p.sprintLabel}</div>}
            {p.dDay != null && <div className="sp">D-{p.dDay}</div>}
          </div>
        ))}
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
        {members.map(m => {
          const isMe = m.userId === userId
          return (
            <div className="member" key={m.id}>
              {m.avatarUrl
                ? <img src={m.avatarUrl} alt={m.name} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                : <span className="avatar" style={{ width: 28, height: 28, background: m.color }}>{m.name.slice(0, 2)}</span>
              }
              <div>
                <div className="nm">{m.name}{isMe ? ' (나)' : ''}</div>
                <div className="role">{m.role ?? ''}</div>
              </div>
              <span className="live" />
            </div>
          )
        })}
      </div>
    </aside>
  )
}
