import { useMemo, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../store'
import type { Task, Member, TaskStatus } from '../types'

export const SC: Record<TaskStatus, { c: string; label: string; cls: string }> = {
  merged: { c: '#22C55E', label: '완료', cls: 'b-merged' },
  open: { c: '#3182F6', label: '열림', cls: 'b-open' },
  review: { c: '#FFB020', label: '리뷰중', cls: 'b-review' },
  inprogress: { c: '#3182F6', label: '진행중', cls: 'b-progress' },
  blocked: { c: '#F04452', label: '차단됨', cls: 'b-blocked' },
  planned: { c: '#B0B8C1', label: '예정', cls: 'b-planned' },
}

function TaskNode({ data }: { data: { task: Task; member?: Member } }) {
  const { task, member } = data
  const s = SC[task.status]
  return (
    <div style={{ width: 188, background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${s.c}`, borderRadius: 12, padding: '12px 13px', boxShadow: 'var(--sh-sm)' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} isConnectable={false} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 8 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className={`badge ${s.cls}`}>{s.label}</span>
        {task.prNumber && <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>#{task.prNumber}</span>}
        {member && <span className="avatar" style={{ width: 22, height: 22, background: member.color, marginLeft: 'auto', fontSize: 10 }}>{member.initials}</span>}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} isConnectable={false} />
    </div>
  )
}
const nodeTypes = { task: TaskNode }

export default function GraphPage() {
  const { tasks, members } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const mm = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])
  const tById = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks])

  const nodes: Node[] = useMemo(() => tasks.map((x) => ({ id: x.id, type: 'task', position: { x: x.week * 300 + 20, y: x.row * 130 + 20 }, data: { task: x, member: mm[x.assigneeId] } })), [tasks, mm])
  const edges: Edge[] = useMemo(() => tasks.flatMap((x) => x.deps.filter((d) => tById[d]).map((d) => {
    const stroke = x.status === 'blocked' ? '#F04452' : '#B0B8C1'
    return { id: `${d}-${x.id}`, source: d, target: x.id, animated: x.status === 'blocked', markerEnd: { type: MarkerType.ArrowClosed, color: stroke }, style: { stroke, strokeWidth: 2 } }
  })), [tasks, tById])

  const selT = sel ? tById[sel] : null
  const preds = selT ? selT.deps.filter((d) => tById[d]) : []
  const succs = selT ? tasks.filter((t) => t.deps.includes(selT.id)).map((t) => t.id) : []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <h1 className="t-title1">통합 의존성 그래프</h1>
        <p>구조 + 상태를 한 화면에 (보기 전용). 노드를 누르면 선행·후행을 봐요 · 의존성 수정은 <b style={{ color: 'var(--primary)' }}>스케줄 → 이슈 나누기</b>에서.</p>
      </div>
      <div style={{ display: 'flex', gap: 16, margin: '0 0 12px', fontSize: 12, color: 'var(--gray-500)' }}>
        {(['merged', 'inprogress', 'review', 'blocked', 'planned'] as TaskStatus[]).map((k) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: SC[k].c }} /> {SC[k].label}</span>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 440, border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, n) => setSel(n.id)}
          nodesDraggable={false} nodesConnectable={false} edgesFocusable={false} deleteKeyCode={null}
          fitView proOptions={{ hideAttribution: true }} minZoom={0.35}>
          <Background gap={22} color="#E5E8EB" />
          <Controls showInteractive={false} />
        </ReactFlow>

        {selT && (
          <div style={{ position: 'absolute', top: 12, right: 12, width: 290, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--sh-lg)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className={`badge ${SC[selT.status].cls}`}>{SC[selT.status].label}</span>
              <span style={{ flex: 1, fontWeight: 700, color: 'var(--gray-900)' }}>{selT.title}</span>
              <span style={{ cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setSel(null)}>✕</span>
            </div>
            <div className="t-caption" style={{ marginBottom: 10 }}>
              담당 {mm[selT.assigneeId]?.name ?? '미정'}
              {selT.prNumber && <> · <a href={`https://github.com/sebatmal/shop/pull/${selT.prNumber}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>PR #{selT.prNumber} ↗</a></>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', margin: '8px 0 6px' }}>선행 (이 작업이 기다림)</div>
            {preds.length === 0 && <div className="t-caption">없음</div>}
            {preds.map((id) => (<div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontSize: 13, color: 'var(--gray-800)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: SC[tById[id]?.status ?? 'planned'].c }} />{tById[id]?.title}</div>))}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', margin: '10px 0 6px' }}>후행 (이 작업을 기다림)</div>
            {succs.length === 0 && <div className="t-caption">없음</div>}
            {succs.map((id) => (<div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontSize: 13, color: 'var(--gray-800)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: SC[tById[id]?.status ?? 'planned'].c }} />{tById[id]?.title}</div>))}
          </div>
        )}
      </div>
    </div>
  )
}
