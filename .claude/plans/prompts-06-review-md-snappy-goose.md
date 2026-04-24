# Phase 06 — 최종 리뷰 + 즉시 수정

## Context
Phase 01~05에서 MSW·공통 UI·인증·할 일 플로우를 모두 구현했다. 각 Phase에서 단계별 리뷰 에이전트(FSD·OpenAPI·a11y) 합격을 확인했지만, **앱 전체를 한 번에 겹쳐 보는 최종 점검은 없었다.** Phase 05 실행 결과에 남은 스펙 편차(`mocks/handlers/task.ts` 400 응답)도 공식적으로 닫히지 않았다.

Phase 06의 목적은 `docs/requirements.md`·`docs/openapi.yaml`·`docs/tech-stack.md` 세 축을 기준으로 구현물을 전수 점검하고, 명확한 결함은 이번 Phase 안에서 바로 고쳐 "주 브랜치에 놓아도 되는 상태"로 만드는 것이다. 판정 결과는 `prompts/06-review.md` 하단 `## 실행 결과` 섹션에 남기고, 작업은 `docs/06-review` 브랜치에서 진행해 main에 `--no-ff`로 머지한다.

## 작업 방식 개요
- 리뷰는 **4개 축 병렬 수집 → 트리아주 → 수정 → 재검증** 순으로 진행.
- 스타일 취향·대규모 리팩터링·요구사항 밖 기능 추가는 수정 대상에서 제외 (`prompts/06-review.md`의 "하지 말 것" 규약).
- 수정 범위는 "근거·파일·라인이 특정되는 결함"만. 그 외는 보고서에만 기록하고 닫는다.

## Step 1 — 브랜치 준비
- `main`이 깨끗한지 `git status` 확인. `prompts/05-tasks.md`와 `prompts/06-review.md` 워킹 트리 변경분은 stash 없이 그대로 가져가도 무방 (이번 Phase의 산출물에 포함).
- `github-flow` 스킬 규약에 따라 `docs/06-review` 브랜치 생성 후 체크아웃.

## Step 2 — 리뷰 수집 (4축 병렬)
아래 4축을 동시에 돌려 raw 발견 사항을 모은다. 각 축은 독립적이므로 한 메시지에서 에이전트 3개 + 수기 체크리스트 1건 병렬 실행.

### 2-A. `fsd-reviewer`
- 대상: [src/](src/) 전체. 특히 최근 Phase에서 추가된 [src/entities/dashboard/](src/entities/dashboard/), [src/features/task-delete/](src/features/task-delete/), [src/widgets/task-list/](src/widgets/task-list/), [src/pages/](src/pages/).
- 체크: 계층 방향(app → routes → pages → widgets → features → entities → shared), 동일 레이어 cross-slice import, slice 내부 경로 직접 import, `useMutation` 훅이 entities에 섞였는지, `queryOptions` 네이밍(`all/lists/details/list/detail`).

### 2-B. `openapi-contract-checker`
- 대상: [src/shared/api/](src/shared/api/) 전체, [src/entities/*/api/](src/entities/), [src/features/task-delete/model/](src/features/task-delete/model/), [src/shared/api/mocks/handlers/](src/shared/api/mocks/handlers/).
- 체크: [docs/openapi.yaml](docs/openapi.yaml) 대비 타입·zod 스키마·MSW 응답 일치. **Phase 05에서 남긴 `task.ts` 400 응답은 반드시 판정을 받아야 할 항목.**

### 2-C. `a11y-reviewer`
- 대상: [src/shared/ui/](src/shared/ui/), [src/widgets/gnb/](src/widgets/gnb/), [src/widgets/lnb/](src/widgets/lnb/), [src/widgets/task-list/](src/widgets/task-list/), [src/pages/sign-in/](src/pages/sign-in/), [src/pages/task-detail/](src/pages/task-detail/), [src/features/task-delete/ui/](src/features/task-delete/ui/), [src/app/styles/](src/app/styles/), [index.html](index.html).
- 체크: label↔input 연결, `aria-invalid`/`aria-describedby`, 모달 focus trap·ESC·포커스 복귀, Button `disabled` 의미론, `:focus-visible`, `100dvh`/safe-area, `<title>`/meta description 같은 Lighthouse SEO 감점 요소.

### 2-D. 수기 요구사항 체크 (나 직접)
`docs/requirements.md` 체크리스트 전수. Explore 에이전트 인벤토리에 정리된 항목을 다시 **코드로 직접 확인**한다:
- 로그인: email·`^[A-Za-z0-9]{8,24}$` 검증, 실패 시 `errorMessage` 모달 ([src/pages/sign-in/](src/pages/sign-in/))
- 목록: 가상 스크롤(보이는 것만 렌더) + 무한 스크롤(20건 페이지네이션) ([src/widgets/task-list/](src/widgets/task-list/))
- 상세: 404 화면 + 목록 복귀, 삭제 모달 id-입력 일치 시에만 submit 활성 ([src/pages/task-detail/](src/pages/task-detail/), [src/features/task-delete/ui/delete-task-modal.tsx](src/features/task-delete/ui/delete-task-modal.tsx))
- 대시보드: `numOfTask`/`numOfRestTask`/`numOfDoneTask` 3지표 표시 ([src/pages/dashboard/](src/pages/dashboard/))
- 회원정보: name·memo 표시 ([src/pages/user/](src/pages/user/))
- GNB/LNB: 인증 분기 아이콘, 라우트 링크 ([src/widgets/gnb/](src/widgets/gnb/), [src/widgets/lnb/](src/widgets/lnb/))
- 401 → refresh 자동 복원 ([src/shared/api/http.ts](src/shared/api/http.ts), [src/app/providers/session-provider.tsx](src/app/providers/session-provider.tsx))
- 불필요한 `memo`/`useMemo`/`useCallback`, 사용되지 않는 export/import, 디버그 `console.log`, 중복 구현 스캔

## Step 3 — 트리아주
수집한 발견 사항을 3등급으로 분류한다. 에이전트 판정과 수기 체크를 하나의 테이블로 합친다.

| 등급 | 정의 | 이번 Phase 처리 |
| --- | --- | --- |
| Critical | 요구사항 미충족, 인증/에러/404 경계 상황 버그, OpenAPI 스펙 위반, a11y 필수 위반(label 없음·focus trap 부재 등) | 즉시 수정 |
| Minor | FSD 경계 살짝 흐려짐, 불필요한 memo 류, 쓰이지 않는 export, 사소한 aria 개선 | 범위 판단 후 수정 (같은 파일 수정 중이면 함께, 아니면 보고서만) |
| Out-of-scope | 스타일 취향, 대규모 리팩터링, 기능 추가 요구 | 보고서에만 기록, 수정 금지 |

**Phase 05 이월 항목 — `mocks/handlers/task.ts` 400 응답**: Phase 06에서 Critical로 처리. openapi에 없는 400 응답을 제거하거나, 조건을 유지한다면 openapi에 추가. 방향은 트리아주 시점에 에이전트 판정 근거를 보고 결정.

## Step 4 — 수정 적용
- Critical부터 파일당 묶어서 수정. 각 수정은 근거(요구사항/스펙/가이드라인)를 커밋 메시지에 명시.
- 주의: 수정 중 리팩터링 충동이 들어도 **"관련 없는 개선은 금지"** 규약 유지.
- 기대 수정 유형 예시 (실제 적용은 트리아주 결과에 따름):
  - MSW 핸들러의 스펙 외 응답 제거/정돈
  - 누락된 `<title>`/meta description 추가 ([index.html](index.html))
  - 잉여 memoization 제거
  - 사용되지 않는 export/import 정리
  - a11y 보강(aria-label·aria-describedby 누락분)

## Step 5 — 재검증
- `pnpm lint`, `pnpm typecheck`, `pnpm build` 3종 모두 통과 확인.
- 수정된 파일이 속한 축의 에이전트를 **해당 파일만 범위로** 재실행하여 판정이 깨끗해졌는지 확인.
- 브라우저 자동화는 없으므로 UI 수동 검증은 생략 (Phase 05와 동일 방침).

## Step 6 — 보고서 기록
[prompts/06-review.md](prompts/06-review.md) 하단에 `## 실행 결과 (2026-04-24)` 섹션을 추가한다. 다음 하위 섹션 포함:
- **리뷰 개요**: 축별 점검 범위와 에이전트 판정 요약
- **Critical 수정 항목**: 파일·라인·근거·수정 내용 (표 또는 불릿)
- **Minor 보류 항목**: 기록만 하고 수정하지 않은 이유
- **Out-of-scope**: 추후 과제/실제 프로덕트였을 때 고려할 것 (선택)
- **검증**: lint/typecheck/build 결과와 재리뷰 결과
- **남긴 것**: 이번에도 닫지 못한 잔존 이슈 (목표는 0건)

## Step 7 — 머지
- 변경 파일을 의미 단위로 커밋 (`fix:`/`chore:`/`docs:` 구분).
- 최종 커밋 후 main으로 체크아웃 → `git merge --no-ff docs/06-review`.
- **머지 전 사용자 승인을 받는다** (CLAUDE.md의 GitHub Flow 규약 — "승인 후 main 머지").

## 검증 방법 (end-to-end)
| 항목 | 방법 |
| --- | --- |
| 타입 | `pnpm typecheck` |
| 린트 | `pnpm lint` |
| 빌드 | `pnpm build` (tsc --noEmit 포함) |
| FSD 재검증 | `fsd-reviewer` 서브에이전트, 수정 파일만 범위 지정 |
| 스펙 정합성 | `openapi-contract-checker`, 수정 파일만 범위 지정 |
| 접근성 | `a11y-reviewer`, 수정 파일만 범위 지정 |
| 요구사항 | `docs/requirements.md` 체크리스트 수기 재검토 |

## 편집 예상 파일 (트리아주 결과에 따라 가감)
- [prompts/06-review.md](prompts/06-review.md) — 실행 결과 섹션 추가 (확정)
- [src/shared/api/mocks/handlers/task.ts](src/shared/api/mocks/handlers/task.ts) — Phase 05 이월 400 응답 정리 (유력)
- [docs/openapi.yaml](docs/openapi.yaml) — 위 항목을 openapi에 반영하기로 결정할 경우
- [index.html](index.html) — `<title>`/meta description 점검 결과에 따라
- 에이전트 판정으로 드러나는 개별 파일들 — 현 시점에 확정할 수 없음. 트리아주 시점에 범위 고정 후 수정.

## 하지 말 것 (재확인)
- 요구사항 밖 기능 추가 (정렬/필터/검색/편집/테스트 프레임워크 도입 등)
- 성능 근거 없는 memoization 재작성
- "보기 좋으라고" 하는 구조 이동, 디렉터리 재배치
- Lighthouse 점수를 위한 의미 없는 메타/키워드 남발
- 사용 여부가 불분명한 코드의 추측 삭제
- `--no-verify`로 훅 건너뛰기, `--force` 계열 작업
