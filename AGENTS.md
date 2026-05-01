# OpenLog Agent Instructions
작업에 필요한 지침 파일만 읽는다. 

## 공통 규칙
- 문서화 요청은 반드시 `_docs/` 하위 표준 경로에만 작성한다.
- 기능 코드 디렉토리(`backend/`, `frontend/`, `src/`)에 문서를 신규 생성하지 않는다.
- 사용자가 예외 경로를 명시한 경우에만 해당 경로를 사용하되, 해당 문서 유형의 템플릿 구조는 유지한다.

## 요청별 지침 라우팅
- PR 문서 작성/자동 생성/PR 템플릿 작성: `_docs/PR/INSTRUCTIONS.md`만 읽는다.
- 기능 설계/순서/아키텍처 계획/Plan 문서화: `_docs/plan/INSTRUCTIONS.md`만 읽는다.
- Task 문서화/체크리스트/조사 정리/개선 계획: `_docs/tasks/INSTRUCTIONS.md`만 읽는다.
- Worklog 업데이트/진행상황/의사결정 로그: `_docs/worklog/INSTRUCTIONS.md`만 읽는다.
- Task 완료 정리/DoD 체크/후속 과제 정리: `_docs/tasks/INSTRUCTIONS.md`와 `_docs/worklog/INSTRUCTIONS.md`만 읽는다.

## 기본 경로
- Plan: `_docs/plan/`
- Task: `_docs/tasks/`
- Worklog: `_docs/worklog/`
- PR: `_docs/PR/`
