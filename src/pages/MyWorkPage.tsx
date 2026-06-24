import { useStore } from '../store'
import type { Task, PullRequest } from '../types'
import { SC } from './GraphPage'

export default function MyWorkPage() {
  const { tasks, members, prs, me } = useStore()
  const mm = Object.fromEntries(members.map((m) => [m.id, m]))
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]))
  const mine = tasks.filter((t) => t.assigneeId === me && t.status !== 'merged')
  const blockingIds = new Set<string>()
  mine.forEach((t) => t.deps.forEach((d) => { const dep = byId[d]; if (dep && dep.assigneeId !== me && dep.status !== 'merged') blockingIds.add(d) }))
  const others = [...blockingIds].map((id) => byId[id])

  const reviewMine = prs.filter((p) => p.reviewerId === me && (p.review === 'wait' || p.review === 'changes'))
  const mergeable = prs.filter((p) => p.authorId === me && p.approvals >= 1 && p.review !== 'merged')

  // 내 작업 카드 (의존/막힘 표시)
  const MyCard = ({ t }: { t: Task }) => {
    const deps = t.deps.map((d) => byId[d]).filter(Boolean)
    const blockers = deps.filter((d) => d.status !== 'merged')
    return (
      <div className="card" style={{ padding: 14, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: SC[t.status].c, flexShrink: 0 }} />
          <div style={{ flex: 1, fontWeight: 600, color: 'var(--gray-900)', fontSize: 15 }}>{t.title}</div>
          <span className={`badge ${SC[t.status].cls}`}>{SC[t.status].label}</span>
        </div>
        {deps.length > 0 && (
          <div style={{ marginTop: 9, paddingLeft: 19, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {deps.map((d) => {
              const blocked = d.status !== 'merged'
              return (
                <div key={d.id} style={{ fontSize: 12, color: blocked ? '#B45309' : 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {blocked ? '🔒' : '✓'} 선행: {d.title} <span style={{ color: 'var(--gray-400)' }}>· {mm[d.assigneeId]?.name} · {SC[d.status].label}</span>
                </div>
              )
            })}
            {t.status === 'blocked' && blockers.length > 0 && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>→ {blockers.map((b) => b.title).join(', ')} 때문에 막힘</div>}
          </div>
        )}
      </div>
    )
  }

  const PRRow = ({ p, note }: { p: PullRequest; note: string }) => (
    <div className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>#{p.number} ↗</a>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 14 }}>{p.title}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{note} · ✓{p.approvals} 💬{p.comments}</div>
      </div>
      <span className="avatar" style={{ width: 22, height: 22, background: mm[p.authorId]?.color }}>{mm[p.authorId]?.initials}</span>
    </div>
  )

  return (
    <div>
      <div className="page-head"><h1 className="t-title1">내 작업</h1><p>내가/남이 움직여야 풀리는 것 + 무엇 때문에 막혔는지 · 리뷰 현황.</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <div style={secT}><span style={{ color: 'var(--primary)' }}>▶</span> 내가 움직여야 풀리는 것 <span style={cnt}>{mine.length}</span></div>
          {mine.map((t) => <MyCard key={t.id} t={t} />)}
        </div>
        <div>
          <div style={secT}><span style={{ color: 'var(--warning)' }}>⏳</span> 남이 움직여야 풀리는 것 <span style={cnt}>{others.length}</span></div>
          {others.map((t) => (
            <div key={t.id} className="card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: SC[t.status].c }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 15 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{mm[t.assigneeId]?.name} 가 끝내야 내 작업이 풀림</div>
              </div>
              <span className={`badge ${SC[t.status].cls}`}>{SC[t.status].label}</span>
            </div>
          ))}
          {others.length === 0 && <div className="t-caption" style={{ padding: 8 }}>나를 막는 작업이 없어요</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={secT}><span style={{ color: 'var(--info)' }}>👁</span> 내가 리뷰할 것 <span style={cnt}>{reviewMine.length}</span></div>
          {reviewMine.map((p) => <PRRow key={p.number} p={p} note={p.review === 'changes' ? '변경요청 → 재확인' : '리뷰 대기'} />)}
          {reviewMine.length === 0 && <div className="t-caption" style={{ padding: 8 }}>리뷰할 PR이 없어요</div>}
        </div>
        <div>
          <div style={secT}><span style={{ color: 'var(--success)' }}>✓</span> 머지 가능 (내 PR) <span style={cnt}>{mergeable.length}</span></div>
          {mergeable.map((p) => <PRRow key={p.number} p={p} note={`승인 ${p.approvals} · 머지 가능`} />)}
          {mergeable.length === 0 && <div className="t-caption" style={{ padding: 8 }}>아직 승인된 내 PR이 없어요</div>}
        </div>
      </div>
    </div>
  )
}

const secT: React.CSSProperties = { fontWeight: 700, color: 'var(--gray-800)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }
const cnt: React.CSSProperties = { color: 'var(--gray-400)', fontWeight: 500 }
