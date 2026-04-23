# 03 공통 컴포넌트 정의

## 목표
- 이후 Phase에서 페이지·위젯이 재사용할 공통 UI 컴포넌트 목록과 책임 범위를 결정하고 파일에 기록
- 접근성과 FSD 계층 규약을 따를 것

## 참고 문서
- `docs/requirements.md` — 과제 요구사항
- `docs/tech-stack.md` — Tailwind v4 + Radix Primitives 전제

## 실행 결과 (2026-04-23)

### 토큰 변경
- `src/app/styles/app.css`의 `--color-primary`를 `#ffbc00` → `#ffd700`(KB 골드)로 교체. 나머지 토큰은 유지. `#root`에 `min-height: 100dvh` 보강(iOS Safari 주소창 동기 대응)
- `#FFD700` 배경의 WCAG 대비 한계 때문에 `Button` primary variant는 흰 글씨가 아닌 `text-text-primary`(어두운 회색, 약 12:1)로 확정

### 7종 공통 컴포넌트 구현 (`src/shared/ui/`)

| 컴포넌트 | 파일 | 책임 |
| --- | --- | --- |
| `Button` | `button.tsx` | `primary`/`danger`/`ghost` × `md`/`sm`. `disabled` 시맨틱 유지, variant별 focus-visible 링 색 분리(primary=text-primary, danger=danger, ghost=primary) |
| `Input` | `input.tsx` | `label`/`error`/`hint` props. 내부에서 `<Label htmlFor>` + `aria-invalid`/`aria-describedby` 자동 연결. forwardRef로 RHF `register` 투명 전달 |
| `Label` | `label.tsx` | Radix `@radix-ui/react-label` Root 래퍼 |
| `Modal` | `modal.tsx` | Radix Dialog 분해 export(`Root/Trigger/Close/Content/Title/Description/Footer`). `Content`에 Portal + Overlay + 센터 포지셔닝 + `max-h-[calc(100dvh-2rem)] overflow-auto`. 애니메이션은 `opacity` + `scale`(transform) 한정. react-refresh 규칙과 구조적 상충으로 파일 상단에 사유 주석 + `eslint-disable` |
| `Card` | `card.tsx` | `interactive?` prop. JSDoc으로 "호출측이 role/tabIndex/onKeyDown 책임" 계약 명시 |
| `Spinner` | `spinner.tsx` | `role="status"` + `aria-live="polite"` + `sr-only` 라벨 |
| `EmptyState` | `empty-state.tsx` | `title`/`description?`/`action?` 슬롯. 404 상세·빈 목록 재사용 |

`src/shared/ui/index.ts`는 7종 컴포넌트와 외부 확장에 필요한 타입만 named export. 내부 보조 타입(`ButtonVariant`, `SpinnerSize` 등)은 비노출.

### a11y 요점
- Input label↔id 연결, `aria-invalid`/`aria-describedby` 분기 — `Input` 책임
- Button `disabled` 시맨틱 유지 + `:focus-visible` ring variant별 분리
- Modal focus trap·ESC·aria-modal·포커스 복귀 — Radix Dialog 기본 동작 활용
- 애니메이션은 `transform`/`opacity`만 사용(Reflow 트리거 회피)
- `#root`에 `min-height: 100dvh` — iOS Webview viewport 튐 완화

### FSD 경계
- `src/shared/ui/*`는 `@/shared/lib/cn`, Radix, React 외에 다른 레이어 import 없음 — 단방향 규약 준수
- 외부는 `@/shared/ui` public API로만 접근. 내부 컴포넌트 간은 상대 경로 허용(`input.tsx` → `./label`)

### 검증
- `pnpm lint` → 0 errors, 0 warnings
- `pnpm typecheck` → 0 errors
- `pnpm build` → 성공
- `.claude/agents/a11y-reviewer`·`fsd-reviewer` 수동 실행 — 각각 major/minor 지적 반영(Modal viewport 가드, Card JSDoc 계약, Button focus ring variant 분리, Spinner aria-live, root min-height). 블로커·역방향 의존 없음
- 구현 계획·실행 컨텍스트: `.claude/plans/prompts-03-common-components-md-squishy-sun.md`

### Phase 03에서 의도적으로 건드리지 않은 영역
- 엔티티 `queryOptions` 팩토리, 401→refresh 인터셉터, 세션 스토어 — Phase 04+
- `widgets/gnb`, `widgets/task-list`, `features/task-delete`, 페이지·라우트 가드 — Phase 04+
- 폼 zod 스키마 — 각 페이지 소유
- spacing/radius/shadow 커스텀 토큰, `primary` 외 색상 팔레트 확장 — 기존 Tailwind 기본값 및 단일 토큰으로 충분
