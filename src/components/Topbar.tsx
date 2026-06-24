import type { User, ApiProject } from '../types'

export default function Topbar({ crumb, user, project }: { crumb: string; user: User | null; project: ApiProject | null }) {
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="topbar">
      <div className="crumb">{project?.name ?? '...'} <span style={{ color: 'var(--gray-300)' }}>›</span> <b>{crumb}</b></div>
      <div className="gh-pill"><span className="dot" /> GitHub 연결됨</div>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', marginLeft: 12, objectFit: 'cover' }} />
        : <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary)', marginLeft: 12 }}>{initials}</span>
      }
    </header>
  )
}
