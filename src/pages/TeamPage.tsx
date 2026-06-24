import { useState } from 'react'
import { useStore } from '../store'
import type { Member, PullRequest } from '../types'
import { SC } from './GraphPage'

const REVIEW: Record<string, { label: string; color: string }> = {
  wait: { label: '리뷰 대기', color: 'var(--gray-500)' },
  changes: { label: '변경요청', color: 'var(--danger)' },
  approved: { label: '승인됨 · 머지 가능', color: 'var(--success)' },
  merged: { label: '머지됨', color: 'var(--gray-400)' },
}

export default function TeamPage() {
  const { tasks, members, prs } = useStore()
  const [selM, setSelM] = useState<Member | null>(null)
  const [selP, setSelP] = useState<PullRequest | null>(null)
  const mm = Object.fromEntries(members.map((m) => [m.id, m]))
  const issuesOf = (id: string) => tasks.filter((t) => t.assigneeId === id && ['inprogress', 'review', 'blocked'].includes(t.status)).length
  const prsOf = (id: string) => prs.filter((p) => p.authorId === id && p.review !== 'merged').length

  return (
    <div>
      <div className="page-head"><h1 className="t-title1">팀</h1><p>팀원을 누르면 그 사람 작업을, PR을 누르면 세부 진행을 봅니다.</p></div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="t-title3" style={{ marginBottom: 6 }}>팀원 현황</div>
        {members.map((m) => (
          <div key={m.id} onClick={() => setSelM(m)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
            <span className="avatar" style={{ width: 32, height: 32, background: m.color }}>{m.initials}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>{m.name}</div>
              <div className="t-caption">{m.role}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge b-progress">진행중 이슈 {issuesOf(m.id)}</span>
              <span className="badge b-open">PR {prsOf(m.id)}</span>
            </div>
            <span style={{ color: 'var(--gray-300)' }}>›</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="t-title3" style={{ marginBottom: 6 }}>PR 리뷰 현황</div>
        {prs.map((p) => (
          <div key={p.number} onClick={() => setSelP(p)} style={{ padding: '13px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>#{p.number}</span>
              <div style={{ flex: 1, fontWeight: 600, color: 'var(--gray-900)', fontSize: 14 }}>{p.title}</div>
              <span className="avatar" style={{ width: 22, height: 22, background: mm[p.authorId]?.color }}>{mm[p.authorId]?.initials}</span>
              <span style={{ fontSize: 13, color: REVIEW[p.review].color, fontWeight: 600, width: 150, textAlign: 'right' }}>{REVIEW[p.review].label}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 7, marginLeft: 28, fontSize: 12, color: 'var(--gray-500)' }}>
              <span>✓ 승인 {p.approvals}</span><span>👁 리뷰어 {p.reviewers}</span><span>💬 코멘트 {p.comments}</span>
              {p.linkedIssueId && <span>🔗 {tasks.find((t) => t.id === p.linkedIssueId)?.title ?? '이슈'}</span>}
              {p.review === 'wait' && p.ageDays >= 3 && <span style={{ color: 'var(--danger)' }}>· {p.ageDays}일 지연</span>}
            </div>
          </div>
        ))}
      </div>

      {selM && (
        <div style={overlay} onClick={() => setSelM(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className="avatar" style={{ width: 36, height: 36, background: selM.color, fontSize: 14 }}>{selM.initials}</span>
              <div><div className="t-title3">{selM.name}</div><div className="t-caption">{selM.role}</div></div>
              <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setSelM(null)}>✕</span>
            </div>
            <div className="t-caption" style={{ margin: '4px 0 8px', fontWeight: 600 }}>맡은 작업</div>
            {tasks.filter((t) => t.assigneeId === selM.id).map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SC[t.status].c }} />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--gray-800)' }}>{t.title}</span>
                <span className={`badge ${SC[t.status].cls}`} style={{ fontSize: 11 }}>{SC[t.status].label}</span>
              </div>
            ))}
            <div className="t-caption" style={{ margin: '14px 0 8px', fontWeight: 600 }}>올린 PR</div>
            {prs.filter((p) => p.authorId === selM.id).map((p) => (
              <div key={p.number} onClick={() => { setSelP(p); setSelM(null) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>#{p.number}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--gray-800)' }}>{p.title}</span>
                <span style={{ fontSize: 12, color: REVIEW[p.review].color, fontWeight: 600 }}>{REVIEW[p.review].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selP && (
        <div style={overlay} onClick={() => setSelP(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="t-title3">#{selP.number} {selP.title}</span>
              <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setSelP(null)}>✕</span>
            </div>
            <a href={selP.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>{selP.url} ↗</a>
            <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
              {([['승인', selP.approvals], ['리뷰어', selP.reviewers], ['코멘트', selP.comments]] as const).map(([l, v]) => (
                <div key={l} className="card" style={{ flex: 1, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>{v}</div><div className="t-caption">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--gray-700)' }}>
              <Row k="작성자" v={mm[selP.authorId]?.name} />
              <Row k="리뷰어" v={selP.reviewerId ? mm[selP.reviewerId]?.name : '미지정'} />
              <Row k="리뷰 결과" v={<span style={{ color: REVIEW[selP.review].color, fontWeight: 600 }}>{REVIEW[selP.review].label}</span>} />
              {selP.linkedIssueId && <Row k="연결 이슈" v={tasks.find((t) => t.id === selP.linkedIssueId)?.title ?? '-'} />}
              <Row k="경과" v={`${selP.ageDays}일`} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', paddingBottom: 8 }}>
    <span style={{ color: 'var(--gray-500)' }}>{k}</span><span>{v}</span>
  </div>
)
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(25,31,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }
const modal: React.CSSProperties = { background: 'var(--surface)', width: '100%', maxWidth: 440, borderRadius: 20, padding: 20, maxHeight: '90vh', overflow: 'auto' }
