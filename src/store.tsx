import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Task, Member, PullRequest, PRReview, Lane, ApiTask, ApiMember, ApiPullRequest, ApiCreateIssuesResponse } from './types'
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
  splitFeature: (featureId: string, items: SplitItem[]) => Promise<SplitResult | null>
}

const STATUS_MAP: Record<string, Task['status']> = {
  PLANNED: 'planned', INPROGRESS: 'inprogress', REVIEW: 'review',
  BLOCKED: 'blocked', MERGED: 'merged', OPEN: 'open',
}

const PR_REVIEW_MAP: Record<string, PRReview> = {
  WAIT: 'wait', CHANGES: 'changes', APPROVED: 'approved', MERGED: 'merged',
}

function toPullRequest(p: ApiPullRequest): PullRequest {
  return {
    number: p.number,
    title: p.title,
    authorId: p.authorMemberId != null ? String(p.authorMemberId) : '',
    reviewerId: p.reviewerMemberId != null ? String(p.reviewerMemberId) : undefined,
    review: PR_REVIEW_MAP[p.review] ?? 'wait',
    ageDays: p.ageDays,
    approvals: p.approvals,
    reviewers: p.reviewers,
    comments: p.comments,
    url: p.url,
    linkedIssueId: p.linkedTaskId != null ? String(p.linkedTaskId) : undefined,
  }
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

  const [prs, setPrs] = useState<PullRequest[]>([])

  useEffect(() => {
    if (!projectId) return
    apiFetch<ApiTask[]>(`/projects/${projectId}/tasks`)
      .then(data => setTasks(data.map(toTask)))
      .catch(() => {})
    apiFetch<ApiPullRequest[]>(`/projects/${projectId}/prs`)
      .then(data => setPrs(data.map(toPullRequest)))
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

  // 이슈 분리: 서버가 GitHub 이슈 + 의존성을 실제 생성하고, 결과로 보드를 갱신한다.
  const splitFeature = async (fId: string, items: SplitItem[]): Promise<SplitResult | null> => {
    const f = tasks.find(t => t.id === fId)
    if (!f || items.length === 0) return null
    if (f.split) return null

    const idx: Record<string, number> = {}
    items.forEach((it, i) => (idx[it.id] = i))

    const payload = {
      items: items.map(it => ({
        title: it.title,
        assigneeMemberId: it.assignee ? Number(it.assignee) : null,
        // 같은 요청 내 선행 이슈의 index (0-based)
        depItemIndexes: it.depIds.map(d => idx[d]).filter(i => i != null),
      })),
    }

    const res = await apiFetch<ApiCreateIssuesResponse>(`/features/${fId}/issues`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const created = res.issues.map(toTask)
    setTasks(ts => ts.map(t => t.id === fId ? { ...t, split: true } : t).concat(created))

    const newIds = new Set(created.map(t => t.id))
    const titleOf: Record<string, string> = {
      ...Object.fromEntries(tasks.map(t => [t.id, t.title])),
      ...Object.fromEntries(created.map(t => [t.id, t.title])),
    }
    const nameOf = (mid: string) => members.find(m => m.id === mid)?.name ?? '미정'
    const addedDeps: AddedDep[] = res.addedDeps.map(d => {
      const from = String(d.fromTaskId)
      const to = String(d.toTaskId)
      return { from: titleOf[from] ?? from, to: titleOf[to] ?? to, existing: !newIds.has(from) }
    })

    return {
      feature: f.title,
      created: res.created,
      issues: created.map(t => ({ title: t.title, assignee: nameOf(t.assigneeId) })),
      addedDeps,
    }
  }

  return (
    <Ctx.Provider value={{ tasks, members, prs, me: meId, childrenOf, moveTask, addFeature, splitFeature }}>
      {children}
    </Ctx.Provider>
  )
}
