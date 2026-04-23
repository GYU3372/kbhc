---
name: github-flow
description: 새 Phase/feature 작업 시작·진행·종료 시 GitHub Flow + Conventional Commits 규약대로 브랜치 분기, 커밋, `--no-ff` 머지를 수행한다. "새 Phase 시작", "feature 브랜치 생성", "Phase 종료", "PR/머지 준비", "이 변경 커밋해줘" 등의 요청에서 트리거.
---

# GitHub Flow 스킬

이 프로젝트는 **GitHub Flow + Conventional Commits**를 따른다. 새 작업을 시작·진행·종료할 때 이 스킬이 가진 절차를 엄격히 따른다.

## 원칙

1. **`main`은 항상 빌드 가능 상태**. 직접 커밋 금지 (단, Phase 01 initial commit은 예외)
2. 모든 작업은 `<type>/<NN>-<slug>` 브랜치에서. 예: `feat/02-auth`, `feat/03-task-list`, `chore/99-cleanup`
3. 커밋 메시지: [Conventional Commits](https://www.conventionalcommits.org/) — `feat / fix / chore / docs / refactor / style / build / ci / test`
4. 머지는 `git merge --no-ff`로 Phase 단위 이력 보존
5. `--no-verify`로 hook 우회 금지, `main`에 force push 금지
6. **`main` 머지는 사용자의 명시적 승인 이후에만 실행**. 타입체크·린트·빌드 통과만으로 머지하지 않는다. 사용자가 직접 `pnpm dev`로 UI/기능을 확인한 뒤 "머지해" 같은 명시적 승인이 있을 때만 `git checkout main` → `merge --no-ff`를 실행한다.

## 1. 새 Phase/feature 시작

```bash
git checkout main
git status                       # clean 확인. dirty면 커밋/stash 먼저
git pull --ff-only origin main   # remote가 있는 경우에만
git checkout -b <type>/<NN>-<slug>
```

브랜치 네이밍 예시:
- Phase별 작업: `feat/02-auth`, `feat/03-task-list`, `feat/04-task-detail`
- 리팩터링: `refactor/05-http-wrapper`
- 잡무: `chore/99-deps-bump`

## 2. 작업 중 커밋

- 포맷: `<type>(<scope>)?: <summary>` (scope는 선택)
  - 예: `feat(auth): add sign-in form with zod validation`
  - 예: `fix: handle 401 retry race condition`
- 하나의 논리 단위 = 하나의 커밋. 기능·문서·설정 혼재 금지
- 커밋 전 필수: `pnpm typecheck && pnpm lint`
- 파일 스테이징은 `git add <specific-files>` 선호. `git add -A`/`git add .`는 의도치 않은 파일 포함 위험

## 3. Phase 종료 및 `main` 머지

> ⚠️ **머지 전 사용자 승인 필수.** 자동 검증(typecheck/lint/build)·리뷰 에이전트 통과는 충분 조건이 아니다. 브라우저 수동 검증은 사용자가 수행하며, "머지해" 같은 명시적 승인이 있을 때만 4단계 이후를 실행한다. 자동화 환경이라 브라우저 확인이 불가하면 그 사실을 먼저 보고하고 대기한다.

```bash
# 1) 작업 브랜치에서 자동 검증
pnpm typecheck
pnpm lint
pnpm build

# 2) prompts/NN-*.md 하단에 "## 실행 결과 (YYYY-MM-DD)" 섹션 추가하고 커밋

# 3) 사용자에게 브랜치 상태·검증 결과를 보고하고 머지 승인을 요청. 승인 대기.

# 4) 승인 후에만 main으로 머지
git checkout main
git merge --no-ff <branch> -m "<type>: phase <NN> <summary>"
#   예: git merge --no-ff feat/02-auth -m "feat: phase 02 auth flow"

# 5) 로컬 브랜치 정리 (선택 — 사용자 확인 후)
git branch -d <branch>
```

## 4. Remote 푸시 (선택)

- GitHub 리포가 연결되어 있으면:
  ```bash
  git push origin main
  ```
- `main`에 force push 금지
- `gh pr create`는 협업(리뷰어 존재) 맥락에서만. 1인 과제에서는 로컬 `--no-ff` 머지로 충분

## 5. 예외: Phase 01 initial commit

- `git init -b main` 직후 저장소에는 커밋이 없다
- Phase 01 셋업 산출물(설정·FSD 뼈대·에이전트·스킬·CLAUDE.md) **전체를 단일 커밋**으로 `main`에 기록:
  ```bash
  git add .
  git commit -m "chore: initial project setup"
  ```
- Phase 02부터는 1~3번 절차를 엄격히 따른다

## 금지 목록

- `git commit --no-verify` (pre-commit hook 우회)
- `git push --force` / `git push -f` (특히 `main`)
- `git rebase -i`로 이미 머지된 커밋 재작성
- `.env.local`, 크리덴셜 파일 커밋
- `git add -A`로 의도치 않은 파일 추가 (스테이징 전 `git status`로 확인)
