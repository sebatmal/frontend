# DevFlow — 파이프라인 정의 (1차 발표용)

> 핵심: **GitHub 위 "읽기 렌즈"** — 데이터는 GitHub이 이미 다 안다. 우리는 끌어와 한 화면에 모은다.
> 1차는 **목(mock) API**로 동작. 백엔드 생기면 `src/mock/api.ts`만 fetch로 교체 → FE 화면 코드는 그대로.

## 실행

```
npm install
npm run dev      # http://localhost:5173 (사용 중이면 5174)
npm run build    # 타입체크 + 번들 (검증됨)
```

## 폴더 구조

```
src/
 ├─ types.ts              # 도메인 타입(= FE·BE 공유 계약)
 ├─ mock/
 │   ├─ data.ts           # 목 데이터(쇼핑몰 플랫폼 예시)
 │   └─ api.ts            # 목 API ← 여기만 실제 fetch로 교체
 ├─ components/           # Sidebar, Topbar, icons
 ├─ pages/                # 화면 4개
 │   ├─ GraphPage.tsx     # 1순위: 통합 의존성 그래프 (React Flow)
 │   ├─ MyWorkPage.tsx    # 2순위: 내 작업 (내가/남이 풀어야)
 │   ├─ TeamPage.tsx      # 3·4순위: 팀 부하 + PR 리뷰 현황
 │   └─ SchedulePage.tsx  # 스케줄(로드맵)
 ├─ styles/               # tokens.css(우리 디자인 토큰), app.css
 └─ App.tsx               # 탭 4개 셸
```

## 데이터 흐름 (목 → 실제 전환)

```
[GitHub]  ──(나중)──►  [BE 집계 API]  ──►  api.ts  ──►  pages
                                          ▲
                              1차엔 mock/data.ts 가 이 자리
```

- `api.ts` 함수 시그니처 = **API 계약**. 실제 전환 시 함수 본문만 `fetch('/api/...')`로 바꾸면 됨.
- 화면(pages)은 `api`만 의존 → 목/실제 무관하게 동일 동작.

## API 계약 (목 ↔ 실제 매핑)

| 목 함수            | 실제 엔드포인트                 | 반환               |
| ------------------ | ------------------------------- | ------------------ |
| `api.getProject()` | `GET /api/projects/:id`         | Project            |
| `api.getMembers()` | `GET /api/projects/:id/members` | Member[]           |
| `api.getTasks()`   | `GET /api/projects/:id/tasks`   | Task[] (deps 포함) |
| `api.getPRs()`     | `GET /api/projects/:id/prs`     | PullRequest[]      |

> 응답 래퍼·에러 포맷은 `세종해커톤_키트/10_API명세_템플릿.md` 규약 따름.

## 탭 4개 = 페인포인트 4개 (축소)

1. **의존성 흐름** — 노드(이슈)+선(의존)+색(상태) 한 화면. 신규자도 “뭐부터 시작?”이 보임. (토대)
2. **내 작업** — 같은 데이터, 두 방향: 내가 움직여야 / 남이 움직여야. (도구임을 증명)
3. **팀** — 팀원 부하 막대 + PR 리뷰 현황(머지 가능 판정). (일 가져올지 판단 근거)
4. **스케줄** — 주차 로드맵. (다음 단계: 드래그 이동 · AI 이슈 분해)

## 다음 단계 (차근차근)

- [ ] 그래프 노드 클릭 → 이슈 상세(선행/후행 의존, 본문) 모달
- [ ] 그래프에 주차 그룹 배경(1주차/2주차…) 레인
- [ ] 스케줄: 기능 드래그 이동 + AI 이슈 분해(17\_방법론 기반)
- [ ] GitHub OAuth 로그인 + 실제 api.ts 교체
- [ ] 머지 가능 뱃지(팀 룰: N approve)
