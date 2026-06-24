// DevFlow 도메인 타입 — 목 API와 실제 API가 공유하는 계약
export interface User {
  id: number
  githubId: number
  login: string
  name: string
  avatarUrl: string
}

export interface ApiProject {
  id: number
  name: string
  githubOwner: string
  githubRepo: string
  sprintLabel: string | null
  dDay: number | null
  connectedAt: string | null   // org 최초 연결일 (BE)
  currentWeek: number          // 현재 주차 0-based (BE, 연결일 기준)
}

export interface ApiMember {
  id: number
  githubLogin: string
  name: string
  avatarUrl: string
  role: string | null
  color: string
  userId: number | null
}

export type TaskStatus = 'merged' | 'open' | 'review' | 'inprogress' | 'blocked' | 'planned'
export type Lane = 'BE' | 'FE' | 'AI' | 'INFRA'
export type PRReview = 'wait' | 'changes' | 'approved' | 'merged'

export interface Member {
  id: string
  name: string
  initials: string
  role: string
  color: string
}

export interface Task {
  id: string
  title: string
  type?: 'FEATURE' | 'ISSUE'
  parentId?: string
  prNumber?: number
  assigneeId: string
  status: TaskStatus
  lane: Lane
  week: number            // 0-based (1주차=0)
  row: number            // 그래프 세로 위치
  deps: string[]         // 이 작업이 "기다리는"(선행) Task id 목록
  split?: boolean        // 기능이 이슈로 나뉘었는지
}

export interface ApiTask {
  id: number
  title: string
  type: 'FEATURE' | 'ISSUE'
  parentId: number | null
  status: 'PLANNED' | 'INPROGRESS' | 'REVIEW' | 'BLOCKED' | 'MERGED' | 'OPEN'
  lane: Lane
  week: number
  row: number
  assigneeMemberId: number | null
  githubIssueNumber: number | null
  isSplit: boolean
  deps: number[]
}

export interface PullRequest {
  number: number
  title: string
  authorId: string
  review: PRReview
  reviewerId?: string
  ageDays: number
  approvals: number      // 승인 수
  reviewers: number      // 리뷰 단 사람 수
  comments: number       // 코멘트 수
  url: string            // PR 링크
  linkedIssueId?: string // 연결된 이슈(Task) id
}

export interface Project {
  name: string
  repo: string
  sprint: string
  dday: number
}
