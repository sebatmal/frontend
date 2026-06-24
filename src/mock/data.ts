import type { Member, Task, PullRequest, Project } from '../types'

export const ME = 'km'

export const project: Project = {
  name: '쇼핑몰 플랫폼', repo: 'sebatmal/shop', sprint: '스프린트 2 / 5', dday: 18,
}

export const members: Member[] = [
  { id: 'km', name: '김민준', initials: 'KM', role: 'Frontend', color: '#7048E8' },
  { id: 'ls', name: '이서연', initials: 'LS', role: 'Backend', color: '#22C55E' },
  { id: 'pj', name: '박지훈', initials: 'PJ', role: 'Backend', color: '#FFB020' },
  { id: 'cy', name: '최유나', initials: 'CY', role: 'Design/FE', color: '#D6336C' },
]

// week: 0=1주차 ... / row: 0~2 / deps: 선행(이걸 기다림)
export const tasks: Task[] = [
  { id: 't-auth', title: '사용자 인증 API', prNumber: 12, assigneeId: 'ls', status: 'merged', lane: 'BE', week: 0, row: 0, deps: [] },
  { id: 't-db', title: 'DB 스키마 설계', prNumber: 8, assigneeId: 'pj', status: 'merged', lane: 'INFRA', week: 0, row: 1, deps: [] },
  { id: 't-ui', title: 'UI 컴포넌트', prNumber: 10, assigneeId: 'cy', status: 'merged', lane: 'FE', week: 0, row: 2, deps: [] },
  { id: 't-list', title: '상품 목록 FE', prNumber: 15, assigneeId: 'km', status: 'inprogress', lane: 'FE', week: 1, row: 0, deps: ['t-auth'] },
  { id: 't-cartapi', title: '장바구니 API', prNumber: 18, assigneeId: 'pj', status: 'review', lane: 'BE', week: 1, row: 1, deps: ['t-db'] },
  { id: 't-profile', title: '사용자 프로필 FE', prNumber: 17, assigneeId: 'cy', status: 'review', lane: 'FE', week: 1, row: 2, deps: ['t-ui'] },
  { id: 't-cartui', title: '장바구니 UI', assigneeId: 'km', status: 'blocked', lane: 'FE', week: 2, row: 0, deps: ['t-cartapi'] },
  { id: 't-payapi', title: '결제 API', assigneeId: 'ls', status: 'planned', lane: 'BE', week: 2, row: 1, deps: ['t-cartapi'] },
  { id: 't-order', title: '주문 관리 FE', assigneeId: 'cy', status: 'planned', lane: 'FE', week: 3, row: 1, deps: ['t-payapi'] },
]

const PR = (n: number) => `https://github.com/sebatmal/shop/pull/${n}`
export const prs: PullRequest[] = [
  { number: 18, title: '장바구니 API', authorId: 'pj', review: 'wait', reviewerId: 'ls', ageDays: 3, approvals: 0, reviewers: 1, comments: 2, url: PR(18), linkedIssueId: 't-cartapi' },
  { number: 15, title: '상품 목록 FE', authorId: 'km', review: 'approved', reviewerId: 'cy', ageDays: 1, approvals: 1, reviewers: 1, comments: 1, url: PR(15), linkedIssueId: 't-list' },
  { number: 17, title: '사용자 프로필 FE', authorId: 'cy', review: 'changes', reviewerId: 'km', ageDays: 2, approvals: 0, reviewers: 1, comments: 4, url: PR(17), linkedIssueId: 't-profile' },
  { number: 12, title: '사용자 인증 API', authorId: 'ls', review: 'merged', reviewerId: 'pj', ageDays: 4, approvals: 2, reviewers: 2, comments: 3, url: PR(12), linkedIssueId: 't-auth' },
]

// 기능 작성 시 AI 이슈 추천 (17_방법론: 수직 슬라이스 + SPIDR)
export type Importance = 'high' | 'medium' | 'low'
// deps = 같은 추천 목록 내 선행 이슈의 index (생성 시 이슈 간 의존성으로 설정됨)
export interface Suggestion { title: string; importance: Importance; days: number; deps?: number[] }
export interface AISuggest { note: string; total: number; issues: Suggestion[] }

export const aiSuggestions: Record<string, AISuggest> = {
  't-payapi': {
    note: '결제는 보안 민감도가 높고 외부 PG사 의존성이 있어요. API 통합·예외 처리·웹훅을 별도 이슈로 분리하고, 검증·실패처리는 연동 이후로 의존성을 잡았습니다.',
    total: 8.5,
    issues: [
      { title: '결제 PG사 API 연동 설정', importance: 'high', days: 2 },
      { title: '결제 요청 / 검증 서비스 구현', importance: 'high', days: 2, deps: [0] },
      { title: '결제 실패 처리 및 롤백 로직', importance: 'high', days: 1, deps: [1] },
      { title: '결제 내역 저장 및 조회 API', importance: 'medium', days: 1, deps: [1] },
      { title: '웹훅 수신 및 상태 동기화', importance: 'medium', days: 1, deps: [1] },
      { title: '결제 모듈 단위 테스트', importance: 'low', days: 1, deps: [1, 2] },
    ],
  },
  't-cartapi': {
    note: '장바구니는 동시성·재고 정합성이 핵심이에요. happy path(담기/빼기) 먼저, 검증·병합은 그 이후로 의존성을 잡았습니다.',
    total: 5,
    issues: [
      { title: '장바구니 담기 / 빼기 API', importance: 'high', days: 2 },
      { title: '수량 변경 및 검증', importance: 'medium', days: 1, deps: [0] },
      { title: '비로그인 장바구니 병합', importance: 'medium', days: 1, deps: [0] },
      { title: '장바구니 단위 테스트', importance: 'low', days: 1, deps: [0, 1] },
    ],
  },
}

export const genericSuggest: AISuggest = {
  note: '사용자 경로(happy path)를 먼저, 검증·에러·테스트는 그 이후로 의존성을 잡았습니다 (수직 슬라이스 · SPIDR).',
  total: 4,
  issues: [
    { title: '핵심 동작 구현 (happy path)', importance: 'high', days: 2 },
    { title: '입력 검증 및 에러 처리', importance: 'medium', days: 1, deps: [0] },
    { title: '단위 테스트 작성', importance: 'low', days: 1, deps: [0] },
  ],
}

// 주차 회고 + 리스케줄 추천
export interface RetroRec { level: Importance; title: string; reason: string }
export const retro = {
  week: 2, done: 2, total: 3, prReviewDays: 1.4, closeRate: 78,
  summary: '2주차는 사용자 프로필 페이지가 목표대로 완료됐으나, 장바구니 API PR 리뷰가 3일 지연되어 3주차 장바구니 UI 착수가 어렵습니다. PR 리뷰 속도 개선과 의존성 있는 작업의 우선 리뷰를 권장합니다.',
  recs: [
    { level: 'high', title: '장바구니 UI를 4주차로 이동', reason: '장바구니 API(PR#18) 리뷰 지연으로 3주차 착수 불가' },
    { level: 'medium', title: '결제 시스템 착수일 3/25로 조정', reason: '외부 PG사 API 키 발급 지연 (예상 3일 추가)' },
    { level: 'low', title: '주문 관리 FE를 최유나 → 김민준으로 재배정', reason: '최유나 리뷰 대기 PR 2건으로 과부하 감지' },
  ] as RetroRec[],
}
