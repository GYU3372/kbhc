# Phase 05 — 할 일 플로우 (대시보드 · 목록 · 상세)

## Context
Phase 04까지 `_authed` 가드, 세션 스토어, `shared/ui`(Button/Card/Modal/Input/Spinner/EmptyState), HTTP 클라이언트, MSW 핸들러(`/api/dashboard`, `/api/task`, `/api/task/:id` GET/DELETE), 라우트 스켈레톤(`_authed.index.tsx`, `_authed.task.index.tsx`, `_authed.task.$id.tsx`)이 이미 준비되어 있다. `entities/task`는 타입만 있고 queryOptions가 없으며, `features/task-delete`·`widgets/task-list`·페이지 3개는 "Hello …" 플레이스홀더 상태다.

Phase 05는 이 빈 곳을 채워 대시보드 3지표 · 목록(카드 + `@tanstack/react-virtual` 가상 + `useInfiniteQuery` 무한) · 상세(조회 · 404 복귀 · id 매칭 삭제 모달)를 동작하는 기능으로 만든다. 신규 공통 UI 추가는 지양하고 Phase 03 `shared/ui`를 재사용한다.

## Git 워크플로
- `main`에서 `feat/05-tasks` 브랜치 분기 (github-flow 스킬).
- 단계별 Conventional Commit (`feat`, `chore` 등), 종료 시 `--no-ff` 머지.

## 파일 변경 계획

### 1. 엔티티 — `entities/task`
- **신규** [src/entities/task/api/get-task-list.ts](src/entities/task/api/get-task-list.ts)
  ```ts
  export const getTaskList = (page: number) =>
    http.get<TaskListResponse>(`/api/task?page=${page}`);
  ```
- **신규** [src/entities/task/api/get-task-detail.ts](src/entities/task/api/get-task-detail.ts)
  ```ts
  export const getTaskDetail = (id: string) =>
    http.get<TaskDetailResponse>(`/api/task/${id}`);
  ```
- **신규** [src/entities/task/api/task.queries.ts](src/entities/task/api/task.queries.ts) — `userQueries` 패턴 그대로 미러.
  - `all() → ['task']`
  - `lists() → ['task', 'list']`
  - `infiniteList()` → `infiniteQueryOptions({ queryKey: [...lists(), 'infinite'], queryFn: ({pageParam}) => getTaskList(pageParam), initialPageParam: 1, getNextPageParam: (last, _all, lastParam) => last.hasNext ? lastParam + 1 : undefined })`
  - `details() → ['task', 'detail']`
  - `detail(id)` → `queryOptions({ queryKey: [...details(), id], queryFn: () => getTaskDetail(id) })`
- **수정** [src/entities/task/index.ts](src/entities/task/index.ts) — `taskQueries` 추가 export.

### 2. 피처 — `features/task-delete`
- **신규** [src/features/task-delete/api/delete-task.ts](src/features/task-delete/api/delete-task.ts)
  ```ts
  export const deleteTask = (id: string) =>
    http.delete<DeleteTaskResponse>(`/api/task/${id}`);
  ```
- **신규** [src/features/task-delete/model/use-delete-task-mutation.ts](src/features/task-delete/model/use-delete-task-mutation.ts)
  - `useMutation({ mutationFn: deleteTask, onSuccess: () => queryClient.invalidateQueries({ queryKey: taskQueries.lists() }) })`
- **신규** [src/features/task-delete/ui/delete-task-modal.tsx](src/features/task-delete/ui/delete-task-modal.tsx)
  - Props: `{ taskId, open, onOpenChange, onDeleted }`.
  - `Modal.Root` + `Modal.Content` + `Input`(label `삭제할 할 일 ID 입력`, hint `${taskId}`와 동일하게 입력하면 삭제가 활성화됩니다).
  - 로컬 state `value`. `disabled = value !== taskId || mutation.isPending`.
  - 제출 버튼 `Button variant="danger"`, 취소 `Modal.Close asChild Button variant="ghost"`.
  - 성공 시 `onDeleted()` 호출 (페이지가 navigate 담당). 실패(errorMessage)는 모달 내 `<p role="alert">` 렌더.
- **수정** [src/features/task-delete/index.ts](src/features/task-delete/index.ts) — `DeleteTaskModal`만 export.

### 3. 위젯 — `widgets/task-list`
- **신규** [src/widgets/task-list/ui/task-list.tsx](src/widgets/task-list/ui/task-list.tsx)
  - `useInfiniteQuery(taskQueries.infiniteList())` → `data.pages.flatMap(p => p.data)` 평탄화.
  - `@tanstack/react-virtual`의 `useVirtualizer`:
    - `count: items.length + (hasNextPage ? 1 : 0)` (마지막 가상 행이 sentinel).
    - `estimateSize: () => 88`, `overscan: 6`, 스크롤 parent ref는 위젯 루트 div.
    - 컨테이너 높이: `h-[calc(100dvh-var(--gnb-h,4rem)-2rem)]` 등 안정적인 고정값 (뷰포트 기반, 모바일 Webview 안전).
  - 각 아이템: `Card interactive` + `Link to="/task/$id" params={{ id }}` (TanStack Router `Link`).
    - 카드 내용: 제목(text-base font-medium 1줄 ellipsis) + 메모(text-sm text-secondary 2줄 line-clamp).
    - 상태 표시: `status === 'DONE'` → `CheckCircledIcon` + sr-only 텍스트 `완료`, TODO → `CircleIcon` + `해야 할 일`.
  - 마지막 가상 행이 sentinel일 때 `IntersectionObserver`(ref 콜백)로 `fetchNextPage()` 호출. 이미 `isFetchingNextPage`면 noop.
  - 로딩 초기: `Spinner`. 에러: `<p role="alert">`. 빈 목록: `EmptyState title="할 일이 없습니다"`.
- **수정** [src/widgets/task-list/index.ts](src/widgets/task-list/index.ts) — `TaskList` export.

### 4. 페이지 — 대시보드
- **신규** [src/pages/dashboard/api/dashboard.queries.ts](src/pages/dashboard/api/dashboard.queries.ts)
  - tech-stack 규약: dashboard는 엔티티가 아니므로 페이지 내부에 `queryOptions` 배치.
  - `dashboardQueries.summary()` → `queryOptions({ queryKey: ['dashboard', 'summary'], queryFn: () => http.get<DashboardResponse>('/api/dashboard') })`.
- **수정** [src/pages/dashboard/ui/dashboard-page.tsx](src/pages/dashboard/ui/dashboard-page.tsx)
  - `useQuery(dashboardQueries.summary())`.
  - 3지표를 `Card` 3개 그리드(`grid-cols-1 sm:grid-cols-3 gap-3`)로 배치: `일(numOfTask)`, `해야할 일(numOfRestTask)`, `한 일(numOfDoneTask)`.
  - 로딩 → `Spinner`. 에러 → `<p role="alert">{error.message}</p>`.

### 5. 페이지 — 목록
- **수정** [src/pages/task-list/ui/task-list-page.tsx](src/pages/task-list/ui/task-list-page.tsx)
  - 상단 제목 `<h1>할 일</h1>` + `<TaskList />`. 페이지는 레이아웃 컨테이너만 담당.

### 6. 페이지 — 상세
- **수정** [src/pages/task-detail/ui/task-detail-page.tsx](src/pages/task-detail/ui/task-detail-page.tsx)
  - `useQuery(taskQueries.detail(id))`.
  - 에러가 `HttpError` + `status === 404` → 404 화면: `EmptyState title="할 일을 찾을 수 없어요" action={<Button>목록으로</Button>}` (`useNavigate` → `/task`).
  - 그 외 에러 → `<p role="alert">`.
  - 로딩 → `Spinner`.
  - 성공 → title, memo, `registerDatetime`(로케일 포맷), 하단 `Button variant="danger"` `삭제`.
  - 삭제 버튼 `onClick` → 로컬 state `open=true`. `<DeleteTaskModal taskId={id} open={open} onOpenChange={setOpen} onDeleted={() => navigate({ to: '/task' })} />`.

## 재사용 자산
- [src/shared/ui/index.ts](src/shared/ui/index.ts): `Button` `Card` `Modal` `Input` `Spinner` `EmptyState` — 신규 공통 컴포넌트 추가 없음.
- [src/shared/api/http.ts](src/shared/api/http.ts): `http.get/delete`, `HttpError.status`(404 판별에 사용).
- [src/entities/user/api/user.queries.ts](src/entities/user/api/user.queries.ts): `taskQueries` 팩토리 참고 패턴.
- [src/shared/api/query-client.ts](src/shared/api/query-client.ts): 싱글톤 `queryClient` export. mutation 훅 내부에서는 `useQueryClient()` 훅 경유가 무난(이미 `use-sign-out.ts` 등이 같은 패턴).
- 아이콘: `@radix-ui/react-icons`의 `CheckCircledIcon`, `CircleIcon`, `TrashIcon`, `ArrowLeftIcon`만 추가 사용.

## 제약 체크리스트
- 카드 인터랙션은 `Link` 자체가 포커스 가능 → 키보드 이동 OK. `Card interactive`의 hover/focus 토큰 재사용.
- Modal 제출 버튼 `disabled`는 `aria-describedby`로 hint 연결 (이미 `Input` 컴포넌트가 처리).
- `useVirtualizer` 컨테이너는 `overflow-y-auto` + 고정 높이; 모바일 Webview에서 `100dvh` 기반 사용.
- 핸들러는 MSW가 페이지당 20개(`PAGE_SIZE=20`), 총 300개 시드 — 무한 스크롤 15페이지까지 검증 가능.
- mutation은 feature 소유, 성공 시 `taskQueries.lists()`로 invalidate만 수행(상세 캐시는 navigate로 언마운트).

## 하지 않을 것
- 정렬/필터/검색/편집/생성/다중삭제 UI 일절 금지.
- 대시보드 차트·그래프 없음, 숫자 + 라벨만.
- 신규 공통 UI(Table 등) 추가 없음. 상세 페이지 전용 UI는 pages/widget 내부에서만.

## 검증 (end-to-end)
1. `pnpm dev` 실행 → 로그인(데모 계정) 후 `/` 접근.
   - 대시보드 카드 3개가 MSW 집계 값(300 / 해야할 일 수 / 한 일 수)을 표시.
2. `/task` 진입 → 카드 20개 렌더. 스크롤 끝 도달 시 다음 페이지 prefetch(`useInfiniteQuery` 로그 또는 네트워크 탭).
3. 카드 클릭 → `/task/$id` 이동, 제목·메모·등록일 렌더.
4. 주소창에 존재하지 않는 id(예: `/task/does-not-exist`) → 404 화면 + `목록으로` 버튼 → 클릭 시 `/task`.
5. 삭제 버튼 → 모달 오픈 → input 비어있거나 잘못된 값: 제출 버튼 `disabled`. id와 동일 입력 시 활성화. 제출 → 목록으로 이동하고 해당 id가 사라짐(cache invalidate 결과).
6. `pnpm typecheck`·`pnpm lint` 통과.
7. 리뷰 에이전트 점검: `fsd-reviewer`(신규 slice 의존 방향), `openapi-contract-checker`(queryFn 시그니처), `a11y-reviewer`(모달 라벨·키보드 동선).
