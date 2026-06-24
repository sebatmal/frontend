import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Task, Member, PullRequest, Lane } from './types'
import { tasks as seedTasks, members as seedMembers, prs as seedPrs, ME } from './mock/data'

// 중앙 상태(목 서버). 새로고침 전까지 유지 · 모든 화면이 동기화됨.
export type SplitItem = { id: string; title: string; assignee: string; depIds: string[] }
export type AddedDep = { from: string; to: string; existing: boolean } // existing=기존 그래프에 연결
export type SplitResult = { feature: string; created: number; issues: { title: string; assignee: string }[]; addedDeps: AddedDep[] }
export type NewFeature = { title: string; week: number; lane: Lane; depIds: string[] }

interface Store {
  tasks: Task[]
  members: Member[]
  prs: PullRequest[]
  me: string
  childrenOf: (featureId: string) => Task[]
  moveTask: (id: string, week: number) => void
  addFeature: (input: NewFeature) => Task
  splitFeature: (featureId: string, items: SplitItem[]) => SplitResult | null
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider 필요'); return c }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [members] = useState<Member[]>(seedMembers)
  const [prs] = useState<PullRequest[]>(seedPrs)
  const [seq, setSeq] = useState(1)

  const childrenOf = (fId: string) => tasks.filter((t) => t.id.startsWith(`${fId}-i`))

  const moveTask = (id: string, week: number) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, week } : t)))

  // 새 기능 추가 — 담당 미정(기능엔 사람 X), 예정 상태. 이후 이슈로 나뉨.
  const addFeature = ({ title, week, lane, depIds }: NewFeature): Task => {
    const id = `f-${seq}`
    setSeq((s) => s + 1)
    const row = Math.max(2, 0, ...tasks.filter((t) => t.week === week).map((t) => t.row)) + 1
    const t: Task = { id, title: title.trim(), assigneeId: '', status: 'planned', lane, week, row, deps: depIds }
    setTasks((ts) => [...ts, t])
    return t
  }

  // 기능 → 이슈 분리. 루트 이슈는 기능의 기존 선행을 물려받아 그래프에 연결됨.
  const splitFeature = (fId: string, items: SplitItem[]): SplitResult | null => {
    const f = tasks.find((t) => t.id === fId)
    if (!f || items.length === 0) return null
    if (tasks.some((t) => t.id.startsWith(`${fId}-i`))) return null // 이미 생성 → 중복 방지
    const idMap: Record<string, string> = {}
    items.forEach((it, i) => (idMap[it.id] = `${fId}-i${i}`))
    const baseRow = Math.max(2, ...tasks.filter((t) => t.week === f.week).map((t) => t.row)) + 1
    const newTasks: Task[] = items.map((it, i) => ({
      id: idMap[it.id], title: it.title, assigneeId: it.assignee, status: 'planned', lane: f.lane, week: f.week, row: baseRow + i,
      deps: it.depIds.length ? it.depIds.map((d) => idMap[d]) : f.deps.length ? f.deps : [fId],
    }))
    const titleAll: Record<string, string> = { ...Object.fromEntries(tasks.map((t) => [t.id, t.title])), ...Object.fromEntries(newTasks.map((t) => [t.id, t.title])) }
    const existing = new Set(tasks.map((t) => t.id))
    const addedDeps: AddedDep[] = newTasks.flatMap((t) => t.deps.map((d) => ({ from: titleAll[d] ?? d, to: t.title, existing: existing.has(d) })))
    setTasks((ts) => ts.map((t) => (t.id === fId ? { ...t, split: true } : t)).concat(newTasks))
    return { feature: f.title, created: newTasks.length, issues: newTasks.map((t) => ({ title: t.title, assignee: members.find((m) => m.id === t.assigneeId)?.name ?? '미정' })), addedDeps }
  }

  return <Ctx.Provider value={{ tasks, members, prs, me: ME, childrenOf, moveTask, addFeature, splitFeature }}>{children}</Ctx.Provider>
}
