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

`fsd-reviewer` · `openapi-contract-checker` · `a11y-reviewer` 3개 에이전트 + 수기 요구사항 체크로 전수 점검. 요구사항 미충족 0건.

### 반영 항목
- **SEO/문서 제목**: `index.html`에 `meta description` 추가, `useDocumentTitle` 훅 도입해 5개 페이지에 동적 title 부여 (WCAG 2.4.2).
- **Webview/레이아웃**: `#root`에 `100svh → 100dvh` fallback, `__root`·`gnb`에 `env(safe-area-inset-*)` 패딩 적용, 대시보드·상세 `max-w-5xl`.
- **접근성**: `DeleteTaskModal` 서버 에러를 `Input.error` 오용에서 분리해 `role=alert` + `aria-describedby`·`aria-busy`로 재구성, `TaskList` 가상 리스트에 `role=list/listitem` + `aria-posinset`, Link `aria-label`로 절단 텍스트 보완. 페이지 에러 문구는 `alert → status`로 완화, `Modal`·`Spinner`에 `motion-reduce` 대응.
- **MSW/계약**: `/api/task` `page` 필수 검증(400), `/api/refresh` malformed 400 분기, refresh 응답 타입을 `AuthTokenResponse`로 교체. `http.ts`는 Bearer 전환에 맞춰 `credentials:'include'` 제거.
- **FSD**: 인증 로직(`signIn`·`refreshSession`·`resetSession`·`useSignOut`)을 `entities/session` → `features/auth`로 이전. 엔티티는 상태만 소유.
- **기타 폼/UI**: sign-in zod `.strict()`, 제출 버튼 로딩 텍스트 스왑 제거, 404 페이지를 `task-not-found` 디자인과 정렬, error-boundary를 공용 `Button`으로 통일.

### 보류/기록
- `entities/dashboard`의 `summary()`가 `details()` 중간층 없이 `all()` 아래 바로 붙음 — 단일 엔드포인트라 현 구조 유지.
- `entities/task`의 `infiniteList()` 네이밍, `DeleteTaskModal` description/hint 문구 중복 — 실익 낮아 유지.
- Vite 500kB 경고·번들 분할은 과제 범위 밖.

### 검증
`pnpm lint` · `typecheck` · `build` 통과. 에이전트 재실행에서 Critical 회귀 0건(첫 재검증 경미 회귀 2건은 같은 세션에서 해소). UI 수동 검증은 Phase 05 방침대로 생략.
