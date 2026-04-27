# KB헬스케어 프론트엔드 과제

React 19 + Vite SPA. 과제 5개 페이지(대시보드 / 로그인 / 할 일 목록 / 상세 / 회원정보) 구현.

- 과제 요건: [`docs/requirements.md`](docs/requirements.md)
- API 스펙: [`docs/openapi.yaml`](docs/openapi.yaml)
- 기술 결정 근거: [`docs/tech-stack.md`](docs/tech-stack.md)
- 구조·규약: [`CLAUDE.md`](CLAUDE.md)
- AI 활용 내역: [`AI_USAGE.md`](AI_USAGE.md)

## 요구 환경

- Node 20 LTS
- pnpm 9 (`corepack enable`)

## 설치 및 실행

```bash
pnpm install
pnpm dev        # http://localhost:5173, MSW 활성
pnpm build      # vite build && tsc --noEmit
```

| 명령 | 설명 |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit`. `routeTree.gen.ts`는 `pnpm dev`/`build`가 먼저 필요 |
| `pnpm lint` | ESLint 9 flat |
| `pnpm format` | Prettier |
| `pnpm gen:api` | `docs/openapi.yaml` → `src/shared/api/openapi.d.ts` |

## 환경 변수

`.env.development` / `.env.production`에 체크인되어 있음. 비밀 값 없음.

| 변수 | dev | prod | 용도 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `` | `/api` | HTTP 베이스 URL |
| `VITE_ENABLE_MSW` | `true` | `false` | MSW Service Worker 토글 |

## 데모 계정

MSW 활성 상태에서 로그인에 사용. 정의는 [`src/shared/api/mocks/constants.ts`](src/shared/api/mocks/constants.ts).

| email | password |
| --- | --- |
| `demo1@kbhc.com` | `password1234` |
| `demo2@kbhc.com` | `password5678` |

## 알려진 제약

- **로그아웃 후 새로고침/URL 직접 입력 시 자동 재인증됩니다.** API 스펙에 logout 엔드포인트가 없어 서버의 refresh 세션을 폐기할 수 없고, 로그아웃은 클라이언트 메모리 상태만 비우는 UX로 구현했습니다.
- **MSW로 인한 제약**: 목업 데이터는 모듈 메모리에 보관되어 새로고침 시 시드 상태로 리셋됩니다.
  - 할 일을 삭제해도 새로고침하면 다시 나타납니다.
  - 대시보드 집계(전체/완료/미완료 수)도 동일한 이유로 초기화됩니다.
  - 여러 탭 간 상태가 공유되지 않습니다(각 탭이 독립된 인메모리 DB).
  - 인증 토큰만 `localStorage`에 보관해 새로고침 시에도 세션이 유지됩니다.

