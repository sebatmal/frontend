import { project } from '../mock/data'

export default function Topbar({ crumb }: { crumb: string }) {
  return (
    <header className="topbar">
      <div className="crumb">{project.name} <span style={{ color: 'var(--gray-300)' }}>›</span> <b>{crumb}</b></div>
      <div className="gh-pill"><span className="dot" /> GitHub 연결됨</div>
      <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary)', marginLeft: 12 }}>KM</span>
    </header>
  )
}
