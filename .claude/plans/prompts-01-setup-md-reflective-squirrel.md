# Phase 01 — 프로젝트 셋업 계획

## Context

Phase 00(`prompts/00-tech-decision.md`)에서 기술 스택 결정이 끝나 [docs/tech-stack.md](docs/tech-stack.md)에 문서화되었다. 이 Phase는 그 결정을 **파일로 옮기는 실행 단계**다. 기능 구현은 포함하지 않으며, 다음 Phase가 착수하자마자 의존성·설정·구조 고민 없이 기능 코드에 집중할 수 있도록 뼈대를 완성한다.

사용자 확정 범위 (2026-04-23):
1. **빌드 가능한 최소 동작** — `pnpm dev` 실행 시 5개 페이지가 각자 "Hello {page}" 수준으로 실제 라우팅/렌더링되어 FSD 계층 연결이 동작함을 증명
2. **openapi-typescript 도입** — `docs/openapi.yaml`이 타입의 단일 소스. entities는 생성된 타입을 re-export만.

산출물은 01-setup.md에 명시된 3가지: 프로젝트 설정 + FSD 뼈대 / `.claude/agents/` 3개 / CLAUDE.md.

---

## 참고 문서

- [docs/tech-stack.md](docs/tech-stack.md) — 모든 기술 결정의 근거. 14절이 최종 의존성 표, 11절이 FSD 구조
- [docs/openapi.yaml](docs/openapi.yaml) — 7개 엔드포인트 (sign-in, refresh, user, dashboard, task GET/page, task/:id GET/DELETE)
- [docs/requirements.md](docs/requirements.md) — 5페이지 기능 명세
- [prompts/01-setup.md](prompts/01-setup.md) — 이 Phase의 지시서

---

## 실행 순서

### 0. Git 저장소 초기화 (GitHub Flow — Phase 02+부터 본격 적용)

현재 저장소는 `git init`이 되지 않은 상태다. 이번 Phase에서 `git init`만 수행하고, **초기 커밋은 A~F 단계가 모두 끝난 뒤 G 단계에서 단일 커밋으로 한 번에** 한다. Phase 01의 산출물은 셋업 전체가 하나의 논리 단위이므로 분할하지 않는다.

GitHub Flow 규약 자체는 이번 Phase의 E 단계에서 `.claude/skills/github-flow/SKILL.md` 스킬로 정식 문서화하고, Phase 02부터 스킬이 지시하는 대로 feature 브랜치 + `--no-ff` 머지를 적용한다.

**이 단계의 작업:**
- `git init -b main` — `main`을 기본 브랜치로 초기화
- `git config --local ...`는 건드리지 않음 (사용자 전역 설정 존중)
- 이 시점에는 아무것도 커밋하지 않는다 (staging area 비어있음)

---

### A. 의존성 설치 (`package.json` + `pnpm-lock.yaml`)

tech-stack.md 14절 목록 + openapi-typescript 추가.

**runtime:**
```
react@19, react-dom@19
@tanstack/react-router, @tanstack/react-query, @tanstack/react-virtual
zustand
react-hook-form, zod, @hookform/resolvers
@radix-ui/react-dialog, @radix-ui/react-label
clsx, tailwind-merge
react-error-boundary
pretendard
```

**dev:**
```
typescript, @types/react, @types/react-dom, @types/node
vite, @vitejs/plugin-react, @tanstack/router-plugin
tailwindcss@4, @tailwindcss/vite
prettier, prettier-plugin-tailwindcss
eslint, @eslint/js, typescript-eslint,
eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh,
eslint-plugin-jsx-a11y, @tanstack/eslint-plugin-query
msw, @faker-js/faker
openapi-typescript
```

**scripts (package.json):**
```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "gen:api": "openapi-typescript docs/openapi.yaml -o src/shared/api/openapi.d.ts"
}
```

**Node/엔진:**
- `"engines": { "node": ">=20" }`
- `"packageManager": "pnpm@9.x"`

---

### B. 설정 파일 (루트)

| 파일 | 핵심 포인트 |
| --- | --- |
| `tsconfig.json` | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: bundler`, `jsx: react-jsx`, paths `"@/*": ["src/*"]` |
| `tsconfig.node.json` | vite.config.ts 전용 (Node types) |
| `vite.config.ts` | 플러그인: `@vitejs/plugin-react`, `TanStackRouterVite`, `@tailwindcss/vite`. alias `@` → `src` |
| `eslint.config.js` (flat) | `@eslint/js` + `typescript-eslint` + react/react-hooks/react-refresh/jsx-a11y/@tanstack/query 플러그인. 별도 boundaries 플러그인은 도입하지 않음(과제 규모) — slice 경계는 fsd-reviewer 에이전트가 수동 검증 |
| `prettier.config.mjs` | `plugins: ['prettier-plugin-tailwindcss']` |
| `.gitignore` | node_modules, dist, .env.local, .vite, coverage |
| `.env.development` | `VITE_API_BASE_URL=/api`, `VITE_ENABLE_MSW=false` (Phase 01에서는 아직 MSW 미사용) |
| `.env.production` | `VITE_API_BASE_URL=/api`, `VITE_ENABLE_MSW=false` |
| `index.html` | `<div id="root">`, `<script type="module" src="/src/app/main.tsx">` |

---

### C. FSD 뼈대 + 빌드 가능한 최소 동작

[docs/tech-stack.md](docs/tech-stack.md) 11절 구조를 그대로 만든다. 아래 표시된 파일은 Phase 01에서 **내용을 채우는** 파일이며, 나머지 디렉토리는 `index.ts` 스텁(빈 export)만 둔다.

#### C-1. app/ (앱 부트)

| 파일 | 역할 |
| --- | --- |
| `src/app/main.tsx` | ReactDOM.createRoot → `<Providers><RouterProvider router={router}/></Providers>`. Pretendard CSS import, `./styles/app.css` import |
| `src/app/providers/query-provider.tsx` | `QueryClientProvider` + `shared/api/query-client` 인스턴스 주입 |
| `src/app/providers/router-provider.tsx` | `createRouter({ routeTree })` 래핑 |
| `src/app/providers/error-boundary.tsx` | `react-error-boundary`의 `ErrorBoundary` + 기본 fallback |
| `src/app/providers/index.tsx` | 위 3개 프로바이더 합성 |
| `src/app/styles/app.css` | `@import "tailwindcss";` + `@theme { --color-primary, --color-surface, --color-text-*, --color-danger, --color-disabled, --font-sans }` + `@import "pretendard/dist/web/variable/pretendardvariable.css";` |

#### C-2. routes/ (TanStack Router 파일 기반, 7개)

| 파일 | 바인딩 대상 |
| --- | --- |
| `src/routes/__root.tsx` | `<Outlet/>` + 공통 레이아웃 (나중에 GNB가 들어올 자리) |
| `src/routes/sign-in.tsx` | → `pages/sign-in` |
| `src/routes/_authed.tsx` | `beforeLoad`는 TODO 주석으로 남기고 현재는 단순 `<Outlet/>` (가드 로직은 Phase 02+) |
| `src/routes/_authed.index.tsx` | → `pages/dashboard` |
| `src/routes/_authed.task.index.tsx` | → `pages/task-list` |
| `src/routes/_authed.task.$id.tsx` | → `pages/task-detail` |
| `src/routes/_authed.user.tsx` | → `pages/user` |
| `src/routes/routeTree.gen.ts` | `@tanstack/router-plugin`이 자동 생성 (커밋) |

#### C-3. pages/ (5개 Hello 스텁)

각 페이지는 아래 수준의 최소 컴포넌트 + `index.ts`.

```tsx
// src/pages/dashboard/ui/dashboard-page.tsx
export function DashboardPage() {
  return <main className="p-4 font-sans">Hello Dashboard</main>;
}
```

- `pages/sign-in/` — SignInPage
- `pages/dashboard/` — DashboardPage
- `pages/task-list/` — TaskListPage
- `pages/task-detail/` — TaskDetailPage (라우트 param `$id` 표시만)
- `pages/user/` — UserPage

각 slice의 `index.ts`가 public API.

#### C-4. widgets/, features/, entities/ (빈 슬라이스)

| 경로 | 처리 |
| --- | --- |
| `src/widgets/gnb/index.ts` | 빈 export (Phase 02에서 GNB 위젯 구현) |
| `src/widgets/task-list/index.ts` | 빈 export |
| `src/features/task-delete/index.ts` | 빈 export |
| `src/entities/task/model/task.ts` | `openapi.d.ts`의 `components['schemas']['TaskItem']`을 re-export (예: `export type TaskItem = components['schemas']['TaskItem']`) |
| `src/entities/task/index.ts` | 타입만 re-export |
| `src/entities/user/model/user.ts` | `UserResponse` re-export |
| `src/entities/user/index.ts` | 타입만 re-export |
| `src/entities/session/model/session.store.ts` | Zustand 스토어 스텁 (`accessToken: string \| null`, `setAccessToken`, `clear`). 실제 사용은 Phase 02+ |
| `src/entities/session/index.ts` | 스토어 훅 export |

#### C-5. shared/

| 파일 | 역할 |
| --- | --- |
| `src/shared/api/http.ts` | fetch 래퍼 **인터페이스 스텁** — `http.get/post/delete` 시그니처와 `HttpError` 클래스만. 401/refresh 로직은 Phase 02+ |
| `src/shared/api/query-client.ts` | `new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: ... } } })` |
| `src/shared/api/openapi.d.ts` | `pnpm gen:api` 실행 결과 (커밋) |
| `src/shared/api/mocks/` | **Phase 01에서는 생성하지 않음** — VITE_ENABLE_MSW=false이므로 미사용. Phase 02에서 핸들러와 함께 생성 |
| `src/shared/config/env.ts` | `import.meta.env` 타입 세이프 래퍼 (`API_BASE_URL`, `ENABLE_MSW`) |
| `src/shared/lib/cn.ts` | `clsx + tailwind-merge` 합성 헬퍼 |
| `src/shared/ui/index.ts` | 빈 export (Button 등은 Phase 02+) |

---

### D. 리뷰 에이전트 3개 (`.claude/agents/*.md`)

각 파일은 프로젝트 로컬 서브에이전트로 등록된다. YAML frontmatter (name, description, tools) + 본문 (역할/체크리스트). **과제 규모**에 맞춰 항목은 정말 구조적 빈틈만 짚는 수준으로 좁힌다(엔터프라이즈 ADR식 나열 금지).

#### D-1. `.claude/agents/a11y-reviewer.md`

- **description:** 변경된 UI 코드의 접근성과 웹뷰 대응을 검토. requirements.md의 "label 표기" 요건과 tech-stack.md 10절 기준에 국한.
- **tools:** `Read`, `Bash`, `Grep`
- **체크리스트 (짧게):**
  - 폼 요소: 모든 `<input>`이 `<label htmlFor>` 또는 Radix `Label`로 연결되었는가
  - 모달: Radix Dialog 사용 + 닫힘 시 트리거로 포커스 복귀
  - 뷰포트: 전체 높이 영역이 `100dvh`/`100svh` 사용, `100vh` 단독 사용은 지적
  - 안전 영역: fixed 하단 요소가 `env(safe-area-inset-bottom)` 반영하는지
  - 애니메이션: `width/height/top/left` 트랜지션 → `transform/opacity`로 교정 제안
  - ESLint `jsx-a11y` 규칙이 flat config에서 활성화되어 있는지만 확인 (세부 규칙은 린터가 담당)

#### D-2. `.claude/agents/fsd-reviewer.md`

- **description:** 변경된 파일이 tech-stack.md 11절 FSD 규약을 따르는지 검토.
- **tools:** `Read`, `Grep`, `Bash`
- **체크리스트:**
  - 의존성 방향: `app → routes → pages → widgets → features → entities → shared` 단방향 위반 import가 있는지
  - 동일 레이어 cross-slice import (예: `entities/task`가 `entities/user`를 import) 없는지
  - `entities/*/api/`에 `useMutation` 훅이 들어가지 않았는지 (useMutation은 feature 또는 페이지 소유)
  - slice 내부 경로 직접 import (`@/entities/task/model/task`) 대신 `@/entities/task` public API 사용하는지
  - queryOptions 팩토리 네이밍 `all/lists/details/list/detail` 준수
  - query key 문자열이 `shared`에 흩어져 있지 않은지

#### D-3. `.claude/agents/openapi-contract-checker.md`

- **description:** `docs/openapi.yaml`을 단일 소스로 보고 TypeScript 타입, zod 스키마, MSW 핸들러, fetch 함수 경로가 명세와 일치하는지 검토.
- **tools:** `Read`, `Grep`, `Bash`
- **체크리스트:**
  - `src/shared/api/openapi.d.ts`가 최신인지 (필요 시 `pnpm gen:api` 재실행 권고)
  - entities의 타입이 `components['schemas']['X']`에서 파생되었는지 (수동 선언 시 지적)
  - zod 스키마 제약 (email, password `^[A-Za-z0-9]+$` 8-24자, task id 등)이 openapi.yaml의 pattern/format/minLength와 일치
  - MSW 핸들러가 7개 엔드포인트 모두 커버하는지 (Phase 02+ 시점부터 적용), 응답 스키마가 `TaskListResponse.hasNext`, `DashboardResponse`의 3필드 등과 일치
  - fetch 함수 URL과 메서드가 명세와 일치 (`GET /api/task?page=N`, `DELETE /api/task/:id` 등)
  - 401/404/400 에러 응답 포맷이 `ErrorResponse.errorMessage`인지

각 에이전트 본문에는 "소규모 과제 리뷰 범위 — 엔터프라이즈 아키텍처 잣대·추측성 개선은 금지, 명세/규약 위반과 구조적 빈틈만 지적"이라는 가드를 포함한다.

---

### E. GitHub Flow 스킬 (`.claude/skills/github-flow/SKILL.md`)

Phase 02+에서 Claude Code가 새 작업 브랜치 분기/커밋/머지를 자동으로 규약대로 수행할 수 있도록 **프로젝트 로컬 스킬**로 규약을 문서화한다. 사용자가 "새 Phase 시작", "feature 브랜치", "Phase 종료 및 머지" 등을 요청할 때 자동 트리거된다.

**파일:** `.claude/skills/github-flow/SKILL.md`

**Frontmatter (Claude Code 스킬 포맷):**
```yaml
---
name: github-flow
description: 새 Phase/feature 작업 시작·진행·종료 시 GitHub Flow + Conventional Commits 규약대로 브랜치 분기, 커밋, `--no-ff` 머지를 수행한다. "새 Phase 시작", "feature 브랜치 생성", "Phase 종료", "PR/머지 준비" 등의 요청에서 트리거.
---
```

**본문 섹션 (간결하게):**

1. **원칙**
   - `main`은 항상 빌드 가능 상태. 직접 커밋 금지 (단, Phase 01 initial commit은 예외)
   - 모든 작업은 `<type>/<NN>-<slug>` 브랜치에서. 예: `feat/02-auth`, `feat/03-task-list`, `chore/99-cleanup`
   - 타입은 Conventional Commits 키워드: `feat / fix / chore / docs / refactor / style / build / ci / test`
   - 머지는 `git merge --no-ff`로 Phase 단위 이력 보존

2. **새 Phase 시작 절차**
   ```
   git checkout main
   git status                # clean 확인
   git checkout -b feat/<NN>-<slug>
   ```

3. **작업 중 커밋 규칙**
   - Conventional Commits 포맷: `<type>(<scope>)?: <summary>` (scope는 선택)
   - 하나의 논리 단위 = 하나의 커밋. 기능·문서·설정 혼재 금지
   - 커밋 전에 `pnpm typecheck && pnpm lint` 통과 필수
   - `--no-verify`로 hook 우회 금지

4. **Phase 종료 및 머지 절차**
   ```
   # 브랜치에서
   pnpm build              # 빌드 성공 확인
   git checkout main
   git merge --no-ff <branch> -m "<type>: phase <NN> <summary>"
   git branch -d <branch>
   ```

5. **Remote 푸시 (선택)**
   - GitHub 리포가 연결되어 있으면 `git push origin main` (force push 금지)
   - `gh pr create`는 실제 협업 맥락(리뷰어 존재)에서만 사용. 1인 과제에서는 로컬 `--no-ff` 머지로 충분

6. **예외: Phase 01 initial commit**
   - `git init` 직후 저장소에는 아무 커밋도 없다. Phase 01 셋업 결과물 전체를 `main`에 **단일 initial commit** (`chore: initial project setup`)으로 한 번에 커밋
   - Phase 02부터는 위 1~4번을 엄격히 따른다

---

### F. `CLAUDE.md` (루트)

[.claude/agents/](/.claude/agents/) 및 [.claude/skills/](/.claude/skills/) 생성 후 작성. 다음 섹션만 포함하고 장황한 ADR 성격은 배제:

1. **프로젝트 개요 (2-3줄)** — KB헬스케어 take-home, React 19 + Vite SPA, FSD, 주요 참고: `docs/tech-stack.md`, `docs/requirements.md`, `docs/openapi.yaml`
2. **주요 명령어** — `pnpm dev / build / typecheck / lint / format / gen:api`
3. **스택 요약 (표)** — 라우팅 TanStack Router, 서버상태 TanStack Query, 클라상태 Zustand, 폼 RHF+zod, 스타일 Tailwind v4, 목업 MSW, 패키지 매니저 pnpm
4. **FSD 규약 (4줄 이내)** — 단방향 의존성, slice public API는 `index.ts`, entities/api는 read only, query key는 엔티티 팩토리에
5. **Git 규약 (GitHub Flow + Conventional Commits)** — `main`은 항상 배포 가능. 새 작업은 `<type>/<NN>-<slug>` 브랜치에서. 머지는 `--no-ff`. **세부 절차와 자동화는 `.claude/skills/github-flow/SKILL.md` 참조** — Phase 02+ 작업 시작/종료 시 Claude Code가 이 스킬을 트리거해 규약대로 실행
6. **Phase 작업 방식** — `prompts/NN-*.md`를 순서대로 실행. 각 Phase 종료 시 해당 파일 하단에 "## 실행 결과" 추가
7. **리뷰 에이전트** — a11y-reviewer, fsd-reviewer, openapi-contract-checker 이름과 역할 1줄씩

---

### G. Initial Commit (단일 커밋으로 `main`에 기록)

A~F 단계 결과물을 **모두 합친 상태**에서 한 번에 커밋한다. 분할하지 않는다.

**사전 체크:**
- `pnpm install` 성공
- `pnpm gen:api` 실행 완료 (`src/shared/api/openapi.d.ts` 생성)
- `pnpm typecheck` 통과
- `pnpm lint` 통과
- `pnpm build` 성공
- `pnpm dev`로 5개 페이지 브라우저 확인 완료

**커밋:**
```
git status                           # 모든 산출물이 untracked/modified로 보이는지 확인
git add .
git commit -m "chore: initial project setup"
```

- 메시지 본문(선택): tech-stack 결정 반영, FSD 뼈대, 리뷰 에이전트 3개, GitHub Flow 스킬, CLAUDE.md 포함
- 이 commit은 Phase 02부터 적용되는 GitHub Flow의 **시작점**이 된다 (Phase 02는 이 시점의 `main`에서 `feat/02-*` 브랜치 분기)
- Remote 연결(GitHub 리포 생성 및 push)은 사용자 판단으로 Phase 01 종료 후 수행

---

## 파일 목록 (생성 대상 총괄)

### 루트
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `prettier.config.mjs`, `.gitignore`, `.env.development`, `.env.production`, `index.html`, `CLAUDE.md`

### src/
- `src/app/main.tsx`, `src/app/providers/{query-provider,router-provider,error-boundary,index}.tsx`, `src/app/styles/app.css`
- `src/routes/__root.tsx`, `src/routes/sign-in.tsx`, `src/routes/_authed.tsx`, `src/routes/_authed.index.tsx`, `src/routes/_authed.task.index.tsx`, `src/routes/_authed.task.$id.tsx`, `src/routes/_authed.user.tsx`, `src/routes/routeTree.gen.ts` (자동 생성)
- `src/pages/{sign-in,dashboard,task-list,task-detail,user}/ui/*.tsx` + `index.ts` (각 5세트)
- `src/widgets/{gnb,task-list}/index.ts`
- `src/features/task-delete/index.ts`
- `src/entities/task/{model/task.ts,index.ts}`, `src/entities/user/{model/user.ts,index.ts}`, `src/entities/session/{model/session.store.ts,index.ts}`
- `src/shared/api/{http.ts,query-client.ts,openapi.d.ts}`, `src/shared/config/env.ts`, `src/shared/lib/cn.ts`, `src/shared/ui/index.ts`

### .claude/
- `.claude/agents/a11y-reviewer.md`, `.claude/agents/fsd-reviewer.md`, `.claude/agents/openapi-contract-checker.md`
- `.claude/skills/github-flow/SKILL.md`

---

## 검증 (Phase 01 완료 기준)

실행 순서대로 모두 통과하면 Phase 01 종료.

1. `pnpm install` — 에러 없이 설치 완료
2. `pnpm gen:api` — `src/shared/api/openapi.d.ts` 생성 확인
3. `pnpm typecheck` — 타입 에러 0
4. `pnpm lint` — 위반 0 (경고는 무시 가능)
5. `pnpm build` — 정적 번들 빌드 성공
6. `pnpm dev` 실행 후 브라우저에서 직접 확인:
   - `/sign-in` → "Hello Sign In"
   - `/` → "Hello Dashboard"
   - `/task` → "Hello Task List"
   - `/task/abc` → "Hello Task Detail (id: abc)"
   - `/user` → "Hello User"
   - 존재하지 않는 경로 → TanStack Router 기본 not-found 화면
7. `.claude/agents/` 3개 파일이 각 역할/체크리스트로 채워져 있음
8. `.claude/skills/github-flow/SKILL.md`이 작성되어 있음 (frontmatter + 본문 6섹션)
9. `CLAUDE.md`가 위 7개 섹션을 갖추고 있음 (Git 규약 + 스킬 참조 포함)
10. `prompts/01-setup.md` 하단에 `## 실행 결과 (2026-04-23)` 섹션 추가 (다른 Phase 파일과 동일한 관례)
11. `git log --oneline main` 결과에 **단 하나의 커밋** (`chore: initial project setup`)만 보이는지 확인
12. `git status` clean, `main` 브랜치 checkout 상태

---

## 명시적으로 이번 Phase에서 하지 않는 것

- MSW 핸들러 및 시드 데이터 (Phase 02+에서 기능 구현과 함께)
- 401→refresh 재시도 로직 (`shared/api/http.ts`는 시그니처 스텁만)
- Zustand 세션 스토어의 부트 시 refresh 로직
- GNB/LNB 위젯, 로그인 폼, 가상/무한 스크롤 등 **기능 코드 일체**
- `AI_USAGE.md` (요구사항 문서지만 Phase 01 산출물 목록에 없음, 최종 제출 Phase에서 작성)
- 테스트 프레임워크 (tech-stack.md 16절에서 범위 외로 명시)
- `eslint-plugin-boundaries` 같은 FSD 경계 강제 도구 (tech-stack.md 14절 의존성 표에 없음 — fsd-reviewer 에이전트가 대체)
