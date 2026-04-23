# 02 API 목업 구성 (MSW)

## 목표
- MSW로 `docs/openapi.yaml`의 엔드포인트·시드를 이번 Phase에서 일괄 구현
- 이후 Phase는 UI 구현에만 집중할 수 있는 상태로 구현

## 참고 문서
- `docs/openapi.yaml` — API 단일 소스
- `docs/tech-stack.md` - MSW 관련 항목 참고

## 판단 기준
- OpenAPI 스펙을 벗어나지 않음

## 실행 결과 (2026-04-23)

### 구현
- `src/shared/api/mocks/` 생성: `index.ts`, `browser.ts`, `constants.ts`, `auth.ts`, `db.ts`, `seeds.ts`, `handlers/{auth,user,dashboard,task,index}.ts`
- `public/mockServiceWorker.js` 생성 (`npx msw init public/ --save` 실행 → `package.json`에 `msw.workerDirectory` 추가됨)
- `src/app/main.tsx` — `env.ENABLE_MSW`가 true일 때만 `@/shared/api/mocks`를 동적 import하고 `worker.start({ onUnhandledRequest: 'bypass' })` 이후 React 마운트
- `.env.development` → `VITE_ENABLE_MSW=true` 플립 (prod는 false 유지)
- `eslint.config.js` ignores에 `public/mockServiceWorker.js` 추가 (MSW 자동생성 파일의 unused-eslint-disable 경고 차단)

### 7개 엔드포인트 목업

| 메서드 | 경로 | 200 응답 | 에러 응답 |
|---|---|---|---|
| POST | `/api/sign-in` | `AuthTokenResponse` + `Set-Cookie: token=…` | 400 (형식 위반 or 데모 계정 불일치) |
| POST | `/api/refresh` | `AuthTokenResponse` + `Set-Cookie` | 401 (token 쿠키 누락/만료) |
| GET | `/api/user` | `UserResponse` (로그인 계정별 `name`/`memo`) | 401 |
| GET | `/api/dashboard` | `DashboardResponse` (db에서 live count) | 401 |
| GET | `/api/task?page=N` | `TaskListResponse` (20건씩, `hasNext`) | 401, 400 (page 범위) |
| GET | `/api/task/{id}` | `TaskDetailResponse` (id 순번 기반 `registerDatetime`) | 401, 404 |
| DELETE | `/api/task/{id}` | `{success:true}` | 401, 404 |

### 설정 값
- 페이지 사이즈: `PAGE_SIZE = 20` (300건 시드 → 15 페이지)
- Access token TTL: 15분 / Refresh TTL: 7일
- JWT: base64url 인코딩 `{alg:'none',typ:'JWT'}.{id,exp}.sig` — 서명 검증은 없지만 payload의 `exp`를 실시간 비교해 만료 시 401
- 시드: `faker.seed(42)`로 결정적 300건 생성, id는 `task-0001`…`task-0300`

### 데모 계정 (엄격 검증)
다음 2개만 200, 나머지는 400. 둘 다 비밀번호는 영숫자 8~24자 regex 통과.
- `demo1@kbhc.com` / `password1234` → 김데모 (일반 사용자)
- `demo2@kbhc.com` / `password5678` → 박데모 (관리자)

### 검증

**정적 검증** (모두 통과):
- `pnpm typecheck` → 0 errors. `http.method<Params, Body, Response>` 제네릭과 `HttpResponse.json<T>()` 조합으로 스펙 drift가 컴파일 에러로 잡힘.
- `pnpm lint` → 0 errors, 0 warnings.
- `pnpm build` → 성공. `dist/assets/*.js` 번들에서 `grep "setupWorker\|faker"` 매치 없음 → 프로덕션 번들에서 MSW/faker가 tree-shake됨 (동적 import + env 상수 인라인의 결과).

**dev 서버 serving 확인**:
- `pnpm dev` 실행 후 `curl http://localhost:5173/mockServiceWorker.js` → HTTP 200
- `/src/shared/api/mocks/index.ts`가 정상 export됨

**런타임 엔드포인트 smoke test**:
- MSW 2.x의 `setupServer`(Node) 모드는 상대 경로 path matching이 브라우저와 다르게 동작하므로(Node에는 `document.location`이 없음), Phase 02 스코프에서 Node 단위 런타임 테스트는 수행하지 않음.
- 실제 브라우저 Service Worker 환경에서의 E2E smoke test는 Phase 03에서 UI를 통해 React Query/폼이 각 엔드포인트를 자연스럽게 호출하면서 검증됨 (계획된 Verification 커맨드 셋은 `.claude/plans/prompts-02-api-setup-md-fancy-lake.md` 참조).

### Phase 02에서 의도적으로 건드리지 않은 영역
- `entities/*/api/` fetch 함수와 `queryOptions` 팩토리 → Phase 03
- `features/*/api/` mutation 훅 → Phase 03+
- `src/shared/api/http.ts`의 401→refresh 인터셉터 → Phase 03 (session slice와 함께)
- 폼 zod 스키마, 페이지 UI, 라우트 가드 로직 → Phase 03+

### 리뷰 체크포인트
- `.claude/agents/openapi-contract-checker` — 7개 엔드포인트의 응답·에러 shape이 `docs/openapi.yaml`과 일치하는지 검증
- `.claude/agents/fsd-reviewer` — `src/shared/api/mocks/`가 shared 레이어 내부에 머무르고 외부로 handlers를 노출하지 않음을 확인 (public API는 `worker`만)