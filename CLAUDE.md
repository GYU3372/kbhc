# CLAUDE.md

KB헬스케어 프론트엔드 take-home 과제 저장소. React 19 + Vite SPA, FSD 아키텍처.

## 참고 문서
- `docs/tech-stack.md` — 모든 기술 결정의 근거와 범위
- `docs/requirements.md` — 과제 요구사항 (5페이지, label/validation/모달/가상·무한 스크롤/MSW)
- `docs/openapi.yaml` — API 단일 소스 (7개 엔드포인트)
- `prompts/NN-*.md` — 단계별 실행 지시서

## 주요 명령어
| 명령 | 용도 |
| --- | --- |
| `pnpm dev` | 개발 서버 (TanStack Router 자동 생성 + HMR) |
| `pnpm build` | `vite build && tsc --noEmit` |
| `pnpm typecheck` | `tsc --noEmit` (routeTree.gen.ts는 build 또는 dev로 먼저 생성) |
| `pnpm lint` | ESLint 9 flat config |
| `pnpm format` | Prettier (+ tailwindcss 정렬) |
| `pnpm gen:api` | `docs/openapi.yaml → src/shared/api/openapi.d.ts` |

## 스택 요약
| 영역 | 선택 |
| --- | --- |
| 라우팅 | `@tanstack/react-router` (파일 기반) |
| 서버 상태 | `@tanstack/react-query` v5 + `queryOptions` 팩토리 |
| 클라 상태 | Zustand (`entities/session/model/session.store.ts`) |
| 폼 | `react-hook-form` + `zod` + `@hookform/resolvers/zod` |
| 스타일 | Tailwind CSS v4 (`@theme` CSS 변수) + Radix Primitives |
| 목업 | MSW 2.x (Phase 02+에서 활성화, `VITE_ENABLE_MSW`) |
| 패키지 | pnpm, Node 20 LTS |

## FSD 규약
- 계층 의존성은 **단방향**: `app → routes → pages → widgets → features → entities → shared`. 동일 레이어 cross-slice import 금지
- 각 slice는 `index.ts`를 public API로 노출. slice 내부 경로 직접 import 금지
- `entities/*/api/`는 read(쿼리) 전용. `useMutation` 훅은 feature 또는 페이지가 소유. mutation 성공 시 엔티티 팩토리 키로 `invalidateQueries`
- queryOptions 네이밍: `all() → lists()/details() → list()/detail()`. query key 문자열은 엔티티 팩토리에만

## Git 규약 (GitHub Flow + Conventional Commits)
- `main`은 항상 빌드 가능 상태 유지 (Phase 01 initial commit 예외)
- 새 작업은 `<type>/<NN>-<slug>` 브랜치에서 (예: `feat/02-auth`, `chore/99-cleanup`)
- 커밋 메시지 타입: `feat / fix / chore / docs / refactor / style / build / ci / test`
- 머지는 `git merge --no-ff`로 Phase 이력 보존
- **세부 절차와 자동화는 `.claude/skills/github-flow/SKILL.md` 참조** — Claude Code가 "새 Phase 시작", "이 변경 커밋해줘", "Phase 종료" 등에서 이 스킬을 트리거해 규약대로 실행

## Phase 작업 방식
1. `prompts/NN-*.md`를 순서대로 실행. 각 파일이 해당 Phase의 목표·산출물·지켜야 할 선을 정의
2. Phase 종료 시 해당 프롬프트 파일 하단에 `## 실행 결과 (YYYY-MM-DD)` 섹션 추가
3. 새 Phase는 `main`에서 `<type>/<NN>-<slug>` 브랜치로 분기 (Phase 02+)

## 리뷰 에이전트 (`.claude/agents/`)
- `a11y-reviewer` — 접근성·Webview 대응. 폼 라벨, 포커스 트랩, `100dvh`/safe-area, transform 애니메이션
- `fsd-reviewer` — FSD 계층/세그먼트 규약. 의존성 방향, public API, queries/mutations 분리
- `openapi-contract-checker` — `docs/openapi.yaml` 대비 타입/zod/MSW 정합성
