# 04 사용자 플로우 (GNB · 로그인 · 회원정보)

## 목표
- 인증 상태에 따라 분기하는 GNB, 로그인 폼·세션 수립, 회원정보 조회를 한 Phase에서 묶어 구현
- 이후 Phase(목록/상세)가 의존할 세션 스토어, 401→refresh 인터셉터, `_authed` 가드 기반을 같이 정돈

## 참고 문서
- `docs/requirements.md` — GNB 라우트 맵, 로그인 폼 규칙, 회원정보 스펙
- `docs/openapi.yaml` — `/api/sign-in`, `/api/refresh`, `/api/user`
- `docs/tech-stack.md` — Zustand 세션, RHF + zod, React Query 팩토리 규약

## 제약
- 아이콘은 `@radix-ui/react-icons`만 사용 (기존 Radix Primitives 스택과 일관)
- UI는 Phase 03의 `shared/ui` 재사용을 우선

## 하지 말 것
- 요구사항 밖의 과한 구현

## 실행 결과 (2026-04-23)

### 구현 범위
- **GNB/LNB 분리** (요구사항 헤더 "GNB/LNB" 준수)
  - GNB(`__root`): 로고("KBHC Tasks" → `/`) + 인증 상태 분기 아이콘(PersonIcon/EnterIcon)
  - LNB(`_authed` 한정): 대시보드(DashboardIcon) · 할 일(ListBulletIcon). md 이상 해상도에서 라벨 함께 노출
- **로그인 페이지**: RHF + zod(`email` + `^[A-Za-z0-9]{8,24}$`), 유효 시만 submit 활성화, 400 응답 → `errorMessage` Radix Dialog
- **회원정보 페이지**: `useQuery(userQueries.me())` + Card 렌더 + 로그아웃 버튼(ExitIcon)
- **세션 아키텍처**
  - `entities/session`: Zustand store에 `status: 'idle' | 'bootstrapping' | 'ready'` 플래그 추가
  - `app/providers/SessionProvider`: 마운트 직후 `/api/refresh` 1회 호출로 세션 복원
  - `_authed` 라우트 가드: `beforeLoad` + component-level useEffect로 `ready && !isAuthenticated` 시 redirect
  - `sign-in` 라우트: 이미 인증 시 `/`로 튕김, `redirect` search param 지원
- **HTTP 401 refresh 리트라이**
  - `shared/api/http`는 `AuthBridge` 주입 패턴으로 entities 의존 없이 Bearer 주입 / single in-flight refresh / 실패 시 `onUnauthorized` 콜백 호출
  - `app/providers/SessionProvider`가 브리지 등록
- **세션 전환 시 캐시 일원화**: `entities/session/model/reset-session.ts` + `useSignOut` 훅 → 로그아웃 / `onUnauthorized` 한 곳에서만 호출

### 환경 보정
- `.env.development`의 `VITE_API_BASE_URL`을 `/api` → 빈 값으로 수정 (OpenAPI 경로가 이미 `/api/...`라 중복 프리픽스로 MSW 핸들러 미매칭)
- `@radix-ui/react-icons` 신규 의존성 추가

### 목업 보강
- MSW Service Worker 응답의 Set-Cookie가 브라우저 쿠키 저장소에 반영되지 않는 이슈(HttpOnly SW 제약) 해결
  - `shared/api/mocks/cookie-jar.ts`: `localStorage` 기반 refresh 토큰 저장소 (7일 TTL은 JWT exp가 담당)
  - `verifyRefresh`가 Cookie 헤더 누락 시 jar fallback → 브라우저 재시작 후에도 세션 유지

### 리뷰 에이전트 결과
- `fsd-reviewer`: 문제 없음 (계층 방향 유지, AuthBridge로 shared→entities 직접 의존 회피)
- `openapi-contract-checker`: 문제 없음 (타입 전부 `components['schemas']` 파생, zod 규약 OpenAPI와 일치)
- `a11y-reviewer`: 1건 지적 → `Modal.Content aria-describedby={undefined}` 제거로 Radix 자동 연결 복구

### 사용자 결정 사항
- GNB는 `__root`에 고정, LNB는 `_authed`에만 노출 (둘 다 AskUserQuestion으로 확정)
- 회원정보 페이지에 로그아웃 버튼 포함
- 앱 부트 시 `/api/refresh` 자동 복원 포함
- MSW 쿠키 영속 저장소는 `localStorage` (tab 종료 후에도 7일까지 로그인 유지)

### 검증
- `pnpm typecheck / lint / build` 모두 통과
- 수동 E2E: demo1/demo2 로그인, 잘못된 자격 400 모달, 새로고침 세션 유지, 브라우저 재시작 유지, 로그아웃 후 다른 계정 로그인(캐시 교차 오염 없음) 모두 정상
