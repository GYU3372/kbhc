# 01 프로젝트 셋업

## 하지 말 것
- 기능 구현은 하지 않음 (다음 Phase에 순서대로 구현할 것임)

## 목표
- `docs/tech-stack.md` 결정안대로 의존성, 설정, FSD 뼈대 구축
- CLAUDE.md와 리뷰 에이전트 준비

## 참고 문서
- `docs/tech-stack.md` — 기술 스택 결정 문서

## 산출물

- 프로젝트 설정 + FSD 뼈대
- `.claude/agents/*.md` - 프로젝트 구성에 필요한 에이전트 생성
  - a11y-reviewer — 접근성, Webview 대응 리뷰
  - fsd-reviewer — FSD 구조 리뷰
  - openapi-contract-checker — OpenAPI 명세, 타입, MSW 핸들러 정합 리뷰
- CLAUDE.md 생성

## 실행 결과 (2026-04-23)

- `git init -b main` 수행. GitHub Flow는 Phase 02+에서 feature 브랜치로 적용 예정
- tech-stack.md 14절 의존성 + `openapi-typescript` 추가로 `package.json` 작성, `pnpm install` 성공
- 루트 설정: `tsconfig.json`/`tsconfig.node.json`(composite) / `vite.config.ts`(TanStackRouterVite + tailwindcss + react + `@` alias) / `eslint.config.js`(flat: typescript-eslint + react + react-hooks + react-refresh + jsx-a11y + @tanstack/query) / `prettier.config.mjs` / `.gitignore` / `.env.development`/`.env.production`(VITE_API_BASE_URL, VITE_ENABLE_MSW=false) / `index.html`
- FSD 뼈대(`src/`): `app/{main.tsx, providers, styles/app.css}`, `routes/{__root, sign-in, _authed, _authed.index, _authed.task.index, _authed.task.$id, _authed.user}.tsx`, `pages/{sign-in,dashboard,task-list,task-detail,user}` Hello 스텁, `widgets/{gnb,task-list}`, `features/task-delete`, `entities/{task,user,session}`, `shared/{api,config,lib,ui}`
- `pnpm gen:api` 실행 → `src/shared/api/openapi.d.ts` 생성. entities의 타입은 `components['schemas']['X']` re-export만 (단일 소스 유지)
- `shared/api/http.ts` 시그니처 스텁(HTTP 래퍼 + `HttpError`), `shared/api/query-client.ts`(staleTime 5분 + 401 재시도 제외). 401→refresh 본격 로직은 Phase 02+
- 리뷰 에이전트 3개 작성: `.claude/agents/{a11y-reviewer,fsd-reviewer,openapi-contract-checker}.md` — 과제 규모에 맞춰 엔터프라이즈 잣대 제외, 구조적 빈틈만 지적하는 체크리스트
- GitHub Flow 스킬 작성: `.claude/skills/github-flow/SKILL.md` — 브랜치 네이밍·Conventional Commits·`--no-ff` 머지 규약. Phase 02+ 작업 시 자동 트리거
- `CLAUDE.md` 작성: 명령어, 스택 요약, FSD 규약, Git 규약(스킬 참조 포함), Phase 작업 방식, 에이전트 요약
- `build` 스크립트를 `vite build && tsc --noEmit` 순서로 변경(TanStack Router plugin이 `vite build` 중 `routeTree.gen.ts`를 생성하므로 tsc가 그 이후여야 함). `exactOptionalPropertyTypes` 관련 `http.ts` 초기 타입 오류 1건 수정
- 최종 검증: `pnpm lint`·`pnpm typecheck`·`pnpm build` 전부 통과. `pnpm dev`로 vite 서버 기동 확인, `routeTree.gen.ts`에 6개 라우트(SignIn / Authed 레이아웃 / AuthedIndex=dashboard / AuthedUser / AuthedTaskIndex / AuthedTaskId) 등록 확인
- 전체 산출물을 `main`에 **단일 initial commit** (`chore: initial project setup`)으로 기록