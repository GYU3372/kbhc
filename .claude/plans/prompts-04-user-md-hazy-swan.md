# Phase 04 — 사용자 플로우 (GNB · 로그인 · 회원정보)

## Context

Phase 01–03까지 라우트 골조, shared/ui, MSW 핸들러, Zustand 세션 스토어 골격이 준비됐지만 실제로 연결된 사용자 플로우는 비어 있다. Phase 04는 [prompts/04-user.md](prompts/04-user.md) 지시대로 **GNB·로그인·회원정보**를 하나의 Phase로 묶어 구현하고, 동시에 Phase 05+(목록/상세)가 의존할 공통 기반 — 세션 스토어 setter 확장, HTTP 401→refresh 인터셉터, `_authed` 가드, 앱 부트 세션 복원 — 을 함께 정돈한다.

요구사항([docs/requirements.md](docs/requirements.md)) 기준:
- 내비게이션은 **GNB/LNB 두 영역**으로 분할
  - GNB(상단): 로그인 여부에 따라 `회원정보 ↔ 로그인` 아이콘
  - LNB(좌측, `_authed` 전용): 대시보드, 할 일
- 로그인: email(이메일 포맷) + password(영숫자 8–24), 유효 시 제출 활성화, 비-200은 `errorMessage` 모달, 성공 시 세션 수립 + 리다이렉트
- 회원정보: `GET /api/user` 결과(`name`, `memo`) 표시

사용자 확정 사항:
- GNB는 `__root`에 장착(sign-in 포함 모든 라우트 상단)
- LNB는 `_authed` 레이아웃에만 렌더(비로그인에는 노출 안 함)
- 회원정보 페이지에 로그아웃 버튼 포함
- 앱 부트 시 `/api/refresh` 1회로 세션 복원을 이번 Phase에 구현

## 제약

- 아이콘은 `@radix-ui/react-icons`만 사용. 네비 항목은 **서로 다른 아이콘** 사용(요구사항: "항목별로 겹치지 않게") — LNB `DashboardIcon / ListBulletIcon`, GNB 인증 분기 `PersonIcon / EnterIcon`, 로그아웃 `ExitIcon`.
- Phase 03 shared/ui([src/shared/ui/index.ts](src/shared/ui/index.ts)) 재사용 우선.
- **색상은 토큰으로만** — `primary / disabled / danger / surface / text-primary / text-secondary / text-disabled` 등 기존 `@theme` 변수 사용, 하드코드 hex/rgb 금지.
- 폰트는 `pretendard` (이미 [src/app/styles/app.css](src/app/styles/app.css)에 적용).
- 요구사항 밖 과한 구현 금지 (회원가입, 비밀번호 찾기, 토스트, 다크모드 등 미도입).
- `AI_USAGE.md`는 전체 과제 최종 산출물이라 **Phase 04에서는 생성하지 않고**, 이번 Phase의 AI 활용 사항은 `prompts/04-user.md` 하단 실행 결과 섹션에 남긴다. 최종 Phase에서 누적 정리.

## Phase 04 요구사항 ↔ 구현 매핑

[docs/requirements.md](docs/requirements.md) 기준, 이번 Phase가 커버하는 요구사항만.

| 요구사항 | 커버 위치 |
| --- | --- |
| React 18/19 + TS | 기존 프로젝트 설정 |
| 아이콘 항목별 중복 없음 | GNB 2종(Person/Enter) + LNB 2종(Dashboard/ListBullet) + ExitIcon |
| 색상 토큰 관리 | 기존 `@theme` 변수 사용, 신규 GNB·LNB도 토큰만 |
| Pretendard 폰트 | [src/app/styles/app.css](src/app/styles/app.css) 기존 적용 |
| 대시보드 아이콘 → `/` | `widgets/lnb` `DashboardIcon` → `to="/"` |
| 할 일 아이콘 → `/task` | `widgets/lnb` `ListBulletIcon` → `to="/task"` |
| 로그인 시 회원정보 아이콘 → `/user` | `widgets/gnb` isAuthenticated 분기 `PersonIcon` |
| 비로그인 시 로그인 아이콘 → `/sign-in` | `widgets/gnb` isAuthenticated 분기 `EnterIcon` |
| 로그인 `POST /api/sign-in` | `entities/session/api/sign-in.ts` |
| 200 외 응답 → errorMessage 모달 | `pages/sign-in` onError → `Modal` |
| form input label | `shared/ui/Input`이 `label` prop 필수 |
| 유효성 검증 표시 | RHF + zod, `Input` error prop |
| email 필수 + 이메일 규약 | `z.string().email()` |
| 비밀번호 필수 + 영숫자 8–24 | `z.string().regex(/^[A-Za-z0-9]{8,24}$/)` |
| 제출 버튼 조건부 활성화 | `disabled={!formState.isValid \|\| mutation.isPending}` |
| 회원정보 `GET /api/user` 결과 표시 | `pages/user` + `userQueries.me()` |
| MSW 기반 API 목업 | 기존 핸들러 재사용 |
| openapi.yaml 계약 준수 | openapi-typescript 타입 사용, openapi-contract-checker로 검수 |

**이번 Phase 범위 밖**(다음 Phase에서 다룸, 현재 placeholder 유지):
- 대시보드 수치(`numOfTask` 등) — Phase 05+
- 목록(`/task`), 상세(`/task/:id`), 삭제 모달 — Phase 05+

## 수행 절차

### 1. 브랜치 준비

`.claude/skills/github-flow/SKILL.md` 규약에 맞춰 `main`에서 `feat/04-user` 브랜치 분기.

### 2. 의존성 추가

- `pnpm add @radix-ui/react-icons`

### 3. 세션 스토어 확장 — [src/entities/session/model/session.store.ts](src/entities/session/model/session.store.ts)

현재 `accessToken / isAuthenticated / setAccessToken / clear`만 존재. 부트 상태를 표현할 플래그를 추가한다.

```ts
type SessionState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'bootstrapping' | 'ready'; // 추가
  setAccessToken: (token: string | null) => void;
  setStatus: (status: SessionState['status']) => void; // 추가
  clear: () => void;
};
```

- `status`는 앱 부트 시 `/api/refresh` 1회 시도를 추적. `_authed` 가드가 `ready` 이전에는 판단을 보류.
- `clear()`는 `status`를 `ready`로 고정(로그아웃 후 가드가 즉시 동작하도록).

### 4. 세션 API — `src/entities/session/api/`

신규 파일 3개:

- `sign-in.ts` — `http.post<AuthTokenResponse>('/api/sign-in', { body: { email, password } })`. 실패 시 `HttpError`(status 400, body `{ errorMessage }`)로 그대로 throw.
- `refresh.ts` — `http.post<AuthTokenResponse>('/api/refresh')`. 쿠키 자동 전송.
- `index.ts`는 `entities/session/index.ts`에서 재노출 (`export * from './api/...';` 또는 public API 추가).

타입은 `components['schemas']['...']`에서 가져온다([src/shared/api/openapi.d.ts](src/shared/api/openapi.d.ts)).

`entities/session/index.ts` public API 확장:
```ts
export { useSessionStore } from './model/session.store';
export { signIn } from './api/sign-in';
export { refreshSession } from './api/refresh';
```

### 5. HTTP 래퍼 401 인터셉터 — [src/shared/api/http.ts](src/shared/api/http.ts)

현 래퍼는 401을 그대로 `HttpError`로 던진다. tech-stack 6절 명세대로 수정:

1. 요청 직전 `useSessionStore.getState().accessToken`이 있으면 `Authorization: Bearer ${token}` 자동 주입 (단, `/api/sign-in`·`/api/refresh` 경로는 제외).
2. 응답이 401이고 현 요청이 refresh 경로가 아니면:
   - 모듈 레벨 `let refreshPromise: Promise<string | null> | null` 로 in-flight refresh 단일화.
   - `refreshSession()` 호출 → 성공 시 `setAccessToken(new)`, 원 요청 1회 재시도. 실패 시 `useSessionStore.getState().clear()` 후 원래 401 re-throw.
3. refresh 실패·재시도 실패 시 최종 `HttpError` 그대로 throw.

순환 import를 피하기 위해 `refreshSession` 호출은 동일 파일에서 직접 `fetch`로 구현하거나 동적 import(`await import('@/entities/session')`)를 쓴다. FSD 방향(`shared → entities` 금지)과 충돌하므로 **동적 import 방식**을 채택한다(shared가 entities에 정적 의존 금지 원칙 유지).

### 6. 사용자 API — `src/entities/user/`

- `api/get-user.ts` — `http.get<UserResponse>('/api/user')`.
- `api/user.queries.ts` — `queryOptions` 팩토리.
  ```ts
  export const userQueries = {
    all: () => ['user'] as const,
    details: () => [...userQueries.all(), 'detail'] as const,
    me: () => queryOptions({
      queryKey: [...userQueries.details(), 'me'] as const,
      queryFn: getUser,
    }),
  };
  ```
- `model/user.ts`는 이미 `UserResponse` 타입 재노출 중.
- `entities/user/index.ts` — `userQueries` public API 추가.

### 7. `_authed` 라우트 가드 — [src/routes/_authed.tsx](src/routes/_authed.tsx)

```tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ location }) => {
    const { status, isAuthenticated } = useSessionStore.getState();
    if (status !== 'ready') return; // 부트 중엔 통과시키고 컴포넌트에서 로딩 처리
    if (!isAuthenticated) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    }
  },
  component: AuthedLayout,
});
```

컴포넌트에서는 `status === 'bootstrapping'`이면 `Spinner` 렌더, 아니면 `<Outlet />`.

### 8. 앱 부트 세션 복원 — `src/app/providers/`

`session-provider.tsx`를 새로 만든다:

- 마운트 시 `setStatus('bootstrapping')` → `refreshSession()` 시도 → 성공 시 `setAccessToken(tokens.accessToken)`, 실패/404/401 모두 조용히 `clear()`.
- 완료 후 `setStatus('ready')`.
- children 렌더는 즉시(라우트 가드가 status를 확인).

[src/app/providers/index.tsx](src/app/providers/index.tsx) 에서 `QueryProvider` 하위에 `SessionProvider` 추가. 순서: `AppErrorBoundary → QueryProvider → SessionProvider → children`.

### 9. GNB 위젯 — `src/widgets/gnb/`

상단 바. 좌측 앱 타이틀, 우측에 인증 상태 분기 아이콘 1개.
- `isAuthenticated === true` → `PersonIcon` → `/user`
- `isAuthenticated === false` → `EnterIcon` (로그인) → `/sign-in`

TanStack Router `Link`. `aria-label`(아이콘 전용 버튼 필수), `activeProps`로 `aria-current="page"` + 활성 배경색.

### 10. LNB 위젯 — `src/widgets/lnb/`

좌측 사이드바(aside). `_authed`에서만 렌더.
- `DashboardIcon` → `/` (exact)
- `ListBulletIcon` → `/task`

기본 좁은 너비(아이콘만), `md:` 이상 브레이크포인트에서는 아이콘 + 라벨 노출. 접근성은 GNB와 동일 규약.

### 11. __root / _authed 레이아웃 배치

- __root: 상단 GNB + 하단 Outlet(전 페이지 공통)
- _authed: 좌측 LNB + 우측 Outlet(로그인 페이지 영역)

```tsx
// __root.tsx
<div className="flex min-h-dvh flex-col">
  <Gnb />
  <div className="flex min-w-0 flex-1 flex-col"><Outlet /></div>
</div>

// _authed.tsx (인증 완료 후)
<div className="mx-auto flex w-full max-w-5xl">
  <Lnb />
  <div className="min-w-0 flex-1"><Outlet /></div>
</div>
```

기존 페이지들은 자체 `<main>` 래퍼 유지(중복 `<main>` 없음).

### 11. 로그인 페이지 — [src/pages/sign-in/ui/sign-in-page.tsx](src/pages/sign-in/ui/sign-in-page.tsx)

요구사항 ↔ 구현:
- zod 스키마 (OpenAPI 규약과 일치):
  ```ts
  const schema = z.object({
    email: z.string().email('이메일 형식이 올바르지 않습니다.'),
    password: z.string().regex(/^[A-Za-z0-9]{8,24}$/, '영문·숫자 8–24자'),
  });
  ```
- `useForm({ resolver: zodResolver(schema), mode: 'onChange' })`.
- 제출 버튼은 `disabled={!formState.isValid || mutation.isPending}` (요구사항: "ID와 PW의 조건이 만족된 경우 활성화").
- `useMutation({ mutationFn: signIn })` — entities가 아닌 페이지에서 소유(기술 스택 5.2 규약).
- `onSuccess`:
  1. `useSessionStore.getState().setAccessToken(tokens.accessToken)`
  2. `navigate({ to: search.redirect ?? '/' })` (redirect search param 우선).
- `onError`: `HttpError`의 `body.errorMessage` 추출 → 로컬 상태에 저장 → `Modal`로 노출. 모달 닫기 시 상태 초기화.
- 이미 로그인돼 있으면 `beforeLoad`에서 `/`로 redirect (sign-in route 자체의 `beforeLoad`에서 처리).

UI 구성(shared/ui 재사용):
- `Input` (label="이메일", type="email", error=`errors.email?.message`)
- `Input` (label="비밀번호", type="password", error=`errors.password?.message`)
- `Button` (type="submit", variant="primary")
- 에러 표시는 `Modal.Root`/`Modal.Content` + `Modal.Title` "로그인 실패" + `Modal.Description` 동적 메시지 + `Modal.Footer`에 닫기 `Button`.

### 12. 회원정보 페이지 — [src/pages/user/ui/user-page.tsx](src/pages/user/ui/user-page.tsx)

- `useQuery(userQueries.me())` 사용.
- 상태별 렌더:
  - `isPending` → `Spinner`
  - `isError` → `EmptyState` (간단한 "불러오지 못했습니다" + 재시도 버튼).
  - `data` → `Card` 내부에 `name`, `memo`.
- 하단에 **로그아웃 버튼** (`variant="ghost"`):
  - 클릭 시 `useSessionStore.getState().clear()` → `navigate({ to: '/sign-in' })`.
  - 리프레시 쿠키는 서버(MSW)가 만료 처리. 명시적 서버 로그아웃 API가 OpenAPI에 없으므로 클라이언트-측 clear만.

### 13. sign-in 라우트 beforeLoad — [src/routes/sign-in.tsx](src/routes/sign-in.tsx)

이미 로그인 상태면 `/`로 리다이렉트하여 중복 로그인 UX 방지.

```tsx
export const Route = createFileRoute('/sign-in')({
  validateSearch: (s) => ({ redirect: typeof s.redirect === 'string' ? s.redirect : undefined }),
  beforeLoad: () => {
    const { status, isAuthenticated } = useSessionStore.getState();
    if (status === 'ready' && isAuthenticated) throw redirect({ to: '/' });
  },
  component: SignInPage,
});
```

### 14. 하지 않는 것 (스코프 고정)

- 토스트/스낵바 시스템
- 회원가입·비밀번호 찾기 플로우
- GNB 반응형 드로어/햄버거 메뉴 (수평 바 1종으로 충분)
- 세션 저장소 다중화(localStorage·BroadcastChannel) — 메모리 보관 원칙 유지
- 대시보드/할일 실제 데이터 (Phase 05+)

## 재사용하는 기존 자원

- [src/shared/ui/button.tsx](src/shared/ui/button.tsx), [input.tsx](src/shared/ui/input.tsx), [label.tsx](src/shared/ui/label.tsx), [modal.tsx](src/shared/ui/modal.tsx), [spinner.tsx](src/shared/ui/spinner.tsx), [card.tsx](src/shared/ui/card.tsx), [empty-state.tsx](src/shared/ui/empty-state.tsx)
- [src/shared/lib/cn.ts](src/shared/lib/cn.ts)
- [src/shared/config/env.ts](src/shared/config/env.ts)
- [src/shared/api/query-client.ts](src/shared/api/query-client.ts) (401 retry 이미 비활성)
- MSW 핸들러 — [auth.ts](src/shared/api/mocks/handlers/auth.ts), [user.ts](src/shared/api/mocks/handlers/user.ts), [auth util](src/shared/api/mocks/auth.ts) (이미 완성)

## 신규/수정 파일 목록

### 신규
- `src/entities/session/api/sign-in.ts`
- `src/entities/session/api/refresh.ts`
- `src/entities/user/api/get-user.ts`
- `src/entities/user/api/user.queries.ts`
- `src/widgets/gnb/ui/gnb.tsx`
- `src/widgets/lnb/ui/lnb.tsx`
- `src/widgets/lnb/index.ts`
- `src/app/providers/session-provider.tsx`

### 수정
- `src/entities/session/model/session.store.ts` (status 플래그 추가)
- `src/entities/session/index.ts` (public API 확장)
- `src/entities/user/index.ts` (`userQueries` 노출)
- `src/widgets/gnb/index.ts` (Gnb export)
- `src/shared/api/http.ts` (토큰 주입 + 401 refresh 재시도)
- `src/routes/__root.tsx` (GNB 배치)
- `src/routes/_authed.tsx` (beforeLoad 가드)
- `src/routes/sign-in.tsx` (validateSearch + beforeLoad)
- `src/pages/sign-in/ui/sign-in-page.tsx` (실제 폼)
- `src/pages/user/ui/user-page.tsx` (Query + 로그아웃)
- `src/app/providers/index.tsx` (SessionProvider 추가)
- `package.json` / `pnpm-lock.yaml` (@radix-ui/react-icons 추가)

## 리뷰 에이전트 소환 (완료 직전)

머지 전 아래 에이전트를 병렬 실행:
- `fsd-reviewer` — 신규 import 경로, public API, entities/features/widgets 계층 규약
- `openapi-contract-checker` — sign-in/refresh/user 요청·응답 타입, zod 스키마와 OpenAPI 정합
- `a11y-reviewer` — 로그인 폼 label, 에러 모달 포커스 트랩, GNB 아이콘 aria-label, 100dvh

## 검증 (Verification)

엔드투엔드 수동 확인 시나리오:

1. **빌드/타입/린트**
   - `pnpm typecheck` — 0 error
   - `pnpm lint` — 0 error
   - `pnpm build` — 성공

2. **개발 서버** `pnpm dev` 후 브라우저에서:
   - `/` 접근 → 세션 부트 중 로딩 → `/sign-in`로 redirect(`redirect` search 포함) ✓
   - 잘못된 이메일 입력 → inline 에러, 제출 버튼 비활성 ✓
   - 이메일/패스워드 모두 유효 → 제출 버튼 활성 ✓
   - 잘못된 자격(`demo1@kbhc.com` / `wrongpass`) → 400 응답 → 모달에 `errorMessage` 노출 ✓
   - 올바른 자격(`demo1@kbhc.com` / `password1234`) → 성공 → 이전 redirect 경로(`/`)로 이동 ✓
   - GNB 아이콘: 로그인 상태에서는 `PersonIcon`, 로그아웃 후에는 `EnterIcon` ✓
   - `/user` 접근 → name/memo 렌더 ✓
   - 로그아웃 버튼 → clear → `/sign-in` 이동 → `/user` 재접근 시 가드로 차단 ✓
   - **새로고침 시**: accessToken은 메모리에서 날아가지만 httpOnly refresh 쿠키로 부트 시 복원 → 로그인 유지 ✓
   - **401 시나리오**: DevTools → Application → Cookies → `token` 쿠키 삭제 후 `/user` 재진입 → refresh 실패 → clear → `/sign-in` ✓ (refresh 단일 in-flight도 network 탭에서 재시도 1건만 있는지 확인)

3. **Phase 마무리 — github-flow**
   - `prompts/04-user.md` 하단에 `## 실행 결과 (2026-04-23)` 섹션 추가 (완료 시점에 작성)
   - `feat/04-user` → `main` `git merge --no-ff`
