// 목(mock) API — 1차 발표용. 실제 백엔드가 생기면 fetch로 교체만 하면 됨.
// 함수 시그니처 = API 계약(10_API명세_템플릿 형태).
import type { Member, Task, PullRequest, Project, Lane } from '../types'
import { project, members, tasks, prs, ME, aiSuggestions, genericSuggest, suggestForFeature, retro } from './data'
import type { AISuggest } from './data'

const delay = <T>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms))

export const api = {
  // GET /api/projects/:id
  getProject: (): Promise<Project> => delay(project),
  // GET /api/projects/:id/members
  getMembers: (): Promise<Member[]> => delay(members),
  // GET /api/projects/:id/tasks  (deps 포함)
  getTasks: (): Promise<Task[]> => delay(tasks),
  // GET /api/projects/:id/prs
  getPRs: (): Promise<PullRequest[]> => delay(prs),
  // POST /api/features/:id/suggest-issues  (AI 이슈 추천)
  // 사전 정의된 기능은 그 추천을, 새로 추가한 기능은 분류(lane) 기반으로 추천
  suggestIssues: (featureId: string, ctx?: { title: string; lane: Lane }): Promise<AISuggest> =>
    delay(aiSuggestions[featureId] ?? (ctx ? suggestForFeature(ctx.title, ctx.lane) : genericSuggest), 400),
  // GET /api/sprints/:n/retro  (주차 회고 + 리스케줄 추천)
  getRetro: () => delay(retro, 400),
  // 현재 로그인 사용자
  me: (): string => ME,
}
