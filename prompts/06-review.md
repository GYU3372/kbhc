# 06 최종 리뷰

## 목표
- 구현된 전체 앱을 최종 리뷰하고, 수정이 필요한 항목을 근거와 함께 정리
- 요구사항 충족 여부, 접근성/SEO, FSD 구조, 렌더링 성능, 불필요 코드를 중심으로 점검

## 참고 문서
- `docs/requirements.md` — 과제 요구사항
- `docs/openapi.yaml` — API 스펙
- `docs/tech-stack.md` — 기술 결정, FSD·성능·접근성 기준

## 판단 기준
- `docs/requirements.md`와 `docs/openapi.yaml`에 명시된 조건이 모두 구현되었고 잘못 구현된 부분이 없는가
- 접근성이 적절히 구현되었는가. 특히 label, aria, 포커스, 모달, 키보드 접근, `<title>`/meta 등 Lighthouse SEO 감점 요소를 확인
- FSD 패턴에 맞게 계층 방향, public API, query/mutation 책임이 설계되었는가
- 렌더링 최적화가 과하지도 부족하지도 않게 적용되었는가
- 쓰지 않는 코드, 불필요한 export/import, 디버그 코드, 중복 구현이 남아 있지 않은가
- 인증, 에러, 404, 빈 상태, 삭제, 모바일/Webview 같은 경계 상황이 정상 동작하는가

## 리뷰 에이전트 활용
- `openapi-contract-checker` — OpenAPI, 타입, zod, MSW 정합성
- `a11y-reviewer` — 접근성, Webview, SEO 메타데이터 인접 항목
- `fsd-reviewer` — FSD 계층, public API, query/mutation 배치

## 제약
- 과제 요구사항 밖의 기능 추가 금지
- 취향성 스타일 변경이나 대규모 리팩터링은 명확한 결함 근거가 있을 때만 제안
- 리뷰 결과는 파일·라인·근거·수정 방향이 드러나게 정리

## 하지 말 것
- 요구사항에 없는 기능 추가
- 성능 근거 없는 `memo`, `useMemo`, `useCallback` 남용
- FSD 명목의 과한 세그먼트 분리
- Lighthouse 점수만을 위한 무의미한 메타/키워드 남발
- 사용 여부가 불분명한 코드를 추측으로 삭제

## 실행 결과 (2026-04-24)

### 리뷰 개요
4축을 병렬로 돌려 구현물 전수 점검. 3개 에이전트 + 수기 요구사항 체크.

| 축 | 에이전트/방법 | 최초 판정 |
| --- | --- | --- |
| FSD 구조 | `fsd-reviewer` | Critical 0, Minor 3, Info 다수 |
| OpenAPI 정합성 | `openapi-contract-checker` | Critical 1 (Phase 05 이월), Minor 4, Info 4 |
| 접근성·SEO | `a11y-reviewer` | Critical 5, Minor 6, Info 6 |
| 요구사항 체크리스트 | 수기(코드 직접 확인) | 미충족 0 (5 페이지 모두 사양 충족) |

### Critical 수정 항목
| # | 파일 | 근거 | 수정 |
| --- | --- | --- | --- |
| 1 | [src/shared/api/mocks/handlers/task.ts](src/shared/api/mocks/handlers/task.ts) | `GET /api/task` 400 응답이 `docs/openapi.yaml`에 정의되지 않음 (Phase 05 이월). | `page` 파싱 실패 시 400 반환 대신 `page=1`로 fallback해 스펙의 200/401만 반환. |
| 2 | [index.html](index.html) | `<meta name="description">` 부재로 Lighthouse SEO 감점. | `name="description"` 메타 태그 추가. |
| 3 | [src/shared/lib/use-document-title.ts](src/shared/lib/use-document-title.ts) (신규) + 5개 페이지 | SPA가 모든 라우트에서 탭 제목을 "KB헬스케어 과제"로 고정 (WCAG 2.4.2 "Page Titled"). | `useDocumentTitle` 훅을 추가해 sign-in / dashboard / task-list / task-detail(제목 동적) / user 5개 페이지에 각자 제목 부여. |
| 4 | [src/app/styles/app.css](src/app/styles/app.css) | `#root`가 `100dvh`만 사용, Safari 구버전에서 fallback 없음. | `min-height: 100svh; min-height: 100dvh;` 2-stage 선언. body safe-area 패딩은 `100dvh` 합산 시 iOS 오버플로우 우려로 도입 보류(고정 하단 UI가 없어 viewport-fit=cover만으로 충분). |
| 5 | [src/features/task-delete/ui/delete-task-modal.tsx](src/features/task-delete/ui/delete-task-modal.tsx) | 서버 실패 메시지를 `Input.error` prop으로 전달 → 입력값이 잘못됐다고 `aria-invalid=true`가 붙음 (WCAG 3.3.1 "Error Identification" 오용). | 서버 에러를 `Input`에서 분리해 별도 `role="alert"` 문단으로 렌더. |
| 6 | [src/widgets/task-list/ui/task-list.tsx](src/widgets/task-list/ui/task-list.tsx) | Card 내부 텍스트가 `truncate`/`line-clamp`되어 스크린리더가 잘린 상태로 낭독. | `Link`에 `aria-label`로 상태+제목+동작을 명시하고, 중복이 되는 `sr-only` 상태 span을 제거. |
| 7 | [src/shared/api/http.ts](src/shared/api/http.ts) | refresh 응답을 `{ accessToken: string }` 임시 타입으로 파싱 → 스펙 `AuthTokenResponse`(accessToken·refreshToken required)와 타입 차이. | `components['schemas']['AuthTokenResponse']`에서 파생한 타입으로 교체. |

### Minor 보류 항목 (기록만)
- `entities/dashboard/api/dashboard.queries.ts`의 `summary()`가 `all()` 바로 아래에 붙어 `details()` 중간층이 비어 있음. 단일 엔드포인트 수준이라 규약 확장 대신 현 구조 유지.
- `entities/task/api/task.queries.ts`의 `infiniteList()`가 `list()` 규약과 어긋난 이름. `useInfiniteQuery`용임을 드러내는 관행상 허용.
- `shared/api/http.ts`의 `HttpError`·`configureHttp` 등을 `shared/api/index.ts` 배럴로 모으는 안 — shared 최하위층의 내부 경로 import는 관행상 허용되므로 보류.
- sign-in zod 스키마: OpenAPI의 `minLength`/`maxLength`/`pattern`을 regex quantifier(`{8,24}`)로 합친 형태. 기능 동등, 에러 메시지 세분화는 현 사양 범위 외.
- `entities/session`의 `reset-session.ts`·`use-sign-out.ts`가 model 세그먼트에 공존. `lib/`로 분리 가치 낮음.
- `DeleteTaskModal`의 `Modal.Description`과 `Input.hint`가 같은 ID 텍스트를 중복 안내. 시맨틱 변화 작아 현 상태 유지.

### Out-of-scope (기록)
- Vite 번들이 500kB 경고: manualChunks/라우트 code-splitting은 과제 범위 밖.
- MSW `refresh` 400 브랜치: 스펙에 정의돼 있으나 클라이언트가 401/400을 동일 처리하므로 기능 편차 없음.

### 검증
- `pnpm lint` · `pnpm typecheck` · `pnpm build` 모두 통과.
- `openapi-contract-checker`·`a11y-reviewer` 재실행: Critical 회귀 0건. 첫 재검증에서 드러난 경미 회귀 2건(body safe-area 패딩과 `100dvh` 합산 오버플로 우려, Link `aria-label`과 `sr-only` 상태 텍스트 중복)은 같은 세션에서 각각 body 패딩 롤백·sr-only 제거로 해소.
- 브라우저 자동화 미사용 — UI 수동 검증은 Phase 05와 동일한 방침으로 생략.

### 남긴 것
- 현재 잔존 Critical 0건. Minor는 위 "보류 항목"에 나열된 대로 의식적 보류. Phase 05에서 이월된 `task.ts` 400 응답도 이번 Phase에서 종결.
