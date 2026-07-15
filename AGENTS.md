# OpenLog Agent Instructions
작업에 필요한 지침 파일만 읽는다. 

## 공통 규칙
- 리팩터·import 정리·파일 rewrite 시 기존 `//`, KDoc, `//todo` 주석을 삭제하지 않는다. diff에 `-` 주석이 있으면 복구하거나 사용자에게 확인한다.
- 문서화 요청은 반드시 `_docs/` 하위 표준 경로에만 **로컬 작성**한다.
- `_docs/`는 `.gitignore` 대상이다. **커밋·푸시하지 않는다.** `git add -f`로 올리지 않는다. GitHub PR 본문은 `gh pr create` 등으로 넣고, `_docs/PR/` 파일은 로컬 초안용이다.
- 기능 코드 디렉토리(`backend/`, `frontend/`, `src/`)에 문서를 신규 생성하지 않는다.
- 사용자가 예외 경로를 명시한 경우에만 해당 경로를 사용하되, 해당 문서 유형의 템플릿 구조는 유지한다.
- 커밋·PR·문서에 Cursor 작성자/서명을 넣지 않는다 (`Co-authored-by: Cursor`, `Made with Cursor` 등). 상세: `.cursor/rules/no-cursor-attribution.mdc`
- `gh auth status`, `gh pr` 등 GitHub API 명령이 샌드박스에서 인증 실패를 반환해도 토큰 만료로 단정하지 않는다. 동일 명령을 `sandbox_permissions: "require_escalated"`로 재실행하고, 외부 실행에서도 인증이 실패할 때만 `gh auth login`을 요청한다.

## 요청별 지침 라우팅
- PR 문서 작성/자동 생성/PR 템플릿 작성: `_docs/PR/INSTRUCTIONS.md`만 읽는다.
- Issue 문서화/버그 리포트/장애 기록: `_docs/issues/INSTRUCTIONS.md`만 읽는다.
- 기능 설계/순서/아키텍처 계획/Plan 문서화: `_docs/plan/INSTRUCTIONS.md`만 읽는다.
- Task 문서화/체크리스트/조사 정리/개선 계획: `_docs/tasks/INSTRUCTIONS.md`만 읽는다.
- Worklog 업데이트/진행상황/의사결정 로그: `_docs/worklog/INSTRUCTIONS.md`만 읽는다.
- Task 완료 정리/DoD 체크/후속 과제 정리: `_docs/tasks/INSTRUCTIONS.md`와 `_docs/worklog/INSTRUCTIONS.md`만 읽는다.

## 기본 경로
- Plan: `_docs/plan/`
- Issue: `_docs/issues/`
- Task: `_docs/tasks/`
- Worklog: `_docs/worklog/`
- PR: `_docs/PR/`

## TDD Harness Mode

Do not apply TDD Harness Mode by default.

When the developer explicitly asks for TDD, TDD Harness Mode, or
red/green/check/review, read `TDD_HARNESS.md` and follow it.

For ordinary coding requests, follow the normal repository instructions.
