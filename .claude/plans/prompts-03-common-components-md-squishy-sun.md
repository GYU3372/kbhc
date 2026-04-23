# Phase 03 — 공통 컴포넌트 정의

## Context

Phase 01에서 FSD 뼈대와 토큰, Phase 02에서 MSW 7개 엔드포인트가 준비되어 있으며, `src/shared/ui/`는 현재 `index.ts` 빈 배럴만 있는 상태. 다음 Phase(페이지·위젯 구현)가 재사용할 UI 토대를 먼저 결정·구현해두지 않으면 페이지별로 인라인 스타일이 산재해 토큰 관리 원칙·a11y(라벨, 포커스)·FSD 단방향 의존성 규약이 동시에 흔들릴 위험이 있음. 본 Phase는 요구사항(`docs/requirements.md`)에서 실제로 등장하는 UI 상호작용만 범위로 잡아 7종 공통 컴포넌트를 명세·구현하고, 프롬프트 파일에 결정 내용을 기록한다.

## Scope

포함:
- `src/app/styles/app.css`의 `--color-primary` 값을 `#FFD700`으로 변경(나머지 토큰은 그대로 유지)
- `src/shared/ui/`에 7종 컴포넌트 구현 + `index.ts` public API
- `prompts/03-common-components.md`에 컴포넌트 목록·책임·props·a11y 규약 기록
- `prompts/03-common-components.md` 하단에 `## 실행 결과 (YYYY-MM-DD)` 섹션 기록
- 브랜치 `feat/03-common-components`에서 작업 → `main`에 `--no-ff` 머지

제외(후속 Phase):
- 엔티티 `queryOptions` 팩토리 구현 (Phase 04+)
- 401→refresh 인터셉터, 세션 스토어 (Phase 04+)
- 페이지·위젯 조립, 라우트 가드
- zod 스키마 (폼은 해당 페이지에서 소유)
- `shared/lib/date.ts` 등 포맷 유틸 (필요해지는 Phase에서 추가)
- 색상 외 토큰(spacing/radius/shadow) 커스텀 — Tailwind 기본값 사용
- `primary` 외 색상 팔레트 확장(hover/on-primary/border 등 별도 토큰 추가) — 기존 토큰으로 충분

## 색상 토큰 변경

`src/app/styles/app.css` 수정 한 줄:

```css
--color-primary: #FFD700;   /* 기존 #ffbc00 → KB 골드 */
```

나머지 토큰(`--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`, `--color-disabled`, `--color-danger`)은 그대로 유지.

**a11y 주의**: `#FFD700` 배경에 흰 텍스트는 대비비가 낮아 WCAG AA 미달. `Button` primary variant는 `text-white`가 아니라 `text-text-primary`(어두운 회색)로 둬서 대비비를 확보한다.

## 컴포넌트 명세 (7종)

각 컴포넌트는 `forwardRef` + `React.ComponentPropsWithoutRef<'…'>` 확장으로 네이티브 props를 통과시키고, `cn()`으로 `className` 병합을 허용한다. 모두 `shared/ui/index.ts`에서 re-export.

### 1. `Button` — `shared/ui/button.tsx`
- props: `variant?: 'primary' | 'danger' | 'ghost'`, `size?: 'md' | 'sm'`, 나머지는 `<button>` props 통과
- 기본 `type="button"` (submit은 호출측이 명시)
- `disabled`일 때 `disabled:opacity-50 disabled:pointer-events-none`, 시맨틱 `disabled` 속성 유지
- 토큰: primary=`bg-primary text-text-primary hover:brightness-95`, danger=`bg-danger text-white`, ghost=`bg-transparent text-text-primary hover:bg-disabled`
- a11y: `focus-visible:ring-2 ring-primary ring-offset-2`, `disabled` 시각 피드백. primary는 `#FFD700` 위 흰 글씨 대비 부족 때문에 어두운 텍스트 사용

### 2. `Input` — `shared/ui/input.tsx`
- props: `label: string`, `error?: string`, `hint?: string`, `id?`(미지정 시 `useId`), 나머지는 `<input>` props 통과
- 내부에서 `<Label htmlFor={id}>` + `<input id={id} aria-invalid={!!error} aria-describedby={error ? errorId : hintId} />` + error/hint 메시지 렌더
- forwardRef로 RHF `register`의 ref·name·onChange·onBlur를 직접 전달받음
- 기본 스타일: `border border-disabled`, focus 시 `focus-visible:border-primary focus-visible:ring-2 ring-primary/40`
- 에러 스타일: `border-danger`, 메시지는 `text-danger text-sm`
- a11y: 라벨 연결 필수(요구사항 42행), 에러 메시지와 `aria-describedby` 연결

### 3. `Label` — `shared/ui/label.tsx`
- Radix `@radix-ui/react-label` Root 래퍼. forwardRef로 props 통과
- `text-sm font-medium text-text-primary` 기본 스타일
- Input 내부에서 사용 + 필요 시 독립 사용 가능

### 4. `Modal` — `shared/ui/modal.tsx`
- Radix Dialog 래퍼. 분해 export: `Modal.Root`(= Dialog.Root), `Modal.Trigger`, `Modal.Content`, `Modal.Title`, `Modal.Description`, `Modal.Footer`, `Modal.Close`
- `Modal.Content`가 `Dialog.Portal` + `Dialog.Overlay` + 포지셔닝/애니메이션을 한 번에 처리
- 오버레이 `bg-black/40`, 컨텐츠 카드는 `Card`와 동일 스타일 토큰
- 애니메이션은 `transform/opacity`만 사용(Tailwind `data-[state=open]:animate-in` 유틸)
- `Modal.Title` 누락 시 `VisuallyHidden`으로 감싸는 주석 규약만 문서화(기본 요구는 항상 title 제공)
- 요구사항의 "에러 모달(로그인 실패)"과 "삭제 확인 모달"은 **동일 컴포넌트의 서로 다른 children 구성**으로 해결 — destructive variant 별도 두지 않음(복잡도 최소화)
- a11y: Radix가 focus trap·ESC 닫기·`aria-modal`·초기 포커스·복귀 포커스를 모두 처리

### 5. `Card` — `shared/ui/card.tsx`
- props: `interactive?: boolean`, 나머지는 `<div>` props 통과
- 기본 스타일: `rounded-lg bg-surface border border-disabled p-4`
- `interactive`이면 `hover:bg-disabled/40 focus-visible:ring-2 ring-primary cursor-pointer` 추가
- interactive일 때 호출측이 `role="button"` + `tabIndex={0}` + 키보드 핸들러를 넘기도록 README 주석으로 안내(link로 쓸 경우는 `<a>`/Router `<Link>`로 감싸기)
- 용도: 대시보드 3개 메트릭 카드, task-list 각 항목, 프로필 블록

### 6. `Spinner` — `shared/ui/spinner.tsx`
- props: `size?: 'sm' | 'md' | 'lg'`, `label?: string`(기본 `"로딩 중"`)
- SVG `<circle>` 2개(트랙+arc) + `animate-spin`
- a11y: 컨테이너에 `role="status"` + `<span className="sr-only">{label}</span>`

### 7. `EmptyState` — `shared/ui/empty-state.tsx`
- props: `title: string`, `description?: string`, `action?: ReactNode`(보통 `<Button>`)
- 수직 중앙 정렬, `py-12` 이상 공간. 404 상세 페이지·빈 목록 양쪽에서 재사용
- 내부적으로 `shared/ui/button`에 의존 가능(동일 레이어 내부 허용)

## 파일 구조

```
src/shared/ui/
  button.tsx
  card.tsx
  empty-state.tsx
  input.tsx
  label.tsx
  modal.tsx
  spinner.tsx
  index.ts      ← Button, Input, Label, Modal, Card, Spinner, EmptyState만 named export
```

`src/shared/lib/cn.ts`(기존)는 모든 컴포넌트가 사용. Radix 의존성은 이미 Phase 01에서 설치됨(`@radix-ui/react-dialog`, `@radix-ui/react-label`).

## 프롬프트 파일 업데이트 계획 (`prompts/03-common-components.md`)

원본 10줄 스캐폴드(목표·참고 문서)는 **그대로 유지**. Phase 01/02 패턴과 동일하게 파일 하단에 `## 실행 결과 (YYYY-MM-DD)` 섹션 하나만 추가해 구현·검증 결과를 기록한다(컴포넌트 목록·책임·a11y·FSD 경계 등은 실행 결과 본문에서 요약).

## 검증

- `pnpm lint` → 0 errors/warnings
- `pnpm typecheck` → 0 errors (forwardRef + `ComponentPropsWithoutRef` 제네릭 정합)
- `pnpm build` → 성공
- `.claude/agents/a11y-reviewer` 수동 실행 → 라벨·포커스·transform-only 애니메이션 통과 확인
- `.claude/agents/fsd-reviewer` 수동 실행 → `shared/ui` 단방향 경계, `index.ts` public API 준수 확인
- `pnpm dev` 기동 후 임시 라우트나 기존 `pages/*/ui` 스텁 한 곳에 7개 컴포넌트를 일회성 렌더해 육안 확인 — 완료 후 해당 임시 렌더는 제거

## 주요 파일 참조

- `docs/requirements.md:38-69` — 폼·모달·목록·상세 빈 상태 요구
- `docs/tech-stack.md:46` — Radix Dialog/Label/VisuallyHidden 범위
- `docs/tech-stack.md:125-134` — a11y·Webview·애니메이션 원칙
- `src/app/styles/app.css:4-15` — 사용할 색상 토큰
- `src/shared/lib/cn.ts` — 클래스 병합 유틸(기존)
- `prompts/01-setup.md:22-35`, `prompts/02-api-setup.md:14-69` — 이전 Phase의 "실행 결과" 섹션 포맷 참고
