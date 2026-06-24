// DevFlow 도메인 타입 — 목 API와 실제 API가 공유하는 계약
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
  prNumber?: number
  assigneeId: string
  status: TaskStatus
  lane: Lane
  week: number            // 0-based (1주차=0)
  row: number            // 그래프 세로 위치
  deps: string[]         // 이 작업이 "기다리는"(선행) Task id 목록
  split?: boolean        // 기능이 이슈로 나뉘었는지
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
