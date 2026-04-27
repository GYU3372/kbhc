# AI 사용 기록

본 과제는 **Claude Code (Anthropic 공식 CLI)** 를 주 도구로 활용하여 진행했다. 본 문서는 [`docs/requirements.md`](docs/requirements.md)의 `AI_USAGE.md` 제출 규정에 따라 **사용한 도구·운용 방식·적용 범위·사람이 최종 검증한 내용**을 기록한다.

> **요약** — Phase마다 **① 프롬프트 작성 → ② 계획 검수 → ③ 구현 → ④ 코드 검수**의 4단계 루프로 진행했다.
> 각 단계 경계에서 사람이 검수 게이트를 두었으며, 모든 diff·커밋·머지·검증 책임은 사람이 최종적으로 가졌다.

---

## 1. 사용한 도구 / 모델

| 항목 | 내용 |
| --- | --- |
| 주 도구 | Claude Code (Anthropic 공식 CLI, VSCode 확장 연동) |
| 주 모델 | `claude-opus-4-7` (1M context) — 설계·리뷰·코드 생성 전반 |
| 보조 모델 | `claude-sonnet-4-6` — 반복적 파일 수정 시 비용 최적화 |
| 서브에이전트 | `general-purpose`, `Explore`, `Plan` + 프로젝트 커스텀 3종 (§5) |
| MCP / 외부 연동 | 미사용 (로컬 파일·bash·git만) |

> 비밀정보(API 키·개인정보·회사 내부 자료)는 세션·리포에 포함하지 않았다.
> `.env`에는 `VITE_API_BASE_URL` / `VITE_ENABLE_MSW`만 담겨 있다.

---

## 2. 작업 루프 — 사람이 AI를 운용한 방식

각 Phase는 다음 4단계로 진행했다. **단계 경계마다 사람이 검수 게이트**를 가지며 다음 단계 진입을 허가/반려했다.

```
 ① 프롬프트 작성       ② 계획 수립·검수        ③ 구현            ④ 코드 검수
   (사람)        ──→     (AI → 사람 승인)  ──→   (AI)       ──→    (사람 + 리뷰 에이전트)

 prompts/NN-*.md       .claude/plans/         feature 브랜치     수동 diff + 3종 병렬 리뷰
```

| 단계 | 주체 | 산출물 | 사람의 역할 |
| --- | --- | --- | --- |
| **① 프롬프트 작성** | 사람 | [`prompts/NN-*.md`](prompts/) | Phase의 목표·산출물·참고 문서·제약·"하지 말 것"을 직접 기술 |
| **② 계획 수립·검수** | AI 초안 → 사람 승인 | [`.claude/plans/`](.claude/plans/) 스냅샷 | 범위·접근법·리스크 검토 후 합의. 범위 과대·요구사항 밖·과잉 추상화는 이 게이트에서 축소·반려 |
| **③ 구현** | AI | feature 브랜치 커밋 | 진행 중에도 diff를 따라 읽으며 계획 외 변경(불필요 export, 의도하지 않은 네이밍 변경 등)은 즉시 반려 |
| **④ 코드 검수** | 사람 + 리뷰 에이전트 | 검수 노트 → "실행 결과" | 전체 diff 수동 확인. Phase 06부터 [`.claude/agents/`](.claude/agents/) 3종 병렬 실행. 각 지적은 **수용/보류/기각** 판정 후 `prompts/NN-*.md` 하단에 기록하고 커밋 |

> 이 루프는 AI를 "한 번에 결과물을 받는 도구"가 아니라 **사람이 매 단계 게이트에서 방향을 잡는 협업자**로 운용하기 위한 장치였다.
> 게이트 통과는 단순 승인이 아니라 **거절·축소·재범위 지정**을 포함한다.

---

## 3. Phase별 적용 범위

AI는 **설계 초안 작성 / 구현 / 리뷰 / 리팩터링 / 문서화** 전 영역에 사용했다. Phase 구분은 `prompts/00-06` 파일 체계를 그대로 따랐다.

| Phase | AI 담당 | 사람 검증 핵심 |
| :---: | --- | --- |
| **00** 기술 결정 | `docs/tech-stack.md` 초안 — 스택 후보·근거 수집·요구사항 매핑 | 과제 규모 대비 과잉 항목 제거 지시, 최종 채택/탈락 결정 |
| **01** 셋업 | Vite·TS·ESLint·Prettier·Tailwind v4·Pretendard·TanStack Router 부트스트랩 | `pnpm build`·`lint`·`typecheck` 통과 확인, dev 서버 수동 기동 |
| **02** API 셋업 | MSW 2 핸들러 7종, `openapi.d.ts` 생성, `http.ts` 래퍼, `query-client` | 응답 표본 확인(브라우저 네트워크 탭), 401→refresh 재시도 시나리오 |
| **03** 공용 UI | `shared/ui`의 Button·Input·Label·Modal·Spinner·EmptyState | 디자인 토큰 매핑, Radix Dialog 포커스 트랩 수동 확인 |
| **04** 유저 플로 | GNB/LNB widget, 로그인 폼(RHF + zod), 회원정보, 세션 스토어 | 로그인 성공/실패 모달, 새로고침 후 세션 복원, 비인증 가드 동선 |
| **05** 할 일 플로 | 대시보드 집계, 목록(가상 + 무한 스크롤), 상세, 삭제 모달(id 일치) | 300건 시드 스크롤 체감, 캐시 invalidate, 404 빈 상태 |
| **06** 최종 리뷰 | 3종 커스텀 에이전트 + 수기 체크 (§5) | 각 제안을 수용/보류/기각, 최종 diff 리뷰 |

핵심 수용 항목은 [`prompts/06-review.md`](prompts/06-review.md) 하단 "실행 결과"에 기록되어 있다 — SEO/문서 제목, Webview 레이아웃, DeleteTaskModal 접근성 재구성, MSW/계약 보정, `entities/session` → `features/auth` 재배치 등.

---

## 4. 항시 로드되는 컨텍스트

세션 단위 프롬프트보다 **항시 로드되는 프로젝트 문서·룰**이 실질적 프롬프트 역할을 했다. 크게 세 층으로 나뉜다.

### 4-1. `docs/` — 단일 소스 레이어

`docs/`는 본 과제의 모든 결정·계약을 한 곳에 모은 디렉터리다. **AI 작업 사이클에서 양방향**으로 쓰였다 — Phase 00의 산출물이자, 이후 모든 Phase의 AI 입력.

| 파일 | 출처 | 역할 |
| --- | --- | --- |
| [`docs/requirements.md`](docs/requirements.md) | **KB 제공** (원본) | 과제 명세 — 요구사항 단일 소스. AI 제안의 범위 판정 기준 |
| [`docs/openapi.yaml`](docs/openapi.yaml) | **KB 제공** (원본) | API 명세 — `pnpm gen:api`로 `openapi.d.ts` 생성, MSW 핸들러·zod 스키마의 정합 기준 |
| [`docs/tech-stack.md`](docs/tech-stack.md) | **AI 초안 → 사람 합의·확정** | 기술 결정 근거 (탈락 안 포함). 대안 제안을 반려할 때의 인용 가능한 근거 문서 |
| [`docs/job-description.md`](docs/job-description.md) | KB 제공 (참고) | 채용·과제 맥락 — 어디까지가 과제 범위인지 판정에 보조 사용 |

> **왜 이 구조가 중요한가** — `docs/`는 AI에게 "이 프로젝트의 헌법"으로 기능했다.
> AI가 새로운 라이브러리·패턴을 제안할 때마다 `tech-stack.md`의 기존 결정과 대조해 **자가 반려**하거나, `openapi.yaml`과 다른 응답 모양을 만들면 `openapi-contract-checker`가 차단했다.
> 즉 docs/는 **AI 자유도의 상한선**이자, 사람이 매번 같은 지적을 반복하지 않도록 한 영구 메모리였다.

### 4-2. `prompts/` — Phase별 실행 지시서

| 위치 | 역할 |
| --- | --- |
| [`prompts/`](prompts/) | Phase별 실행 지시서 — 목표·참고·판단기준·제약·"하지 말 것". §2의 ① 게이트 산출물 |

각 파일 하단의 "실행 결과" 섹션이 해당 Phase의 정본 기록이 된다.

### 4-3. 프로젝트 룰 / 자동화 스킬

| 위치 | 역할 |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | 프로젝트 헌장 — 스택, FSD 규약(계층 단방향·public API·queries/mutations 분리), Git Flow, 에이전트 목록 |
| [`.claude/skills/github-flow/SKILL.md`](.claude/skills/github-flow/SKILL.md) | Git 자동화 스킬 — Phase 시작/커밋/종료별 브랜치·커밋·`--no-ff` 머지 절차 |

### 4-4. 세션 중 사용된 전형적 인스트럭션 패턴

- *"`prompts/04-user.md`를 지시서로, 현재 파일 트리와 `docs/openapi.yaml`·`docs/tech-stack.md`의 FSD 규약을 지켜 Phase 04를 구현하라. 요구사항 밖 기능은 추가하지 마라."*
- *"이 diff를 `fsd-reviewer` · `openapi-contract-checker` · `a11y-reviewer`에 병렬로 돌려 Critical만 추려라. 수용/보류 판단은 내가 한다."*
- *"리뷰에서 지적된 N개 중 A·B·C만 반영한다. 나머지는 근거와 함께 보류 기록에 남겨라."*

---

## 5. 커스텀 리뷰 에이전트

[`.claude/agents/`](.claude/agents/)에 3종의 리뷰 전용 서브에이전트를 정의해, 구현 컨텍스트가 길어진 세션의 편향을 교차 검증했다. 각 에이전트는 **읽기 전용**(`Read`·`Grep`·`Bash`)만 갖는다.

| 에이전트 | 트리거 | 관점 |
| --- | --- | --- |
| `a11y-reviewer` | 폼/모달/레이아웃/애니메이션 변경, 신규 페이지·폼 추가 | WCAG · 포커스 트랩 · `100dvh` · safe-area · `transform` · Webview |
| `fsd-reviewer` | `entities/features/pages/widgets/shared`에 파일 추가/이동 | 계층 단방향, public API, queries/mutations 배치 |
| `openapi-contract-checker` | `entities/*/api`, `features/*/api`, `shared/api`, MSW handlers, zod 스키마 변경 | OpenAPI 대비 타입·zod·MSW 응답 정합성 |

Phase 06에서는 3종을 **병렬 실행**해 리뷰 결과를 단일 세션에 합류시켰다.

---

## 6. 계획 문서 보존

Claude Code의 Plan 단계에서 생성된 Phase별 계획서가 [`.claude/plans/`](.claude/plans/)에 보존되어 있다 (Phase 01~06). §2의 ② 게이트에서 사람이 검수했던 시점의 구현 전략 스냅샷이며, 실제 반영된 결과와는 차이가 있을 수 있다. **최종 구현과의 차이·수용 여부는 각 `prompts/NN-*.md`의 "실행 결과" 섹션을 정본**으로 본다.

---

## 7. 사람이 최종 검증한 내용

### 자동 검증

- 모든 Phase 종료 시 `pnpm lint` · `pnpm typecheck` · `pnpm build` 통과 확인
- `openapi-contract-checker`로 MSW · zod · TypeScript 3자 정합성 재검사

### 수동 검증 (브라우저)

| 영역 | 확인 내용 |
| --- | --- |
| **로그인 플로** | 빈 값·형식 위반 시 제출 비활성·에러 메시지, 400/500 시 모달 `errorMessage` 노출, 성공 시 대시보드 리다이렉트 |
| **세션 복원** | 새로고침 시 `POST /api/refresh`로 세션 복원, `_authed` 가드가 race 없이 판단 |
| **401 재시도** | accessToken 만료를 MSW로 모사 → 단일 in-flight refresh 후 원 요청 성공 |
| **할 일 목록** | 300건 시드에서 가상화 동작, 하단 도달 시 다음 페이지 호출, `hasNext: false`에서 추가 호출 없음 |
| **할 일 상세 / 삭제** | id 입력 전 제출 비활성, 일치 시 활성. 삭제 성공 후 목록 리다이렉트 + `taskQueries.lists()` invalidate. 없는 id 직접 방문 시 404 + 복귀 버튼 |
| **접근성** | 키보드만으로 GNB → 로그인 → 로그아웃 → 목록 → 삭제 완주. Dialog 포커스 트랩 및 트리거 복귀. VoiceOver / NVDA 단순 낭독 확인 |
| **Webview** | iOS Safari 15+ 디바이스 모드에서 `100dvh`·safe-area padding 동작, 홈 인디케이터와 GNB 미겹침 |

### 코드 리뷰 / 커밋 규율

- 모든 커밋은 diff를 수동 확인 후 `git commit` — 의도하지 않은 파일 변경·네이밍 변경·불필요 export 추가는 커밋 전에 반려
- 머지는 항상 `git merge --no-ff`로 Phase 이력 보존. `main` 직접 커밋은 Phase 01 initial commit 외에는 없음

---

## 8. 주의 및 한계

- **채택하지 않은 AI 제안**은 [`prompts/06-review.md`](prompts/06-review.md) 및 각 Phase "실행 결과"에 명시 (예: `entities/dashboard` 중간층 생략을 의도적으로 유지, Vite 500kB 경고 대응 유보 등)
- **테스트 프레임워크(Vitest/Testing Library 등) 미도입** — 과제 규모 판단. 근거는 [`docs/tech-stack.md`](docs/tech-stack.md) §16
- 본 저장소의 모든 코드·문서는 사람이 최종 검수·승인한 결과물이며, AI 출력은 **초안·참고·교차검증 수단**으로 사용되었다
