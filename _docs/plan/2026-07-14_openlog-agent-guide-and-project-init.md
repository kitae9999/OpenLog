# [PLAN] OpenLog Agent Guide와 프로젝트 Init

## 0. 메타
- ID: PLAN-2026-07-14-AGENT-GUIDE-INIT
- 작성일: 2026-07-14
- 작성자: OpenLog
- 상태: Ready
- 관련 링크: 없음
- 영향 범위: Backend API/DB, OpenLog CLI/MCP, Frontend Settings/Dashboard, README/MCP Guide

## 1. 배경/문제 (Background / Problem)
- 현재 상태: CLI `setup`은 로그인, MCP client 등록, 로컬 권한 설정을 제공하지만 실제 프로젝트와 OpenLog workspace를 연결하거나 에이전트 행동 기준을 제공하지 않는다.
- 문제점: MCP tool을 연결해도 에이전트가 언제 OpenLog를 사용하고 Task, Log, Output 중 무엇을 작성해야 하는지 일관되게 판단할 컨텍스트가 없다. workspace도 Git 저장소 하나만 표현할 수 있어 MSA를 지원하지 못한다.
- 해결 필요성: 설치와 프로젝트 초기화를 분리하고, workspace가 관리하는 Agent Guide와 프로젝트별 Capture Mode를 MCP 세션에 전달해야 한다.

## 2. 목표/비목표 (Goals / Non-goals)
### Goals
- `openlog setup`은 사용자 환경 설정만, `openlog init`은 Git 프로젝트 연결만 담당한다.
- workspace별 영어 Markdown Agent Guide를 제공하고 웹에서 수정할 수 있게 한다.
- workspace 하나에 여러 프로젝트를 연결하고 프로젝트별 Capture Mode를 저장한다.
- MCP server instructions와 `start_openlog_session`으로 최신 Guide와 Capture Mode를 에이전트에 제공한다.
- Capture Mode에 따라 Task, Log, Output 생성·수정 행동을 `AUTO`, `ASK`, `EXPLICIT`로 안내한다.

### Non-goals
- `AGENTS.md`, `CLAUDE.md`, Cursor rule을 수정하지 않는다.
- Git 이외 문서·채널 컨텍스트를 연결하지 않는다.
- Capture Mode를 보안 경계로 강제하지 않는다.
- 자동 발행, 자동 삭제, Guide 변경 이력·롤백 UI를 추가하지 않는다.

## 3. 사용자 흐름 (User Flow)
- 진입점: 사용자는 어느 경로에서든 `openlog setup`을 완료한 뒤 Git 프로젝트 루트에서 `openlog init`을 실행한다.
- 주요 단계:
  1. CLI가 Git root, local `openlog.projectId`, optional GitHub remote를 탐색한다.
  2. 기존 연결을 재사용하거나 workspace 목록에서 하나를 선택한다.
  3. 프로젝트별 Capture Mode를 선택한다. 기본값은 `ASK`다.
  4. 서버 연결을 저장하고 `.git/config`에 project ID를 기록한다.
  5. Agent Guide를 로드하고 웹 Agent Settings URL을 출력한다.
  6. 에이전트는 프로젝트 작업 전에 `start_openlog_session`을 호출해 최신 Guide와 Capture Mode를 받는다.
- 완료 상태: CLI와 웹에서 동일한 프로젝트 연결·Capture Mode가 보이고, MCP 세션에서 최신 Guide를 읽을 수 있다.

## 4. 아키텍처 방향 (Architecture)
- 선택한 방향:
  - `workspace_agent_guides`: workspace와 1:1인 Markdown SSOT다.
  - `workspace_projects`: owner, workspace, 표시 이름, optional GitHub repository, Capture Mode를 보관한다.
  - `.git/config`의 `openlog.projectId`는 현재 clone과 서버 project 연결을 묶는 로컬 식별자다.
  - MCP initialize instructions는 공통 bootstrap만 제공하고 실제 workspace 컨텍스트는 `start_openlog_session` 결과로 전달한다.
- 주요 컴포넌트:
  - Backend Guide/Project entity, service, controller, migration
  - CLI Git resolver와 interactive init
  - MCP session bootstrap tool과 강화된 tool description
  - Frontend Agent Settings Markdown editor와 project settings
- 데이터 흐름:
  - `init` → Git context → backend project resolve/create/update → local git config → guide fetch
  - `start_openlog_session(projectPath)` → local project ID → backend agent context → model context
- 대안과 트레이드오프:
  - repository remote만 식별자로 쓰지 않아 remote 없는 Git 프로젝트도 지원한다.
  - Capture Mode는 모델 지침이므로 MCP 권한과 publish/delete 확인 정책이 항상 우선한다.

## 5. 단계별 구현 순서 (Implementation Sequence)
1. Guide/Project DB 모델과 REST API를 추가하고 기존 `repo_full_name`을 project 연결로 이관한다.
2. CLI `openlog init`, Git local config, interactive loading UI를 구현한다.
3. MCP server instructions, `start_openlog_session`, Task/Log/Output description을 추가한다.
4. Frontend Agent Settings와 Dashboard/Manage 진입점을 추가한다.
5. MCP Guide와 README를 갱신하고 전체 통합 검증을 수행한다.

## 6. Task 분해 후보 (Task Breakdown Candidates)
- [ ] Task 1: Backend Agent Guide·Project 모델/API와 migration
- [ ] Task 2: CLI interactive project init과 Git binding
- [ ] Task 3: MCP session bootstrap과 document type guidance
- [ ] Task 4: Frontend Agent Settings와 dashboard navigation
- [ ] Task 5: 문서, migration, client별 통합 검증

## 7. 리스크/결정 필요 사항 (Risks / Decisions)
- 리스크: MCP client가 server instructions를 모델 컨텍스트에 반영하는 수준이 다를 수 있다.
- 리스크: backend보다 최신 CLI가 먼저 배포되면 신규 API 호출이 실패한다.
- 결정 완료: 기본 Capture Mode는 `ASK`, Guide 기본 언어는 영어, Capture Mode 적용 대상은 Task/Log/Output 생성·수정이다.
- 롤백/완화 전략: backend를 먼저 배포하고 CLI를 마지막에 배포한다. tool description과 명시적인 bootstrap tool로 client 차이를 완화한다.

## 8. 후속 Task 생성 기준 (Task Creation Criteria)
- Task로 분리할 조건: backend, CLI, MCP, frontend가 독립적으로 테스트·커밋 가능한 경계를 가질 때 각각 Task로 분리한다.
- 첫 Task 생성 시 포함할 범위: DB migration, Guide/Project API, 소유권 및 중복 repository 검증을 포함한다.
- Worklog 생성 기준: API 계약 변경, migration 전략 변경, MCP client별 instructions 동작 차이가 발견되면 기록한다.
