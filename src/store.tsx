import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Task, Member, PullRequest, Lane, ApiTask, ApiMember } from './types'
import { prs as seedPrs } from './mock/data'
import { apiFetch } from './api'

export type SplitItem = { id: string; title: string; assignee: string; depIds: string[] }
export type AddedDep = { from: string; to: string; existing: boolean }
export type SplitResult = { feature: string; created: number; issues: { title: string; assignee: string }[]; addedDeps: AddedDep[] }
export type NewFeature = { title: string; week: number; lane: Lane; depIds: string[] }

interface Store {
  tasks: Task[]
  members: Member[]
  prs: PullRequest[]
  me: string
  childrenOf: (featureId: string) => Task[]
  moveTask: (id: string, week: number) => void
  addFeature: (input: NewFeature) => Promise<Task>
  splitFeature: (featureId: string, items: SplitItem[]) => SplitResult | null
}

const STATUS_MAP: Record<string, Task['status']> = {
  PLANNED: 'planned', INPROGRESS: 'inprogress', REVIEW: 'review',
  BLOCKED: 'blocked', MERGED: 'merged', OPEN: 'open',
}

function toTask(t: ApiTask): Task {
  return {
    id: String(t.id),
    title: t.title,
    type: t.type,
    parentId: t.parentId != null ? String(t.parentId) : undefined,
    assigneeId: t.assigneeMemberId != null ? String(t.assigneeMemberId) : '',
    status: STATUS_MAP[t.status] ?? 'planned',
    lane: t.lane,
    week: t.week,
    row: t.row,
    deps: t.deps.map(String),
    split: t.isSplit,
    prNumber: t.githubIssueNumber ?? undefined,
  }
}

function toMember(m: ApiMember): Member {
  return {
    id: String(m.id),
    name: m.name,
    initials: m.name.slice(0, 2),
    role: m.role ?? '',
    color: m.color,
  }
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider 필요'); return c }

interface ProviderProps {
  children: ReactNode
  projectId: string | null
  apiMembers: ApiMember[]
  userId: number | null
}

export function StoreProvider({ children, projectId, apiMembers, userId }: ProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [seq, setSeq] = useState(1)

  const members: Member[] = apiMembers.length > 0
    ? apiMembers.map(toMember)
    : []

  const me = apiMembers.find(m => m.userId === userId)
  const meId = me ? String(me.id) : ''

  const [prs] = useState<PullRequest[]>(seedPrs)

  useEffect(() => {
    if (!projectId) return
    apiFetch<ApiTask[]>(`/projects/${projectId}/tasks`)
      .then(data => setTasks(data.map(toTask)))
      .catch(() => {})
  }, [projectId])

  const childrenOf = (fId: string) => tasks.filter(t => t.parentId === fId)

  const moveTask = (id: string, week: number) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, week } : t))
    apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ week }) }).catch(() => {})
  }

  const addFeature = async ({ title, week, lane, depIds }: NewFeature): Promise<Task> => {
    const api = await apiFetch<ApiTask>(`/projects/${projectId}/features`, {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), week, lane, depTaskIds: depIds.map(Number) }),
    })
    const t = toTask(api)
    setTasks(ts => [...ts, t])
    return t
  }

  const splitFeature = (fId: string, items: SplitItem[]): SplitResult | null => {
    const f = tasks.find(t => t.id === fId)
    if (!f || items.length === 0) return null
    if (f.split) return null
    const idMap: Record<string, string> = {}
    items.forEach((it, i) => (idMap[it.id] = `${fId}-i${i}`))
    const baseRow = Math.max(2, ...tasks.filter(t => t.week === f.week).map(t => t.row)) + 1
    const newTasks: Task[] = items.map((it, i) => ({
      id: idMap[it.id], title: it.title, assigneeId: it.assignee,
      status: 'planned', lane: f.lane, week: f.week, row: baseRow + i,
      parentId: fId,
      deps: it.depIds.length ? it.depIds.map(d => idMap[d]) : f.deps.length ? f.deps : [fId],
    }))
    const titleAll: Record<string, string> = {
      ...Object.fromEntries(tasks.map(t => [t.id, t.title])),
      ...Object.fromEntries(newTasks.map(t => [t.id, t.title])),
    }
    const existing = new Set(tasks.map(t => t.id))
    const addedDeps: AddedDep[] = newTasks.flatMap(t => t.deps.map(d => ({ from: titleAll[d] ?? d, to: t.title, existing: existing.has(d) })))
    setTasks(ts => ts.map(t => t.id === fId ? { ...t, split: true } : t).concat(newTasks))
    return { feature: f.title, created: newTasks.length, issues: newTasks.map(t => ({ title: t.title, assignee: members.find(m => m.id === t.assigneeId)?.name ?? '미정' })), addedDeps }
  }

  return (
    <Ctx.Provider value={{ tasks, members, prs, me: meId, childrenOf, moveTask, addFeature, splitFeature }}>
      {children}
    </Ctx.Provider>
  )
}
