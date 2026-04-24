# 05 할 일 플로우 (대시보드 · 목록 · 상세)

## 목표
- 인증된 사용자의 핵심 도메인인 대시보드 요약, 목록(가상·무한 스크롤), 상세(조회·삭제)를 한 Phase에서 묶어 구현
- Phase 04에서 정돈된 `_authed` 가드 · React Query 팩토리 · `shared/ui`를 그대로 재사용

## 참고 문서
- `docs/requirements.md` — 대시보드 요약, 목록 카드/가상·무한 스크롤, 상세 404/삭제 모달 규칙
- `docs/openapi.yaml` — `/api/dashboard`, `/api/task`, `/api/task/{id}`
- `docs/tech-stack.md` — React Query `queryOptions` 팩토리, 가상 스크롤·무한 스크롤 선택 근거

## 상세 계획을 세울 범위
- 대시보드 페이지 (`/`): 요약 3지표 렌더, 로딩/에러 처리
- 목록 페이지 (`/task`): 카드 목록 + 가상 스크롤 + 무한 스크롤 + 카드 클릭 → 상세 이동
- 상세 페이지 (`/task/:id`): 조회 · 404 화면(목록 복귀 버튼) · 삭제 모달(id 동일 입력 시에만 제출 활성, 성공 시 목록 redirect)
- `entities/task` queryOptions(list/detail) 및 `features/task-delete` mutation 분리

## 제약
- 아이콘은 `@radix-ui/react-icons`만 사용
- UI는 Phase 03의 `shared/ui` 재사용 우선, 신규 공통 컴포넌트 추가 지양
- FSD 계층 방향 유지: mutation은 feature 또는 페이지가 소유, 성공 시 엔티티 팩토리 키로 `invalidateQueries`

## 하지 말 것
- 요구사항 밖의 과한 구현 (정렬/필터/검색/편집/생성 등)
- 대시보드에 차트·그래프 추가
- 목록 페이지 내 인라인 편집·선택 다중 삭제

## 실행 결과 (2026-04-23)

### 구현 요약
- `entities/task`에 read-only queryOptions 팩토리 추가 (`taskQueries.infiniteList()`, `taskQueries.detail(id)`, `userQueries` 패턴 미러).
- `features/task-delete`에 mutation 훅 + Radix Dialog 기반 삭제 확인 모달 구현. 성공 시 `taskQueries.lists()`로 `invalidateQueries`.
- `widgets/task-list`에 `@tanstack/react-virtual` + `useInfiniteQuery` + IntersectionObserver 센티넬 조합으로 가상·무한 스크롤 컨테이너 구현. 각 카드는 `<Link to="/task/$id">` 래핑 `Card interactive`.
- 페이지 3종 교체:
  - `pages/dashboard`: 내부 `dashboard.queries.ts`(엔티티 승격 없음) + 3지표 카드 그리드.
  - `pages/task-list`: 제목 + `TaskList` 위젯 배치.
  - `pages/task-detail`: `useQuery(taskQueries.detail(id))` + `HttpError.status === 404`에서 `EmptyState` + 목록 복귀 버튼, 삭제 버튼 → `DeleteTaskModal` 연결, 성공 시 `/task`로 navigate.
- Phase 03 `shared/ui`(Button/Card/Modal/Input/Spinner/EmptyState) 재사용만으로 해결, 신규 공통 UI 추가 0건.
- 추가 보완: `dashboardQueries`를 `entities/dashboard`로 승격하고 task 삭제 성공 시 목록·상세·대시보드 캐시를 함께 정리.
- 추가 보완: LNB/GNB를 full-width 앱 shell 기준으로 조정하고, task 목록 스크롤 복원·가상 리스트 row 높이 안정화.

### 검증
- `pnpm lint`, `pnpm typecheck`, `pnpm build` 모두 통과.
- `fsd-reviewer`, `openapi-contract-checker`, `a11y-reviewer` 3종 합격 (a11y 리뷰 제안 반영: 삭제 모달 `errorMessage`를 `Input.error` prop으로 연결해 `aria-invalid`/`aria-describedby` 자동 연결).
- 브라우저 자동화 수단이 없어 UI 수동 검증은 생략. 플로우 스모크는 빌드/타입/리뷰로 대체.

### 남긴 것 (범위 밖)
- `src/shared/api/mocks/handlers/task.ts`의 400 응답은 openapi에 없는 응답이므로 스펙 편차 존재(contract-checker 지적). Phase 05 범위를 벗어나 Phase 별도 정리.
