# 기술 스택 정의

본 문서는 KB헬스케어 프론트엔드 과제(`docs/requirements.md`, `docs/openapi.yaml`, `docs/job-description.md`)를 수행하기 위한 기술 선택과 근거를 정리한다. 구현/설치는 포함하지 않으며, 선택의 근거와 적용 범위만 기록한다.

## 판단 원칙

1. **요구사항 충족 우선** — 과제 명세(React18/19·TS·폰트·색상 토큰·가상 스크롤·무한 스크롤·폼 유효성·모달·API 목업)를 모두 만족하는 스택 구성.
2. **채용 공고 우대사항 매칭** — 동등한 선택지 중에서는 JD 우대사항(Tanstack Router, Tailwind, RHF, WCAG, FSD, MSW, 로깅) 쪽을 선택.
3. **과제 규모 적합성** — 5개 페이지 수준의 SPA에 과한 러닝/설정 비용을 유발하는 도구는 배제(예: Next.js App Router SSR, 풀 e2e 스택).
4. **런타임/번들 영향 최소화** — 한 가지 책임에 한 가지 도구. 중복 목적 라이브러리 금지.

---

## 1. 언어 · 런타임 · 빌드

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 언어 | **TypeScript 5.x (strict)** | 과제 요구. `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`까지 켜 런타임 오류를 타입에서 선제 차단. |
| UI 런타임 | **React 19** | 과제 요구(18/19 허용). 19의 `use`, Actions, 개선된 ref forwarding을 폼·서스펜스 흐름에 활용 가능. |
| 빌드·개발 서버 | **Vite 5** | SPA 특성(클라이언트 JWT, 서버 렌더 불필요)에 가장 적합. HMR 속도와 설정 단순성. Next.js App Router 대비 accessToken(메모리 보관) 처리에서 서버/클라이언트 경계 복잡도가 없음. |
| 패키지 매니저 | **pnpm** | 디스크 효율·설치 속도·엄격한 의존성 격리. 단일 레포지만 단일 툴 표준화 의미. |
| Node | **20 LTS** | Vite 5·MSW 2 지원선. |

**탈락 안**
- *Next.js 15 (App Router)*: JD 우대사항에 포함되나, 이 과제는 SSR 이득이 없고 `/api/user`·`/api/task`를 브라우저 bearer 토큰으로 호출해야 하므로 서버 컴포넌트 경계가 오히려 오버헤드. Tanstack Router도 우대사항에 병기되어 있어 선택에 감점 없음.
- *Create React App*: 현 시점 유지보수 중단, 제외.

---

## 2. 라우팅

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 라우터 | **@tanstack/react-router (v1)** | JD 우대사항 직접 매칭. 파일 기반·타입 세이프 라우트·로더/서치 파라미터 내장. 라우트 가드(인증 필요 페이지) 구현이 `beforeLoad`에서 선언적으로 처리됨. |
| 라우트 구성 | 파일 기반(routes 디렉터리) | `/`(dashboard), `/sign-in`, `/task`, `/task/$id`, `/user` 5개. `_authed` 레이아웃으로 인증 필요 구간 그룹핑. |

---

## 3. 스타일링 · 디자인 토큰 · 폰트

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| CSS 프레임워크 | **Tailwind CSS v4** (`@tailwindcss/vite`) | JD 우대사항. 과제 규모에서 유틸리티 퍼스트가 페이지별 일회성 스타일 대응에 가장 빠름. v4의 CSS-first 설정(`@theme`)과 Lightning CSS 내장이 "색상 토큰 + Tailwind 매핑" 요구사항과 자연스럽게 맞물림. PostCSS/autoprefixer 불필요. |
| 디자인 토큰 | **`@theme` 블록에 CSS 변수로 선언** | 요구사항의 "색상은 토큰으로 관리". `app/styles/app.css`의 `@theme { --color-primary: …; --color-disabled: …; --color-surface: …; --color-text-*: …; --color-danger: … }`에 시맨틱 토큰을 선언하면 v4가 `bg-primary`, `text-danger` 같은 유틸리티를 자동 생성. 다크모드는 `@theme dark` 또는 토큰 재정의로 대응(과제 범위 밖). |
| 폰트 | **`pretendard` 패키지 (variable, woff2 subset)** | 과제 요구. CDN 대비 오프라인/webview 안정성. `pretendard-variable-subset` import 후 `@theme`의 `--font-sans`에 매핑. |
| 프리미티브(a11y) | **Radix UI Primitives** | WAI-ARIA 준수 `Dialog`(삭제 확인/에러 모달), `Label`, `VisuallyHidden`을 선택적으로 사용. 스타일은 Tailwind로 직접. |
| 유틸 | **clsx**, **tailwind-merge** | 조건부 클래스 조합 + 중복 유틸리티 정리. `cn()` 헬퍼 단일화. |

**비고**
- 별도 UI 컴포넌트 라이브러리(MUI·Chakra 등)는 Tailwind + Radix 조합으로 목적 중복이므로 제외.
- CSS-in-JS(styled-components·emotion)는 Tailwind와 목적 중복이므로 제외.

---

## 4. 폼 · 유효성 검증

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 폼 상태 | **react-hook-form** | JD 우대사항. 비제어 기반 렌더 최소화. 로그인 폼 제출 버튼 활성/비활성 조건을 `formState.isValid`로 선언적 처리. |
| 스키마 유효성 | **zod** + `@hookform/resolvers/zod` | `SignInRequest` 제약(이메일 포맷, 비밀번호 `^[A-Za-z0-9]+$`, 8–24자)을 단일 스키마로 표현하고 타입도 추론. 삭제 확인 모달의 "id 일치" 검증도 동적 스키마로 재사용. |

---

## 5. 상태 관리

| 영역 | 선택 | 근거 |
| --- | --- | --- |
| 서버 상태/캐시 | **@tanstack/react-query v5** | `/api/dashboard`, `/api/user`, `/api/task` 캐시·재시도·중복 요청 제거. 무한 스크롤은 `useInfiniteQuery` 표준 API로 해결. 401→refresh 후 자동 재시도는 전역 `QueryClient` retry + http wrapper 조합. |
| 쿼리 키·옵션 배치 | **엔티티별 `queryOptions` 팩토리** (`entities/{entity}/api/{entity}.queries.ts`) | FSD + React Query 공식 가이드 패턴. 키와 `queryFn`이 한 파일에 응집되어 컴포넌트는 `useQuery(taskQueries.detail(id))` 형태로 사용. 키 문자열을 shared에 흩뿌리지 않음. |
| 클라이언트 전역 상태 | **Zustand** | 메모리 보관 access token 및 인증 여부 단일 스토어. Context 대비 재렌더 제어가 쉽고 보일러플레이트 최소. 확장 시 slice·middleware로 자라날 경로가 표준화되어 "최소한의 확장성" 기준에 부합. 스토어는 `entities/session/model/`에 배치. |
| 폼 로컬 상태 | react-hook-form | 상기. |
| URL 상태 | tanstack-router 서치 파라미터 | 목록 재진입 시 페이지 파라미터, 리다이렉트 후 원복 경로 등. |

**비고**
- Redux Toolkit·Jotai·Recoil은 과제 규모 대비 과함.
- 서버 상태를 Zustand에 보관하는 이중화는 금지(Query가 단일 소스).
- **Queries와 mutations 혼재 금지** — `entities/{entity}/api/`에는 fetch 함수와 `queryOptions` 팩토리만. `useMutation` 훅은 feature slice 또는 사용 페이지에서 직접 작성하고, `onSuccess`에서 대응 팩토리 키(`taskQueries.lists()` 등)로 `invalidateQueries` 호출.

---

## 6. 네트워크 · 인증

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| HTTP 클라이언트 | **fetch + 얇은 커스텀 래퍼** (`shared/api/http.ts`) | axios 대비 번들 축소. `credentials: 'include'`로 refresh 쿠키 전송, 401 응답 시 `/api/refresh` 단일 재시도 파이프라인을 내부에서 처리. |
| QueryClient | **`shared/api/query-client.ts`** 에 단일 인스턴스 | 기본값 `staleTime: 5 * 60_000`, `retry: (failureCount, error) => …` 로 401은 재시도 대상 제외(http 래퍼가 처리). `app/providers/query-provider.tsx`에서 주입. |
| Access Token 보관 | **메모리(Zustand 스토어 `entities/session/model/session.store.ts`)** | XSS 노출 면적 최소화. 로컬스토리지 저장 금지. http 래퍼는 `useAuthStore.getState()`로 React 트리 외부에서도 토큰 접근. |
| Refresh Token 보관 | **httpOnly 쿠키** (서버가 설정, 프런트는 `credentials: 'include'`만) | OpenAPI 명세 `refreshTokenCookie` 스키마 따름. 목업도 Set-Cookie로 동일 동작 모사. |
| 401 재시도 | 요청 인터셉트 → `refresh` 1회 시도 → 성공 시 원 요청 재실행, 실패 시 로그아웃 + `/sign-in` 이동 | 동시 다발 요청은 `refreshPromise` 단일 in-flight로 합류. |
| 세션 복원(부트) | 앱 마운트 직후 `/api/refresh` 1회 호출 → 성공 시 accessToken을 session 스토어에 주입, 실패 시 비로그인 상태로 확정. 이 초기 호출이 완료되기 전까지 `_authed` 가드는 판단을 보류(스플래시/로더). | 새로고침 시 메모리의 accessToken이 소실되므로, httpOnly refresh 쿠키로부터 세션을 재구성해야 가드 race condition과 "새로고침 = 로그아웃" 문제가 없음. |

---

## 7. 목록 렌더링(가상/무한 스크롤)

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 가상 스크롤 | **@tanstack/react-virtual** | 과제 요구("화면에 보여지는/보여질 요소만 렌더링"). 헤드리스·DOM 위임 없음·React Query와 같은 스택 제작사 호환. |
| 무한 스크롤 | **`useInfiniteQuery` + IntersectionObserver 센티넬** | `TaskListResponse.hasNext`로 다음 페이지 판단. Sentinel 요소가 뷰포트에 근접하면 `fetchNextPage()`. 스크롤 이벤트 리스너 대비 리플로우 영향 최소. |

---

## 8. API 목업

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 목업 방식 | **MSW 2.x (Service Worker)** | JD 우대사항·과제 지문의 "익숙한 방법" 중 네트워크 레이어 수준에서 동작 → 프로덕션과 동일한 `fetch` 경로를 개발에서 그대로 사용. 실 백엔드 연결 시 스위치 오프만 하면 됨. |
| 핸들러 구성 | 엔드포인트별 핸들러 + 시드 데이터 팩토리 | `/api/sign-in`(성공/400), `/api/refresh`(쿠키 검증·401), `/api/user`, `/api/dashboard`, `/api/task?page=`(페이지네이션·hasNext), `/api/task/:id`(200/404), `DELETE /api/task/:id`. |
| 목 데이터 생성 | `@faker-js/faker`(dev 의존) | 무한 스크롤 검증에 충분한 태스크 세트(예: 300건) 시드. |
| 토글 | 환경변수 `VITE_ENABLE_MSW` | 실제 백엔드 붙일 때 스위치 오프. |

---

## 9. 품질 · 도구

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 린터 | **ESLint 9 (flat config)** + `@typescript-eslint`, `eslint-plugin-react`, `react-hooks`, `react-refresh`, **`eslint-plugin-jsx-a11y`**, `@tanstack/eslint-plugin-query` | JD 우대사항(WCAG) 대응은 `jsx-a11y` 규칙으로 정적 보장. |
| 포맷터 | **Prettier** (+ `prettier-plugin-tailwindcss`) | Tailwind 클래스 정렬 자동화. |
| 커밋 메시지 | Conventional Commits(수동) | 과제 규모에서 commitlint 도입은 오버. |
| 타입 검사 | `pnpm typecheck` 스크립트(`tsc --noEmit`) | Vite 빌드와 분리해 타입만 검증. |

---

## 10. 접근성 · 성능 · Webview 대응

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 폼 라벨 | `<label htmlFor>` 또는 Radix `Label` 필수(요구사항 명시). | 요구사항 직접 충족. |
| 포커스 관리 | 모달 열림 시 포커스 트랩(Radix Dialog 내장), 닫힘 시 트리거로 복귀. | WCAG 2.4.3. |
| 반응형 높이 | `100dvh`/`100svh` 우선, iOS fallback 포함. | JD 우대사항(Webview). |
| 안전 영역 | `env(safe-area-inset-*)` 클래스 유틸화(Tailwind plugin 또는 arbitrary). | Webview 하단 홈 인디케이터·노치 대응. |
| 애니메이션 | 레이아웃 트리거 속성(`top/left/width/height`) 대신 `transform/opacity`만 사용. | JD 우대사항(Reflow/Repaint). |
| 번들 분할 | 라우트 단위 code splitting(Tanstack Router `lazyRouteComponent`). | 초기 진입 비용 완화. |

---

## 11. 아키텍처 — FSD(Feature-Sliced Design)

JD 우대사항. 과제 규모에 맞게 **필요한 계층만** 사용하되, React Query 배치는 공식 가이드(`feature-sliced.design/docs/guides/tech/with-react-query`)의 `queryOptions` 팩토리 패턴을 따른다.

```
src/
├─ app/
│  ├─ providers/
│  │  ├─ query-provider.tsx        # shared/api/query-client 주입
│  │  ├─ router-provider.tsx
│  │  └─ error-boundary.tsx
│  ├─ styles/                      # tailwind entry, pretendard import, CSS 변수 토큰
│  └─ main.tsx
├─ routes/                          # TanStack Router 파일 기반(얇은 바인딩만)
│  ├─ __root.tsx
│  ├─ _authed.tsx                  # beforeLoad에서 session 스토어 확인
│  ├─ _authed.index.tsx            # → pages/dashboard
│  ├─ _authed.task.index.tsx       # → pages/task-list
│  ├─ _authed.task.$id.tsx         # → pages/task-detail
│  ├─ _authed.user.tsx             # → pages/user
│  └─ sign-in.tsx                  # → pages/sign-in
├─ pages/                           # 페이지 조립(Query 훅 + Widget + UI)
│  ├─ dashboard/
│  ├─ sign-in/                     # 로그인 폼 + useMutation(signIn) 직접 호출
│  ├─ task-list/
│  ├─ task-detail/
│  └─ user/
├─ widgets/
│  ├─ gnb/                         # GNB/LNB (로그인/로그아웃 동작 포함)
│  └─ task-list/                   # 가상+무한 스크롤 컨테이너
├─ features/
│  └─ task-delete/                 # 유일한 feature slice
│     ├─ ui/delete-task-dialog.tsx
│     ├─ api/use-delete-task.ts    # useMutation + onSuccess: invalidate(taskQueries.lists())
│     └─ model/delete-schema.ts    # id 일치 zod 스키마
├─ entities/
│  ├─ task/
│  │  ├─ api/
│  │  │  ├─ task.queries.ts        # queryOptions 팩토리 (all/lists/infiniteList/details/detail)
│  │  │  ├─ get-tasks.ts
│  │  │  ├─ get-task.ts
│  │  │  └─ delete-task.ts         # fetch 함수만(mutation 훅은 feature가 소유)
│  │  └─ model/task.ts             # TaskItem 타입
│  ├─ user/
│  │  ├─ api/
│  │  │  ├─ user.queries.ts
│  │  │  └─ get-user.ts
│  │  └─ model/user.ts
│  └─ session/
│     ├─ api/
│     │  ├─ sign-in.ts             # fetch 함수
│     │  └─ refresh.ts             # fetch 함수
│     └─ model/
│        └─ session.store.ts       # Zustand(accessToken, isAuthenticated)
└─ shared/
   ├─ api/
   │  ├─ http.ts                   # fetch 래퍼(401 → refresh 단일 in-flight)
   │  ├─ query-client.ts           # QueryClient 인스턴스(staleTime 기본값)
   │  └─ mocks/                    # MSW 핸들러 + browser/node setup
   ├─ config/                      # env, route paths (query keys는 두지 않음)
   ├─ ui/                          # Button, Input, Modal(Radix 래퍼), Spinner, EmptyState
   └─ lib/                         # cn, formatDate
```

**계층·세그먼트 규약**
- 각 slice 내부 세그먼트: `api/`(fetch 함수 + `queryOptions` 팩토리), `model/`(타입·상태·파생), `ui/`(선택), `lib/`(선택). 파일 1~2개로 충분한 slice는 단일 파일 허용.
- `queryOptions` 팩토리는 `all() → lists()/details() → list()/detail()` 네이밍 컨벤션을 따른다. 키 문자열을 `shared`에 두지 않음.
- **queries와 mutations 혼재 금지** — `entities/*/api/`는 read(쿼리)만, `useMutation` 훅은 feature slice(또는 단발성일 때 해당 페이지)에서 직접 작성. mutation 성공 시에는 대상 entity 팩토리 키(`taskQueries.lists()` 등)로 `invalidateQueries` 호출.
- `dashboard`는 엔티티로 두지 않음(응답이 집계 3필드뿐 → 뷰 모델 성격). `pages/dashboard` 내부에 `queryOptions`를 두거나 `shared/api` 호출로 직접 처리.
- 각 slice는 **`index.ts` public API만 외부 노출**. slice 내부 파일 직접 import 금지(ESLint `no-restricted-imports` 또는 `eslint-plugin-boundaries`로 강제).
- `widgets/`는 GNB/LNB·task-list 조립에만 사용, `processes/` 미사용.
- 의존성 방향: **`app → routes → pages → widgets → features → entities → shared`** 단방향. 동일 레이어 간 cross-slice import도 금지(lint로 강제).

---

## 12. 에러 처리

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 전역 에러 바운더리 | **react-error-boundary** (`ErrorBoundary` + `useErrorBoundary`) | 페이지 단위 fallback 제공, 리셋 가능. |
| 네트워크 에러 표면화 | 로그인은 **모달로 `errorMessage` 노출(요구사항)**, 그 외 조회 오류는 인라인 상태 메시지 + 재시도 버튼. | 요구사항·UX 분리. |
| 404 상세 페이지 | 목록 복귀 버튼 포함한 전용 빈 상태 컴포넌트. | 요구사항 직접 충족. |

---

## 13. 환경 설정 · 배포

| 항목 | 결정 |
| --- | --- |
| 환경 변수 | `.env.development`, `.env.production`. `VITE_API_BASE_URL`, `VITE_ENABLE_MSW`. 비밀 값 없음(과제). |
| 브라우저 타깃 | 최신 2개 메이저 + iOS Safari 15+(webview 고려). Tailwind/Vite 기본 설정으로 커버. |
| 산출물 | `pnpm build` → 정적 번들. 배포 자체는 과제 필수사항 아님. |
| AI 사용 기록 | `AI_USAGE.md`(요구사항). 도구/모델·범위·핵심 프롬프트·사람 검증 항목 명시. |

---

## 14. 최종 의존성 표 (설치 계획)

### runtime
- `react`, `react-dom`
- `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-virtual`
- `zustand`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `@radix-ui/react-dialog`, `@radix-ui/react-label`
- `clsx`, `tailwind-merge`
- `react-error-boundary`
- `pretendard`

### dev
- `typescript`, `@types/react`, `@types/react-dom`
- `vite`, `@vitejs/plugin-react`
- `tailwindcss` (v4), `@tailwindcss/vite`, `prettier-plugin-tailwindcss`
- `eslint`, `@typescript-eslint/*`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`, `@tanstack/eslint-plugin-query`
- `prettier`
- `msw`, `@faker-js/faker`
- `@tanstack/router-plugin`(파일 기반 라우트 생성)

---

## 15. 요구사항 ↔ 스택 매핑(자체 점검)

| 요구사항 | 충족 수단 |
| --- | --- |
| React 18/19 + TS | React 19 + TS 5 strict |
| 색상 토큰 | CSS 변수 + Tailwind theme 매핑 |
| Pretendard | `pretendard` 패키지 |
| GNB/LNB 분기(인증 상태) | `widgets/gnb` + `entities/session/model/session.store.ts` 구독 |
| 로그인 유효성·제출 | `pages/sign-in` (RHF + zod, OpenAPI 규약 반영) + `entities/session/api/sign-in.ts` |
| 에러 모달 | Radix Dialog + `shared/ui/modal` |
| 대시보드 수치 | `pages/dashboard` 내부 `queryOptions` → `useQuery(dashboardQueries.summary())` |
| 가상 스크롤 | `widgets/task-list` + `@tanstack/react-virtual` |
| 무한 스크롤 | `useInfiniteQuery(taskQueries.infiniteList())` + IntersectionObserver |
| 상세 404 화면 | 라우트 loader or Query `error` 상태 분기 |
| 삭제 확인 모달(id 일치) | `features/task-delete` (Radix Dialog + RHF + 동적 zod + useMutation) |
| 회원정보 표시 | `useQuery(userQueries.me())` in `pages/user` |
| API 목업 제출 | MSW 핸들러 `src/shared/api/mocks/` |
| AI 사용 기록 | `AI_USAGE.md` |

---

## 16. 명시적으로 채택하지 않은 것

- **Next.js / Remix** — SSR 이득 없음.
- **Redux, MobX, Jotai, Recoil** — Query+Zustand로 충분.
- **axios, ky** — fetch 래퍼로 대체.
- **styled-components, emotion, vanilla-extract** — Tailwind와 목적 중복.
- **Storybook** — 과제 규모 대비 셋업·유지 비용 큼. 컴포넌트는 실제 페이지에서 검증.
- **Vitest / Testing Library / Playwright / Cypress 등 테스트 프레임워크 일체** — 요구사항 외. 과제 규모 판단으로 범위 외. 대상 3건(로그인 유효성·401/refresh·삭제 모달 id 일치)의 수동 검증 비용이 프레임워크 셋업 비용보다 낮음. 판단 근거는 `AI_USAGE.md`에 기록. TDD 경험(JD 우대)은 과거 프로젝트 경험으로 소명.
- **i18n 라이브러리** — 단일 언어(ko).
- **Sentry/Datadog 실 연동** — 추상화만 준비, 실제 SaaS 연동은 범위 외.
