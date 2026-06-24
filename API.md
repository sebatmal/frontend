# DevFlow API 명세서 (백엔드 · 최종)

> 실제 구현(`com.sebatmal.devflow`) 기준. 컨벤션: Spring Boot 3 · Java 21 · `{data}` 응답 래퍼 · `FailMessage`(int code) 에러 · JWT(`@Authentication`).

---

## 0. 공통 규약

- **Base URL**: `http://localhost:8080/api` (배포 시 도메인 교체)
- **성공 응답**: `{ "data": <payload> }`
  - ⚠️ **예외 1곳**: `GET /auth/github/callback` 은 FE 계약상 래퍼 없이 평평하게(`{ "token": ... }`) 반환
- **에러 응답**: `{ "code": <int>, "message": "<한글>" }` + HTTP status
- **인증**: 필요한 API는 `Authorization: Bearer {accessToken}` (로그인 시 발급한 우리 JWT)
- **status**: 조회·수정 200 / 생성 201 / 삭제 200 / 검증 400 / 인증 401 / 권한 403 / 없음 404 / 충돌 409 / 서버 500 / 외부(GitHub) 502
- **날짜**: ISO-8601 / 필드 camelCase

### 공통 Enum

| Enum         | 값                                                        |
| ------------ | --------------------------------------------------------- |
| `TaskType`   | `FEATURE` `ISSUE`                                         |
| `TaskStatus` | `PLANNED` `INPROGRESS` `REVIEW` `BLOCKED` `MERGED` `OPEN` |
| `Lane`       | `BE` `FE` `AI` `INFRA`                                    |
| `PrReview`   | `WAIT` `CHANGES` `APPROVED` `MERGED`                      |

### 에러 코드

| code  | status | 의미                            |
| ----- | ------ | ------------------------------- |
| 40000 | 400    | 잘못된 요청                     |
| 40001 | 400    | 요청 본문 검증 실패             |
| 40002 | 400    | 필수 파라미터 없음              |
| 40006 | 400    | 자기 자신은 선행이 될 수 없음   |
| 40100 | 401    | 인증 필요                       |
| 40101 | 401    | 토큰 만료                       |
| 40102 | 401    | 인증 정보 없음(헤더)            |
| 40103 | 401    | 토큰 정보 오류                  |
| 40104 | 401    | GitHub 토큰 없음(재로그인 필요) |
| 40402 | 404    | 유저 없음                       |
| 40403 | 404    | 프로젝트 없음                   |
| 40404 | 404    | 작업 없음                       |
| 40405 | 404    | 의존성 없음                     |
| 40406 | 404    | 멤버 없음                       |
| 40901 | 409    | 순환 의존(거부)                 |
| 40902 | 409    | 중복 의존성                     |
| 40903 | 409    | 이미 이슈가 생성된 기능         |
| 40904 | 409    | 의존성 순서 때문에 이동 불가    |
| 50000 | 500    | 서버 오류                       |
| 50200 | 502    | GitHub 인증 실패                |
| 50201 | 502    | GitHub API 실패                 |

> **Task 모델**(여러 응답 공유): `id`(long) · `title` · `type`(TaskType) · `parentId`(long, 이슈가 속한 기능) · `status`(TaskStatus) · `lane`(Lane) · `week`(int, 0=1주차) · `row`(int) · `assigneeMemberId`(long) · `githubIssueNumber`(int) · `isSplit`(bool) · `deps`(long[], 선행 task id)

---

# 인증

## GitHub 로그인 시작

`GET /api/auth/github/login`

GitHub authorize 페이지로 302 리다이렉트. **FE가 직접 authorize URL로 보내는 경우(현재 방식) 안 써도 됨.**

---

## GitHub 콜백 — code → 토큰 교환 ⚠️ 평평한 응답

`GET /api/auth/github/callback?code={code}`

FE CallbackPage가 GitHub에서 받은 `code`를 전달 → 토큰 교환 후 우리 JWT 발급.

### 1. 요청

| Name | Type   | Description                     |
| ---- | ------ | ------------------------------- |
| code | string | GitHub OAuth code (필수, Query) |

### 2. 응답

status: 200 OK — **`{data}` 래퍼 없음**
| Name | Type | Description |
| --- | --- | --- |
| token | string | 이후 Bearer로 쓰는 JWT |
| user | object | 로그인 사용자 |
| user.id | long | 우리 유저 id |
| user.githubId | long | GitHub 유저 id |
| user.login | string | GitHub 로그인명 |
| user.name | string | 이름 |
| user.avatarUrl | string | 아바타 |

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "githubId": 12345,
    "login": "INSANE-P",
    "name": "박찬빈",
    "avatarUrl": "https://avatars.githubusercontent.com/u/12345"
  }
}
```

### 3. 예외 상황

```json
{ "code": 50200, "message": "GitHub 인증에 실패했습니다." }
```

---

## 내 정보

`GET /api/me` · 인증: 필요(Bearer)

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| id | long | 유저 id |
| githubId | long | GitHub id |
| login | string | 로그인명 |
| name | string | 이름 |
| avatarUrl | string | 아바타 |

```json
{
  "data": {
    "id": 1,
    "githubId": 12345,
    "login": "INSANE-P",
    "name": "박찬빈",
    "avatarUrl": "..."
  }
}
```

### 3. 예외 상황

```json
{ "code": 40102, "message": "인증 정보가 없습니다." }
{ "code": 40101, "message": "토큰이 만료되었습니다." }
```

---

# 조직 (org 연결)

## org 연결 — 멤버·레포 불러오기

`POST /api/organizations/{org}/connect` · 인증: 필요(Bearer)

GitHub org의 멤버·레포를 가져와 upsert. 같은 org 멤버가 같은 데이터를 공유하는 진입점.

### 1. 요청

| Name | Type   | Description                                  |
| ---- | ------ | -------------------------------------------- |
| org  | string | 경로 변수 — GitHub org 로그인 (예: sebatmal) |

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| organizationId | long | 조직 id |
| githubLogin | string | org 로그인 |
| name | string | org 이름 |
| projects | array | 레포 목록(ProjectResponse) |
| members | array | 멤버 목록(MemberResponse) |
| members[].id | long | 멤버 id |
| members[].githubLogin | string | 로그인명 |
| members[].name | string | 이름 |
| members[].avatarUrl | string | 아바타 |
| members[].role | string | 역할(없을 수 있음) |
| members[].color | string | 아바타 색 |
| members[].userId | long | 로그인했으면 연결된 유저 id |

```json
{
  "data": {
    "organizationId": 1,
    "githubLogin": "sebatmal",
    "name": "sebatmal",
    "projects": [
      {
        "id": 1,
        "name": "shop",
        "githubOwner": "sebatmal",
        "githubRepo": "shop",
        "sprintLabel": null,
        "dDay": null
      }
    ],
    "members": [
      {
        "id": 1,
        "githubLogin": "INSANE-P",
        "name": "박찬빈",
        "avatarUrl": "...",
        "role": null,
        "color": "#7048E8",
        "userId": 1
      }
    ]
  }
}
```

### 3. 예외 상황

```json
{ "code": 40104, "message": "GitHub 토큰이 없습니다. 다시 로그인해 주세요." }
{ "code": 50201, "message": "GitHub API 호출에 실패했습니다." }
```

---

# 프로젝트 · 멤버

## 프로젝트 조회

`GET /api/projects/{projectId}` · 인증: 불필요

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| id | long | 프로젝트 id |
| name | string | 이름 |
| githubOwner | string | org 로그인 |
| githubRepo | string | 레포명 |
| sprintLabel | string | 스프린트 표기 |
| dDay | int | 남은 일수 |

```json
{
  "data": {
    "id": 1,
    "name": "shop",
    "githubOwner": "sebatmal",
    "githubRepo": "shop",
    "sprintLabel": "스프린트 2/5",
    "dDay": 18
  }
}
```

### 3. 예외 상황

```json
{ "code": 40403, "message": "프로젝트를 찾을 수 없습니다." }
```

---

## 멤버 목록 (프로젝트 → org 멤버)

`GET /api/projects/{projectId}/members` · 인증: 불필요

### 2. 응답

status: 200 OK — `data`는 MemberResponse 배열 (필드는 org 연결 응답과 동일)

```json
{
  "data": [
    {
      "id": 1,
      "githubLogin": "INSANE-P",
      "name": "박찬빈",
      "avatarUrl": "...",
      "role": null,
      "color": "#7048E8",
      "userId": 1
    }
  ]
}
```

---

# 작업 · 기능 · 이슈

## 작업 목록 (의존성 포함 — 그래프/스케줄 공용)

`GET /api/projects/{projectId}/tasks` · 인증: 불필요

### 2. 응답

status: 200 OK — Task 모델 배열

```json
{
  "data": [
    {
      "id": 10,
      "title": "결제 시스템",
      "type": "FEATURE",
      "parentId": null,
      "status": "PLANNED",
      "lane": "BE",
      "week": 3,
      "row": 3,
      "assigneeMemberId": null,
      "githubIssueNumber": null,
      "isSplit": true,
      "deps": [7]
    },
    {
      "id": 11,
      "title": "결제 요청 API",
      "type": "ISSUE",
      "parentId": 10,
      "status": "INPROGRESS",
      "lane": "BE",
      "week": 3,
      "row": 4,
      "assigneeMemberId": 2,
      "githubIssueNumber": 42,
      "isSplit": false,
      "deps": [10]
    }
  ]
}
```

---

## 기능 추가

`POST /api/projects/{projectId}/features` · 인증: 불필요

### 1. 요청

| Name       | Type   | Description         |
| ---------- | ------ | ------------------- |
| title      | string | 기능명 (필수)       |
| week       | int    | 주차 (필수)         |
| lane       | Lane   | 분류 (필수)         |
| depTaskIds | long[] | 선행 작업 id (선택) |

```json
{ "title": "결제 시스템", "week": 3, "lane": "BE", "depTaskIds": [7] }
```

### 2. 응답

status: 201 Created — 생성된 Task 모델

```json
{
  "data": {
    "id": 10,
    "title": "결제 시스템",
    "type": "FEATURE",
    "parentId": null,
    "status": "PLANNED",
    "lane": "BE",
    "week": 3,
    "row": 3,
    "assigneeMemberId": null,
    "githubIssueNumber": null,
    "isSplit": false,
    "deps": [7]
  }
}
```

### 3. 예외 상황

```json
{ "code": 40001, "message": "기능명은 필수입니다." }
{ "code": 40403, "message": "프로젝트를 찾을 수 없습니다." }
```

---

## 작업 주차 이동 (드래그 일정)

`PATCH /api/tasks/{taskId}` · 인증: 불필요

서버가 의존성 순서를 재검증(선행보다 앞·후행보다 뒤 금지).

### 1. 요청

| Name | Type | Description      |
| ---- | ---- | ---------------- |
| week | int  | 옮길 주차 (필수) |

```json
{ "week": 2 }
```

### 2. 응답

status: 200 OK — 변경된 Task 모델

### 3. 예외 상황

```json
{ "code": 40404, "message": "작업을 찾을 수 없습니다." }
{ "code": 40904, "message": "의존성 순서 때문에 이 주차로 옮길 수 없습니다." }
```

---

## 이슈 분리 확정 (이슈 생성 + 의존성 + GitHub 이슈)

`POST /api/features/{featureId}/issues` · 인증: 필요(Bearer)

추천 이슈를 승인해 확정. 이슈 Task 생성 + 의존성 연결 + (토큰 있으면) 실제 GitHub 이슈 생성.

### 1. 요청

| Name                     | Type   | Description                           |
| ------------------------ | ------ | ------------------------------------- |
| items                    | array  | 생성할 이슈 (필수, 1개+)              |
| items[].title            | string | 제목 (필수)                           |
| items[].assigneeMemberId | long   | 담당 멤버 (선택)                      |
| items[].depItemIndexes   | int[]  | 같은 요청 내 선행 이슈의 index (선택) |

```json
{
  "items": [
    { "title": "결제 PG 연동", "assigneeMemberId": null, "depItemIndexes": [] },
    { "title": "결제 요청 API", "assigneeMemberId": 2, "depItemIndexes": [0] }
  ]
}
```

### 2. 응답

status: 201 Created
| Name | Type | Description |
| --- | --- | --- |
| featureId | long | 기능 id |
| created | int | 생성된 이슈 수 |
| issues | array | 생성 이슈(Task 모델) |
| addedDeps | array | 추가된 의존성(DependencyResponse) |

```json
{
  "data": {
    "featureId": 10,
    "created": 2,
    "issues": [
      {
        "id": 11,
        "title": "결제 PG 연동",
        "type": "ISSUE",
        "parentId": 10,
        "status": "PLANNED",
        "lane": "BE",
        "week": 3,
        "row": 4,
        "assigneeMemberId": null,
        "githubIssueNumber": 42,
        "isSplit": false,
        "deps": [7]
      }
    ],
    "addedDeps": [
      { "id": 5, "fromTaskId": 11, "toTaskId": 12, "githubLinked": true }
    ]
  }
}
```

### 3. 예외 상황

```json
{ "code": 40404, "message": "작업을 찾을 수 없습니다." }
{ "code": 40903, "message": "이미 이슈가 생성된 기능입니다." }
{ "code": 40001, "message": "이슈는 1개 이상이어야 합니다." }
```

---

# 의존성

## 의존성 생성 (위상정렬 검증 + GitHub blocked_by)

`POST /api/dependencies` · 인증: 필요(Bearer)

`from`이 끝나야 `to` 시작 (= to is blocked_by from). 추가 후 **위상정렬로 순환 검사**, 통과 시 저장 + (둘 다 GitHub 이슈면) blocked_by 반영.

### 1. 요청

| Name       | Type | Description      |
| ---------- | ---- | ---------------- |
| fromTaskId | long | 선행 작업 (필수) |
| toTaskId   | long | 후행 작업 (필수) |

```json
{ "fromTaskId": 11, "toTaskId": 12 }
```

### 2. 응답

status: 201 Created
| Name | Type | Description |
| --- | --- | --- |
| id | long | 의존성 id |
| fromTaskId | long | 선행 |
| toTaskId | long | 후행 |
| githubLinked | bool | GitHub blocked_by 반영 여부 |

```json
{ "data": { "id": 5, "fromTaskId": 11, "toTaskId": 12, "githubLinked": true } }
```

### 3. 예외 상황

```json
{ "code": 40006, "message": "자기 자신은 선행이 될 수 없습니다." }
{ "code": 40404, "message": "작업을 찾을 수 없습니다." }
{ "code": 40901, "message": "순환 의존이 생겨 추가할 수 없습니다." }
{ "code": 40902, "message": "이미 연결된 의존성입니다." }
```

---

## 의존성 삭제

`DELETE /api/dependencies?from={fromTaskId}&to={toTaskId}` · 인증: 불필요

### 2. 응답

status: 200 OK

```json
{ "data": null }
```

### 3. 예외 상황

```json
{ "code": 40405, "message": "의존성을 찾을 수 없습니다." }
```

---

# PR

## PR 목록 (팀 현황 · 내 작업 공용)

`GET /api/projects/{projectId}/prs` · 인증: 불필요

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| items[].number | int | PR 번호 |
| items[].title | string | 제목 |
| items[].authorMemberId | long | 작성자 멤버 id |
| items[].reviewerMemberId | long | 리뷰어 멤버 id |
| items[].review | PrReview | 리뷰 상태 |
| items[].ageDays | int | 경과 일수 |
| items[].approvals / reviewers / comments | int | 승인·리뷰어·코멘트 수 |
| items[].url | string | PR 링크 |
| items[].linkedTaskId | long | 연결 작업 id |

```json
{
  "data": [
    {
      "id": 1,
      "number": 18,
      "title": "장바구니 API",
      "authorMemberId": 3,
      "reviewerMemberId": 2,
      "review": "WAIT",
      "ageDays": 3,
      "approvals": 0,
      "reviewers": 1,
      "comments": 2,
      "url": "https://github.com/sebatmal/shop/pull/18",
      "linkedTaskId": 12
    }
  ]
}
```

---

# GitHub 이슈 (직접 생성)

## 이슈 생성

`POST /api/repos/{owner}/{repo}/issues` · 인증: 필요(Bearer)

로그인 유저의 GitHub 토큰으로 실제 이슈 생성.

### 1. 요청

| Name      | Type     | Description          |
| --------- | -------- | -------------------- |
| title     | string   | 제목 (필수)          |
| body      | string   | 본문 (선택)          |
| assignees | string[] | GitHub 로그인 (선택) |
| labels    | string[] | 라벨 (선택)          |

```json
{ "title": "결제 요청 API", "body": "PG 승인 요청", "labels": ["BE"] }
```

### 2. 응답

status: 201 Created
| Name | Type | Description |
| --- | --- | --- |
| number | int | 생성된 이슈 번호 |
| title | string | 제목 |
| state | string | 상태(open) |
| htmlUrl | string | 이슈 링크 |

```json
{
  "data": {
    "number": 42,
    "title": "결제 요청 API",
    "state": "open",
    "htmlUrl": "https://github.com/sebatmal/shop/issues/42"
  }
}
```

### 3. 예외 상황

```json
{ "code": 40104, "message": "GitHub 토큰이 없습니다. 다시 로그인해 주세요." }
{ "code": 50201, "message": "GitHub API 호출에 실패했습니다." }
```

---

# AI (현재 스텁 · 추후 LLM)

## 이슈 분해 추천

`POST /api/features/{featureId}/suggest-issues` · 인증: 불필요

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| note | string | 분해 근거 |
| total | number | 예상 총 일수 |
| issues[].title | string | 이슈 제목 |
| issues[].importance | string | high/medium/low |
| issues[].days | int | 예상 일수 |
| issues[].deps | int[] | 같은 목록 내 선행 index |

```json
{
  "data": {
    "note": "[스텁] ... LLM 연동 후 제공",
    "total": 4,
    "issues": [
      {
        "title": "핵심 동작 구현 (happy path)",
        "importance": "high",
        "days": 2,
        "deps": []
      },
      {
        "title": "입력 검증 및 예외 처리",
        "importance": "medium",
        "days": 1,
        "deps": [0]
      }
    ]
  }
}
```

---

## 의존성 추천 (활성 이슈만 대상)

`POST /api/projects/{projectId}/suggest-dependencies` · 인증: 불필요

머지 안 된 활성 이슈만 입력으로 후보 추천 (완료 서브그래프는 동결).

### 2. 응답

status: 200 OK
| Name | Type | Description |
| --- | --- | --- |
| candidates[].fromTaskId | long | 선행 |
| candidates[].toTaskId | long | 후행 |
| candidates[].reason | string | 근거 |
| candidates[].confidence | number | 신뢰도 0~1 |

```json
{ "data": { "candidates": [] } }
```

---

## 부록 · 인증 필요 여부 요약

| 엔드포인트                                            | 인증                              |
| ----------------------------------------------------- | --------------------------------- | ------ |
| `GET /auth/github/callback`, `GET /auth/github/login` | 불필요                            |
| `GET /me`                                             | **필요**                          |
| `POST /organizations/{org}/connect`                   | **필요**                          |
| `GET /projects/{id}` `/members` `/tasks` `/prs`       | 불필요                            |
| `POST /projects/{id}/features`, `PATCH /tasks/{id}`   | 불필요                            |
| `POST /features/{id}/issues`                          | **필요**                          |
| `POST /dependencies`                                  | **필요** · `DELETE /dependencies` | 불필요 |
| `POST /repos/{owner}/{repo}/issues`                   | **필요**                          |
| `POST .../suggest-issues`, `.../suggest-dependencies` | 불필요                            |

> 조회·일부 변경은 현재 열려 있음 — 운영 전 인증 적용 권장.
