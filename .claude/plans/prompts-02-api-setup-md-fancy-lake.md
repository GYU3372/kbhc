# Phase 02 — API 목업 구성 (MSW)

## Context

Phase 01에서 FSD 스켈레톤·Vite·React 19·TanStack Router·QueryClient·`openapi.d.ts` 생성까지 완료됐다. `src/shared/api/` 하위에 HTTP wrapper, QueryClient가 있고 `VITE_ENABLE_MSW` 플래그(`env.ENABLE_MSW`)도 선언돼 있지만, **MSW 자체는 아직 와이어링되지 않은 상태**다. `public/mockServiceWorker.js`, `src/shared/api/mocks/` 전부 미존재.

이번 Phase의 목적은 `docs/openapi.yaml`의 7개 엔드포인트를 MSW 2.x로 **한 번에** 목업하고, 인증·페이지네이션·Set-Cookie까지 현실적으로 흉내 내는 것이다. Phase 03 이후 UI·폼·쿼리 훅 구현 시 네트워크 레이어 걱정 없이 오직 화면에만 집중할 수 있게 한다.

사용자 결정 반영:
- **핸들러 파일 구조**: 도메인별 분리 (4 파일)
- **로그인**: 엄격 검증, 데모 계정 `demo1`·`demo2` 2개만 200
- **토큰 검증**: 엄격 — JWT payload의 `exp` 확인, 만료 시 401

## 목표 산출물

1. `src/shared/api/mocks/` 아래 MSW 핸들러 + 시드 + 브라우저 worker 부트스트랩
2. `public/mockServiceWorker.js` (via `npx msw init`)
3. `src/app/main.tsx` 수정: `env.ENABLE_MSW` true일 때만 동적 import + `worker.start()` 후 React 마운트
4. `.env.development`만 `VITE_ENABLE_MSW=true`로 플립 (`.env.production`은 false 유지)
5. 프로덕션 번들에 MSW·faker 코드가 포함되지 않는 것을 확인
6. Phase 02 브랜치 + 커밋 + `prompts/02-api-setup.md`에 `## 실행 결과 (2026-04-23)` 추가

## 파일 구조

```
src/shared/api/mocks/
├─ index.ts                 # { worker } 재-export (동적 import용 entry)
├─ browser.ts               # setupWorker(...handlers) + db 초기화
├─ constants.ts             # PAGE_SIZE=20, DEMO_ACCOUNTS, ACCESS_TTL_MS, REFRESH_TTL_MS
├─ auth.ts                  # issueTokens(userId), verifyAccess(req), verifyRefresh(req), mkJwt helpers
├─ db.ts                    # in-memory Map<id, TaskItem> + list/get/delete/count/reset
├─ seeds.ts                 # faker.seed(42) → 300개 TaskItem 생성
└─ handlers/
   ├─ index.ts              # export const handlers = [...auth, ...user, ...dashboard, ...task]
   ├─ auth.ts               # POST /api/sign-in, POST /api/refresh
   ├─ user.ts               # GET /api/user
   ├─ dashboard.ts          # GET /api/dashboard
   └─ task.ts               # GET /api/task, GET /api/task/{id}, DELETE /api/task/{id}
```

`public/mockServiceWorker.js` — `npx msw init public/ --save` 결과물(직접 편집 금지).

## 구현 세부

### 1. `constants.ts`
```ts
export const PAGE_SIZE = 20;
export const ACCESS_TTL_MS = 15 * 60_000;       // 15 min
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60_000; // 7 days

export const DEMO_ACCOUNTS = [
  { id: 'demo1', email: 'demo1@kbhc.com', password: 'password1234', name: '김데모', memo: '데모 계정 1 - 일반 사용자' },
  { id: 'demo2', email: 'demo2@kbhc.com', password: 'password5678', name: '박데모', memo: '데모 계정 2 - 관리자' },
] as const;
```
비밀번호는 모두 영숫자 8~24자 regex 통과(`^[A-Za-z0-9]+$`). `/api/user` 응답은 로그인한 계정의 `name`/`memo`를 돌려준다.

### 2. `auth.ts` — JWT (non-crypto, 구조만 실제)
```ts
const b64url = (s: string) =>
  btoa(s).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
const b64urlDecode = (s: string) =>
  atob(s.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - s.length % 4) % 4));

const mkJwt = (id: string, ttlMs: number) => {
  const header  = b64url(JSON.stringify({ alg:'none', typ:'JWT' }));
  const payload = b64url(JSON.stringify({ id, exp: Math.floor((Date.now()+ttlMs)/1000) }));
  return `${header}.${payload}.sig`;
};

const parseJwt = (token: string): { id: string; exp: number } | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try { return JSON.parse(b64urlDecode(parts[1])); } catch { return null; }
};

const isExpired = (p: { exp: number } | null) =>
  !p || p.exp <= Math.floor(Date.now()/1000);

export const issueTokens = (userId: string) => ({
  accessToken:  mkJwt(userId, ACCESS_TTL_MS),
  refreshToken: mkJwt(userId, REFRESH_TTL_MS),
});

export const verifyAccess = (req: Request): { ok: true; userId: string } | { ok: false } => {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return { ok: false };
  const payload = parseJwt(auth.slice(7));
  if (isExpired(payload)) return { ok: false };
  return { ok: true, userId: payload!.id };
};

export const verifyRefresh = (req: Request): { ok: true; userId: string } | { ok: false } => {
  const cookie = req.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return { ok: false };
  const payload = parseJwt(match[1]);
  if (isExpired(payload)) return { ok: false };
  return { ok: true, userId: payload!.id };
};
```

### 3. `db.ts`
```ts
import type { components } from '@/shared/api/openapi';
import { seedTasks } from './seeds';

type TaskItem = components['schemas']['TaskItem'];

const tasks = new Map<string, TaskItem>();
seedTasks(300).forEach(t => tasks.set(t.id, t));

export const db = {
  tasks: {
    list(page: number, size: number) {
      const all = Array.from(tasks.values());
      const start = (page - 1) * size;
      return { data: all.slice(start, start + size), hasNext: start + size < all.length };
    },
    get:   (id: string) => tasks.get(id) ?? null,
    delete:(id: string) => tasks.delete(id),
    count: () => tasks.size,
    countByStatus: (s: 'TODO'|'DONE') =>
      Array.from(tasks.values()).filter(t => t.status === s).length,
  },
};
```
HMR 시 재초기화되어 세션 내 DELETE 결과는 사라진다 — Phase 02에선 허용(UI가 아직 없음).

### 4. `seeds.ts`
```ts
import { faker } from '@faker-js/faker';
import type { components } from '@/shared/api/openapi';

type TaskItem = components['schemas']['TaskItem'];

export function seedTasks(count = 300): TaskItem[] {
  faker.seed(42);
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${String(i + 1).padStart(4, '0')}`,
    title: faker.lorem.sentence({ min: 3, max: 7 }),
    memo:  faker.lorem.paragraph({ min: 1, max: 3 }),
    status: faker.helpers.arrayElement(['TODO','DONE'] as const),
  }));
}
```
Task detail의 `registerDatetime`은 seeds에 두지 않고 detail 핸들러에서 id 기반으로 계산(`new Date(Date.UTC(2025,0,1) + idx*3600_000).toISOString()`).

### 5. `handlers/auth.ts` — 엄격 검증
```ts
import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/openapi';
import { DEMO_ACCOUNTS, REFRESH_TTL_MS } from '../constants';
import { issueTokens, verifyRefresh } from '../auth';

type SignInRequest    = components['schemas']['SignInRequest'];
type AuthTokenResponse= components['schemas']['AuthTokenResponse'];
type ErrorResponse    = components['schemas']['ErrorResponse'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE    = /^[A-Za-z0-9]{8,24}$/;

export const authHandlers = [
  http.post('/api/sign-in', async ({ request }) => {
    const body = (await request.json()) as SignInRequest;

    // 1) 형식 검증 (spec)
    if (!EMAIL_RE.test(body.email) || !PW_RE.test(body.password)) {
      return HttpResponse.json<ErrorResponse>(
        { errorMessage: '이메일 또는 비밀번호 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    // 2) 데모 계정 대조 (엄격)
    const account = DEMO_ACCOUNTS.find(a => a.email === body.email && a.password === body.password);
    if (!account) {
      return HttpResponse.json<ErrorResponse>(
        { errorMessage: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const tokens = issueTokens(account.id);
    return HttpResponse.json<AuthTokenResponse>(tokens, {
      headers: { 'Set-Cookie': `token=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(REFRESH_TTL_MS/1000)}` },
    });
  }),

  http.post('/api/refresh', ({ request }) => {
    const v = verifyRefresh(request);
    if (!v.ok) {
      return HttpResponse.json<ErrorResponse>(
        { errorMessage: 'refresh token이 유효하지 않습니다.' }, { status: 401 });
    }
    const tokens = issueTokens(v.userId);
    return HttpResponse.json<AuthTokenResponse>(tokens, {
      headers: { 'Set-Cookie': `token=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(REFRESH_TTL_MS/1000)}` },
    });
  }),
];
```

### 6. `handlers/user.ts`
```ts
http.get('/api/user', ({ request }) => {
  const v = verifyAccess(request);
  if (!v.ok) return HttpResponse.json<ErrorResponse>({ errorMessage:'Unauthorized' }, { status: 401 });
  const account = DEMO_ACCOUNTS.find(a => a.id === v.userId);
  if (!account) return HttpResponse.json<ErrorResponse>({ errorMessage:'Unauthorized' }, { status: 401 });
  return HttpResponse.json<UserResponse>({ name: account.name, memo: account.memo });
})
```

### 7. `handlers/dashboard.ts`
`db.tasks`에서 실시간 계산 — DELETE가 dashboard 숫자에도 반영된다.
```ts
return HttpResponse.json<DashboardResponse>({
  numOfTask:     db.tasks.count(),
  numOfRestTask: db.tasks.countByStatus('TODO'),
  numOfDoneTask: db.tasks.countByStatus('DONE'),
});
```

### 8. `handlers/task.ts`
- `GET /api/task?page=N`: page 정수 1 이상 검증 실패 시 400(스펙엔 명시 없지만 ErrorResponse shape로 반환). `db.tasks.list(page, PAGE_SIZE)` 그대로 반환.
- `GET /api/task/{id}`: `db.tasks.get(id)`. 없으면 404. id 순번으로 `registerDatetime` 계산.
- `DELETE /api/task/{id}`: `db.tasks.delete(id)` 성공 시 `{success:true}` 200, 실패 시 404.

모든 핸들러는 `verifyAccess(request)` 가장 먼저 호출, 실패 시 401.

### 9. `browser.ts`
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

### 10. `index.ts`
```ts
export { worker } from './browser';
```
(handlers는 외부로 노출하지 않음 — worker만 공개 API)

### 11. `src/app/main.tsx` 수정
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { env } from '@/shared/config/env';
import { Providers } from './providers';
import { AppRouterProvider } from './providers/router-provider';
import './styles/app.css';

async function enableMocks() {
  if (!env.ENABLE_MSW) return;
  const { worker } = await import('@/shared/api/mocks');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

void enableMocks().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element #root not found');
  createRoot(rootElement).render(
    <StrictMode>
      <Providers>
        <AppRouterProvider />
      </Providers>
    </StrictMode>,
  );
});
```
동적 import는 프로덕션 빌드에서 `ENABLE_MSW=false` 시 해당 청크를 로드하지 않음 → tree-shake.

## 주의할 선(Guardrails)

- 타입은 **반드시** `components['schemas']['X']`에서 파생. 로컬 interface 선언 금지 → `openapi-contract-checker` 리뷰 대상.
- `HttpResponse.json<T>(...)` 제네릭을 **모든** 핸들러에 명시 → 스키마 drift 시 타입체크 실패.
- 핸들러는 `src/shared/api/mocks/` 외부에서 import 금지. Phase 03의 entity fetch 함수는 `fetch()`만 사용하고, MSW는 투명하게 가로챈다.
- `entities/*/api/`, `features/*/api/`, 쿼리 훅, 폼, 페이지 UI는 **이번 Phase에서 절대 건드리지 않음**.
- `src/shared/api/http.ts`의 401→refresh 인터셉터도 Phase 03에서 구현 (session slice와 같이).
- zod 검증은 handler에 넣지 않음 (클라이언트 폼이 소유). MSW는 spec 형식만 regex로 확인.

## 변경되는 핵심 파일

| 경로 | 상태 | 설명 |
|---|---|---|
| `public/mockServiceWorker.js` | 신규 | `npx msw init`으로 생성 |
| `src/shared/api/mocks/index.ts` | 신규 | barrel |
| `src/shared/api/mocks/browser.ts` | 신규 | `setupWorker(...handlers)` |
| `src/shared/api/mocks/constants.ts` | 신규 | PAGE_SIZE, DEMO_ACCOUNTS, TTL |
| `src/shared/api/mocks/auth.ts` | 신규 | JWT issue/verify (base64url, non-crypto) |
| `src/shared/api/mocks/db.ts` | 신규 | in-memory Task Map |
| `src/shared/api/mocks/seeds.ts` | 신규 | faker 300개 시드 |
| `src/shared/api/mocks/handlers/index.ts` | 신규 | 핸들러 배열 합성 |
| `src/shared/api/mocks/handlers/auth.ts` | 신규 | sign-in + refresh |
| `src/shared/api/mocks/handlers/user.ts` | 신규 | GET /api/user |
| `src/shared/api/mocks/handlers/dashboard.ts` | 신규 | GET /api/dashboard |
| `src/shared/api/mocks/handlers/task.ts` | 신규 | task list/detail/delete |
| `src/app/main.tsx` | 수정 | 동적 import + worker.start 후 마운트 |
| `.env.development` | 수정 | `VITE_ENABLE_MSW=true` |
| `package.json` | 수정 | `msw.workerDirectory` (by `npx msw init --save`) |
| `prompts/02-api-setup.md` | 수정 | `## 실행 결과 (2026-04-23)` 추가 |

## 재사용하는 기존 자산

- `src/shared/config/env.ts:3` — `env.ENABLE_MSW` 그대로 사용. 추가 env 파서 불필요.
- `src/shared/api/openapi.d.ts` — 모든 핸들러 응답 타입의 단일 소스. Phase 02에서 `pnpm gen:api` 재실행 불필요.
- `src/shared/api/http.ts` — 그대로 둠. MSW는 `fetch`를 가로채므로 wrapper 수정 없음.
- `@faker-js/faker@^9.3.0`, `msw@^2.7.0` — 이미 devDependencies.

## 실행 순서

1. `git checkout -b feat/02-api-setup` (main에서)
2. `npx msw init public/ --save` 실행 → `public/mockServiceWorker.js` 생성 + `package.json`에 `"msw": { "workerDirectory": ["public"] }` 추가
3. `src/shared/api/mocks/` 하위 파일들 생성 (constants → auth → db → seeds → handlers → browser → index 순)
4. `src/app/main.tsx` 수정
5. `.env.development`의 `VITE_ENABLE_MSW`를 `false` → `true`
6. 아래 **Verification** 수행
7. Conventional Commits으로 분리 커밋:
   - `chore(api): init msw service worker`
   - `feat(api): add msw handlers for 7 endpoints`
   - `feat(api): seed in-memory task store with faker`
   - `feat(app): bootstrap msw worker conditionally`
   - `chore(env): enable msw in development`
8. `prompts/02-api-setup.md`에 `## 실행 결과 (2026-04-23)` 섹션 추가 (구현 요약 + 데모 계정 + PAGE_SIZE + 검증 결과)
9. `git merge --no-ff feat/02-api-setup` → main

## Verification (end-to-end 증빙)

### 정적 검증
- `pnpm typecheck` → 0 errors. (`HttpResponse.json<T>` 제네릭이 스키마 drift를 타입 에러로 잡아주는 게 이 단계의 핵심 가치)
- `pnpm lint` → 0 errors.
- `pnpm build` → 빌드 성공.
- `grep -l "faker\|setupWorker" dist/assets/*.js` → **empty** (production 번들에서 MSW/faker 제거 확인).

### 런타임 검증 (`pnpm dev` 후 브라우저 DevTools Console)

Service Worker 등록 확인:
- Application → Service Workers → `mockServiceWorker.js` active, scope `/`
- Console에 `[MSW] Mocking enabled.` 출력

7개 엔드포인트 smoke test (Console에 붙여넣기):
```js
// 1. sign-in 엄격 검증
await fetch('/api/sign-in', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({email:'demo1@kbhc.com', password:'password1234'})}).then(r => r.json())
// → { accessToken, refreshToken }

await fetch('/api/sign-in', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({email:'other@x.com', password:'password1234'})}).then(r => r.status)
// → 400 (등록되지 않은 계정)

await fetch('/api/sign-in', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({email:'bad', password:'pw!'})}).then(r => r.status)
// → 400 (형식 위반)

// 2. Bearer 필수
await fetch('/api/user').then(r => r.status)  // → 401
const { accessToken } = await fetch('/api/sign-in', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({email:'demo2@kbhc.com', password:'password5678'})}).then(r => r.json())
await fetch('/api/user', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { name:'박데모', memo:'데모 계정 2 - 관리자' }

// 3. Dashboard
await fetch('/api/dashboard', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { numOfTask:300, numOfRestTask:<N>, numOfDoneTask:<300-N> }

// 4. Task pagination + hasNext
await fetch('/api/task?page=1', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { data: [...20 items], hasNext: true }
await fetch('/api/task?page=15', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { data: [...20 items], hasNext: false }
await fetch('/api/task?page=99', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { data: [], hasNext: false }

// 5. Detail + 404
await fetch('/api/task/task-0001', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { title, memo, registerDatetime: '2025-...Z' }
await fetch('/api/task/nope', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.status)
// → 404

// 6. Delete + 404 재확인
await fetch('/api/task/task-0001', {method:'DELETE', headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.json())
// → { success: true }
await fetch('/api/task/task-0001', {headers:{Authorization:`Bearer ${accessToken}`}}).then(r => r.status)
// → 404 (삭제 반영)

// 7. Refresh + 401→200
await fetch('/api/refresh', {method:'POST'}).then(r => r.status)  // credentials 없이는 401
await fetch('/api/refresh', {method:'POST', credentials:'include'}).then(r => r.status)
// → 200 (sign-in에서 설정된 token 쿠키 유효)
```

### Network Tab 증빙
- 위 요청들의 "Type" 칼럼이 **ServiceWorker** 여야 함 → MSW가 정상 가로채는 증거.
- Preserve log 켜고 테스트 권장.

### FSD/OpenAPI 계약 리뷰
Phase 종료 전:
- `.claude/agents/openapi-contract-checker` 실행 → 7개 응답 shape + 에러 케이스 전수 확인
- `.claude/agents/fsd-reviewer` 실행 → `src/shared/api/mocks/`가 의존성 방향·public API 규약 준수
