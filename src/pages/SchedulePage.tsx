import { useState } from 'react'
import { api } from '../mock/api'
import { useStore, type SplitResult } from '../store'
import type { Task } from '../types'
import type { AISuggest, Importance } from '../mock/data'
import { retro } from '../mock/data'
import { SC } from './GraphPage'

const WEEKS = ['1주차', '2주차', '3주차', '4주차', '5주차']
const IMP: Record<Importance, { label: string; cls: string }> = {
  high: { label: 'high', cls: 'b-blocked' }, medium: { label: 'medium', cls: 'b-review' }, low: { label: 'low', cls: 'b-planned' },
}
type EditIssue = { id: string; title: string; importance: Importance; days: number; depIds: string[]; assignee: string }

export default function SchedulePage() {
  const { tasks, members, moveTask, splitFeature, childrenOf } = useStore()
  const mm = Object.fromEntries(members.map((m) => [m.id, m]))
  const [drag, setDrag] = useState<string | null>(null)
  const [openFor, setOpenFor] = useState<Task | null>(null)
  const [sug, setSug] = useState<AISuggest | null>(null)
  const [items, setItems] = useState<EditIssue[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [retroOpen, setRetroOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmed, setConfirmed] = useState(1)   // 이 주차 미만은 확정·잠김. 그 외엔 자유 이동
  const [summary, setSummary] = useState<SplitResult | null>(null)

  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]))
  const dependentsOf = (id: string) => tasks.filter((x) => x.deps.includes(id))
  const validMove = (t: Task, week: number) => {
    if (week < confirmed) return false
    if (t.deps.some((d) => byId[d] && byId[d].week > week)) return false
    if (dependentsOf(t.id).some((x) => x.week < week)) return false
    return true
  }
  const reason = (t: Task, week: number) => {
    if (week < confirmed) return '완료된 주차로는 옮길 수 없어요'
    const dep = t.deps.map((d) => byId[d]).find((d) => d && d.week > week)
    if (dep) return `선행 작업 "${dep.title}"보다 앞설 수 없어요`
    const dn = dependentsOf(t.id).find((x) => x.week < week)
    if (dn) return `"${dn.title}"이(가) 이 작업을 기다려서 더 뒤로 못 가요`
    return ''
  }

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2400) }
  const tryMove = (id: string, week: number) => {
    const t = byId[id]; if (!t) { setDrag(null); return }
    if (validMove(t, week)) { moveTask(id, week); flash('일정을 옮겼어요') }
    else flash(reason(t, week))
    setDrag(null)
  }
  const open = (t: Task) => {
    setOpenFor(t); setSug(null); setItems([]); setNewTitle('')
    api.suggestIssues(t.id).then((s) => { setSug(s); setItems(s.issues.map((is, i) => ({ id: `s${i}`, title: is.title, importance: is.importance, days: is.days, depIds: (is.deps || []).map((d) => `s${d}`), assignee: '' }))) })
  }
  const delItem = (id: string) => setItems((its) => its.filter((x) => x.id !== id).map((x) => ({ ...x, depIds: x.depIds.filter((d) => d !== id) })))
  const addItem = () => { if (!newTitle.trim()) return; setItems((its) => [...its, { id: `n${its.length}-${newTitle.length}`, title: newTitle.trim(), importance: 'medium', days: 1, depIds: [], assignee: '' }]); setNewTitle('') }
  const setAssignee = (id: string, v: string) => setItems((its) => its.map((x) => (x.id === id ? { ...x, assignee: v } : x)))
  // 의존성 편집 (이 모달에서만 — 잘못된 선행을 여기서 바로잡음)
  const dependsOn = (aId: string, bId: string): boolean => {
    const a = items.find((i) => i.id === aId); if (!a) return false
    return a.depIds.includes(bId) || a.depIds.some((d) => dependsOn(d, bId))
  }
  const addDep = (xId: string, depId: string) => {
    if (!depId) return
    if (dependsOn(depId, xId)) { flash('순환 의존이 생겨 추가할 수 없어요'); return }
    setItems((its) => its.map((i) => (i.id === xId ? { ...i, depIds: [...i.depIds, depId] } : i)))
  }
  const removeDep = (xId: string, depId: string) => setItems((its) => its.map((i) => (i.id === xId ? { ...i, depIds: i.depIds.filter((d) => d !== depId) } : i)))
  const candidates = (x: EditIssue) => items.filter((c) => c.id !== x.id && !x.depIds.includes(c.id) && !dependsOn(c.id, x.id))
  const recompute = () => { setItems((its) => its.map((x, i) => (i === 0 ? { ...x, depIds: [] } : x.depIds.length ? x : { ...x, depIds: [its[0].id] }))); flash('의존성을 다시 계산했어요') }
  const depCount = items.reduce((a, x) => a + x.depIds.length, 0)
  const unassigned = items.filter((x) => !x.assignee).length
  const titleOf = (id: string) => items.find((x) => x.id === id)?.title
  const weekDone = (w: number) => { const l = tasks.filter((t) => t.week === w); const d = l.filter((t) => t.status === 'merged').length; return l.length ? Math.round((d / l.length) * 100) : 0 }

  const dragT = drag ? byId[drag] : null
  const dependents = dragT ? dependentsOf(dragT.id) : []

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div><h1 className="t-title1">스케줄 관리</h1><p>확정한 주차는 잠기고, 그 외엔 자유롭게 이동 — 옮길 수 있는 주차가 초록으로 표시돼요 · 기능을 누르면 이슈로 나눕니다</p></div>
        <button onClick={() => flash('기능 추가')} style={btnP}>＋ 기능 추가</button>
      </div>

      {dragT && (
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          <b>{dragT.title}</b> 이동 중 · 초록 주차로만 가능
          {dependents.length > 0 && <> · 이 작업을 기다리는 것: {dependents.map((d) => d.title).join(', ')}</>}
        </div>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="t-caption" style={{ letterSpacing: '.06em' }}>SPRINT OVERVIEW</span>
          <span className="t-caption">13개 기능 중 <b style={{ color: 'var(--success)' }}>3개 완료</b> · <b style={{ color: 'var(--info)' }}>3개 진행중</b></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {WEEKS.map((w, i) => (
            <div key={w} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: i === confirmed ? 'var(--info)' : i < confirmed ? 'var(--success)' : 'var(--gray-400)', marginBottom: 4 }}>{w}</div>
              <div className="bar"><i style={{ width: `${weekDone(i)}%`, background: i === confirmed ? 'var(--info)' : 'var(--success)' }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {WEEKS.map((w, i) => {
          const list = tasks.filter((t) => t.week === i && !t.id.includes('-i'))
          const locked = i < confirmed
          const can = dragT ? validMove(dragT, i) : null
          const border = can === true ? '2px solid var(--success)' : can === false ? '1px dashed var(--gray-300)' : i === confirmed ? '1px solid var(--primary)' : '1px solid transparent'
          return (
            <div key={w} onDragOver={(e) => e.preventDefault()} onDrop={() => drag && tryMove(drag, i)}
              style={{ minWidth: 220, flex: '1 0 220px', background: can === true ? '#E7F8EE' : i === confirmed ? 'var(--primary-light)' : 'var(--gray-50)', borderRadius: 16, padding: 12, border, opacity: can === false ? 0.5 : 1, transition: 'all .12s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{w}</span>
                {locked && <span title="완료·확정">🔒</span>}
                {i === confirmed && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--info)' }} />}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>{list.length}</span>
              </div>
              {list.map((t) => {
                const lifted = drag === t.id
                return (
                  <div key={t.id} draggable={!locked} onDragStart={() => setDrag(t.id)} onDragEnd={() => setDrag(null)} onClick={() => open(t)}
                    className="card" style={{ padding: 12, marginBottom: 8, cursor: locked ? 'pointer' : 'grab', opacity: lifted ? 0.4 : locked ? 0.85 : 1, border: lifted ? '1px dashed var(--primary)' : undefined, transform: lifted ? 'scale(.97)' : undefined, boxShadow: lifted ? 'none' : 'var(--sh-sm)', transition: 'opacity .1s, transform .1s' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 6 }}>{t.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${SC[t.status].cls}`} style={{ fontSize: 11 }}>{SC[t.status].label}</span>
                      {childrenOf(t.id).length > 0 && <span className="badge b-open" style={{ fontSize: 11 }}>이슈 {childrenOf(t.id).length}</span>}
                      {t.prNumber && <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>#{t.prNumber}</span>}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary)' }}>{childrenOf(t.id).length > 0 ? '이슈 보기 ›' : '이슈 나누기 ›'}</span>
                    </div>
                  </div>
                )
              })}
              {i === confirmed && <button onClick={() => setRetroOpen(true)} style={{ width: '100%', marginTop: 4, border: '1px solid var(--primary)', background: 'var(--surface)', color: 'var(--primary)', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, padding: 10, borderRadius: 12, cursor: 'pointer' }}>{confirmed + 1}주차 완료 확정 → 회고</button>}
            </div>
          )
        })}
      </div>

      {toast && <div style={toastS}>{toast}</div>}

      {/* 이슈로 나누기 (이슈는 미할당 → 각자 가져가기) */}
      {openFor && (
        <div style={overlay} onClick={() => setOpenFor(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span className="t-title3">{openFor.title} — 이슈로 나누기</span>
              <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setOpenFor(null)}>✕</span>
            </div>
            {!sug ? <div className="t-caption" style={{ padding: 20 }}>이슈로 나누는 중…</div> : (
              <>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', background: 'var(--gray-50)', borderRadius: 12, padding: 12, margin: '10px 0' }}>
                  <b style={{ color: 'var(--gray-700)' }}>분리 근거</b> · {sug.note} 생성되는 이슈는 <b>담당 미정</b>으로, 각자 가져가요.
                </div>
                {items.map((it) => (
                  <div key={it.id} style={{ padding: '11px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--gray-800)' }}>{it.title}</span>
                      <span className={`badge ${IMP[it.importance].cls}`} style={{ fontSize: 11 }}>{IMP[it.importance].label}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', width: 26, textAlign: 'right' }}>{it.days}d</span>
                      <span onClick={() => delItem(it.id)} title="삭제" style={{ cursor: 'pointer', color: 'var(--gray-400)', padding: '0 2px' }}>✕</span>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <select value={it.assignee} onChange={(e) => setAssignee(it.id, e.target.value)}
                        style={{ fontFamily: 'inherit', fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 8, padding: '4px 8px', color: it.assignee ? 'var(--gray-800)' : 'var(--gray-400)' }}>
                        <option value="">담당 미정</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                      </select>
                      {it.depIds.map((d) => titleOf(d) && (
                        <span key={d} style={{ fontSize: 11, color: '#B45309', background: 'var(--warning-light)', padding: '2px 6px 2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          🔗 {titleOf(d)} 이후 <span onClick={() => removeDep(it.id, d)} title="선행 삭제" style={{ cursor: 'pointer', opacity: 0.7 }}>✕</span>
                        </span>
                      ))}
                      {candidates(it).length > 0 && (
                        <select value="" onChange={(e) => { addDep(it.id, e.target.value); e.currentTarget.value = '' }}
                          style={{ fontFamily: 'inherit', fontSize: 12, border: '1px dashed var(--gray-300)', borderRadius: 8, padding: '4px 8px', color: 'var(--gray-500)' }}>
                          <option value="">+ 선행 추가</option>
                          {candidates(it).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="이슈 직접 추가" style={{ flex: 1, border: '1px solid var(--gray-300)', borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14 }} />
                  <button onClick={addItem} style={btnG}>추가</button>
                  <button onClick={recompute} style={btnG} title="이슈가 바뀌면 의존성만 다시 계산">의존성 재계산</button>
                </div>
                <div className="t-caption" style={{ margin: '14px 0 8px' }}>이슈 {items.length}개 · 의존성 {depCount}개 · 담당 미정 {unassigned}개</div>
                <button onClick={() => { const r = splitFeature(openFor.id, items.map((it) => ({ id: it.id, title: it.title, assignee: it.assignee, depIds: it.depIds }))); setOpenFor(null); if (r) setSummary(r); else flash('이미 생성된 기능이에요') }} style={{ ...btnP, width: '100%', justifyContent: 'center' }}>⎇ GitHub에 {items.length}개 이슈 + 의존성 생성</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 회고 / 리스케줄 */}
      {retroOpen && (
        <div style={overlay} onClick={() => setRetroOpen(false)}>
          <div style={{ ...modal, maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span className="t-title3">{retro.week}주차 회고</span>
              <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setRetroOpen(false)}>✕</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {([['계획 달성률', `${Math.round((retro.done / retro.total) * 100)}%`, 'var(--warning)'], ['평균 PR 리뷰', `${retro.prReviewDays}일`, 'var(--danger)'], ['이슈 완료율', `${retro.closeRate}%`, 'var(--success)']] as const).map(([l, v, c]) => (
                <div key={l} className="card" style={{ flex: 1, padding: 12 }}><div className="t-caption">{l}</div><div style={{ fontSize: 24, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: 14 }}>{retro.summary}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)', margin: '6px 0 8px' }}>조정 제안</div>
            {retro.recs.map((r, i) => (
              <div key={i} className="card" style={{ padding: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${IMP[r.level].cls}`} style={{ fontSize: 11 }}>{IMP[r.level].label}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{r.title}</div><div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{r.reason}</div></div>
                <button onClick={() => flash('조정을 적용했어요')} style={{ ...btnP, padding: '7px 12px', fontSize: 13 }}>수락</button>
                <button style={btnG}>거절</button>
              </div>
            ))}
            <button onClick={() => { setConfirmed((c) => c + 1); setRetroOpen(false); flash(`${retro.week}주차를 확정했어요 — 이전 주차는 잠깁니다`) }} style={{ ...btnP, width: '100%', justifyContent: 'center', marginTop: 12 }}>이 주차 확정하고 다음 주차로 →</button>
          </div>
        </div>
      )}

      {/* 분리 결과 — 어디에 의존성이 추가/연결됐는지 */}
      {summary && (
        <div style={overlay} onClick={() => setSummary(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span className="t-title3">반영 완료 — {summary.feature}</span>
              <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setSummary(null)}>✕</span>
            </div>
            <div className="t-caption" style={{ marginBottom: 12 }}>이슈 {summary.created}개와 의존성을 그래프에 추가했어요.</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', margin: '6px 0' }}>생성된 이슈</div>
            {summary.issues.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14, color: 'var(--gray-800)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gray-300)' }} />{it.title}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: it.assignee === '미정' ? 'var(--gray-400)' : 'var(--gray-600)' }}>{it.assignee}</span>
              </div>
            ))}
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', margin: '14px 0 6px' }}>추가된 의존성</div>
            {summary.addedDeps.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontSize: 13, color: 'var(--gray-700)' }}>
                <span>{d.from}</span><span style={{ color: 'var(--gray-300)' }}>→</span><span>{d.to}</span>
                {d.existing && <span className="badge b-merged" style={{ fontSize: 10, marginLeft: 6 }}>기존에 연결</span>}
              </div>
            ))}
            <button onClick={() => setSummary(null)} style={{ ...btnP, width: '100%', justifyContent: 'center', marginTop: 16 }}>확인 (의존성 흐름 탭에서 확인)</button>
          </div>
        </div>
      )}
    </div>
  )
}

const btnP: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'var(--primary)', color: '#fff', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }
const btnG: React.CSSProperties = { border: '1px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-600)', fontFamily: 'inherit', fontSize: 13, padding: '9px 14px', borderRadius: 12, cursor: 'pointer' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(25,31,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }
const modal: React.CSSProperties = { background: 'var(--surface)', width: '100%', maxWidth: 470, borderRadius: 20, padding: 20, maxHeight: '90vh', overflow: 'auto' }
const toastS: React.CSSProperties = { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', background: 'rgba(25,31,40,.92)', color: '#fff', padding: '11px 16px', borderRadius: 12, fontSize: 14, zIndex: 60 }
