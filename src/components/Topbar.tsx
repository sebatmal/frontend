import { useState } from 'react'
import type { User, ApiProject } from '../types'
import { logout } from '../api'

export default function Topbar({ crumb, user, project }: { crumb: string; user: User | null; project: ApiProject | null }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const avatar = user?.avatarUrl
    ? <img src={user.avatarUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
    : <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary)' }}>{initials}</span>

  return (
    <header className="topbar">
      <div className="crumb">{project?.name ?? '...'} <span style={{ color: 'var(--gray-300)' }}>›</span> <b>{crumb}</b></div>
      <div className="gh-pill"><span className="dot" /> GitHub 연결됨</div>
      <div style={{ position: 'relative', marginLeft: 12 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="계정 메뉴"
          style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: '50%', display: 'block' }}
        >
          {avatar}
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
            <div style={{ position: 'absolute', right: 0, top: 42, zIndex: 31, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 168, padding: 6 }}>
              <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-100)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name ?? '사용자'}
              </div>
              <button
                onClick={logout}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--gray-800)', fontFamily: 'inherit', borderRadius: 6 }}
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
