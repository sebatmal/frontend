# DevFlow — 코딩 팀프로젝트 협업·진행 시각화 (프론트엔드)

세종대학교 AI·SW 해커톤 · 팀 sebatmal

스케줄(드래그) · 기능 → 이슈 분리(의존성) · 통합 의존성 그래프 · 내 작업 · 팀 현황을 한 곳에서.
1차는 **목(mock) API** 기반 — `src/mock/api.ts` 함수 본문만 `fetch`로 교체하면 실제 백엔드와 연동됩니다. 상태는 중앙 스토어(`src/store.tsx`)에서 동기화됩니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 (사용 중이면 5174)
npm run build      # 타입체크 + 번들
```

## 스택

React 18 + Vite + TypeScript + @xyflow/react

## 구조

```
src/
 ├─ types.ts          # 도메인 타입(FE·BE 공유 계약)
 ├─ mock/             # 목 데이터 + 목 API
 ├─ store.tsx         # 중앙 상태(목 서버)
 ├─ components/       # Sidebar, Topbar, icons
 └─ pages/            # Login, Schedule, Graph, MyWork, Team
```

자세한 파이프라인 정의는 [PIPELINE.md](./PIPELINE.md) 참고.
ddd
ddd
ddd
dddd
