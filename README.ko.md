# OpenLog

[English](./README.md) | [한국어](./README.ko.md)

**코드 뒤에 남은 맥락을 기록하고, 오래가는 지식으로 바꿉니다.**

[OpenLog](https://openlog.kr)는 개발자 워크스페이스와 협업형 글쓰기 플랫폼을 하나로 연결한 서비스입니다. AI 코딩 에이전트와 작업하면서 생긴 Task, Log, 결정, Memory, Output을 보존하고, 그 맥락을 다른 사람이 검토하고 개선할 수 있는 기술 글로 이어줍니다.

OpenLog v1.0.0은 새롭게 구성한 워크스페이스 경험을 공식 적용한 첫 번째 Release입니다.

## OpenLog가 필요한 이유

변경의 배경과 중요한 판단은 대화 기록, 터미널 출력, 이슈 트래커, 임시 메모 곳곳에 흩어집니다. 나중에 문서나 글을 쓰려고 하면 작업 당시의 이유와 고민은 이미 상당 부분 사라진 뒤입니다.

OpenLog는 그 맥락을 실제 작업 가까이에 남깁니다.

- 에이전트가 현재 작업과 남은 문제를 계속 정리할 수 있습니다.
- Task, Log, Todo, Memory, Output을 하나의 워크스페이스에서 연결합니다.
- Activity와 Graph로 작업의 흐름과 문서 관계를 확인합니다.
- 완성된 Output을 Markdown 게시글로 발행합니다.
- 독자는 PR과 비슷한 제안 흐름으로 글을 함께 개선합니다.

## 핵심 흐름

1. OpenLog CLI와 MCP server를 코딩 에이전트에 연결합니다.
2. 평소처럼 작업하면 에이전트가 워크스페이스의 Now Working을 갱신합니다.
3. 구현 과정, 결정, 문제 해결 내용과 재사용할 맥락을 Log와 Memory로 남깁니다.
4. 관련 Task, Log, Memory, Output을 Graph에서 연결합니다.
5. 쌓인 맥락을 Output으로 정리해 게시글로 발행합니다.
6. 제안을 검토하고 공개된 지식을 계속 최신 상태로 유지합니다.

## 주요 기능

### 에이전트와 연결되는 워크스페이스

- **Now Working**은 최근 브랜치, 연결된 Task, 완료한 작업, 고민 중인 문제와 다음 단계를 요약합니다.
- **Tasks와 Todos**로 예정된 작업과 진행 중인 일을 관리합니다.
- **Logs**는 일반 진행 상황뿐 아니라 결정, 이슈, 수정 내역을 종류별로 기록합니다.
- **Memory**는 독립적으로 작성하거나 기존 Log에서 오래 보존할 맥락을 저장합니다.
- **Outputs**는 워크스페이스 문서를 조합해 발행 가능한 Markdown 결과물을 만듭니다.

### Activity와 지식 Graph

- GitHub 형태의 Activity 화면에서 최근 1년간의 Log 활동과 날짜별 상세 내역을 확인합니다.
- Planner와 Dashboard에서 현재 작업과 월간 진행 상황을 빠르게 파악합니다.
- Graph는 Task, Log, Memory, Output을 연결하며 서로 다른 문서 유형도 수동으로 연결할 수 있습니다.

### 협업형 글쓰기

- Markdown 작성과 미리보기
- 공개 프로필과 작성한 게시글
- 피드 탐색과 팔로우
- 게시글 수정 제안, 토론, 댓글, 좋아요, 기여 이력
- 관련 글 연결과 공개 지식 Graph 탐색

### 오래 유지되는 로그인

- 웹은 짧은 수명의 access token과 회전하는 refresh session을 사용합니다.
- CLI의 device login은 에이전트 설정에 계정 비밀번호를 넣지 않고도 MCP 연결을 유지합니다.

## 시작하기

[openlog.kr](https://openlog.kr)에 접속해 로그인한 뒤 워크스페이스를 만드세요.

### CLI

공식 CLI는 Node.js 20 이상이 필요합니다.

처음 연결할 때는 대화형 설정을 실행하세요.

```bash
npx -y @openloghq/cli@latest
```

온보딩 위저드가 로그인, Codex·Claude Code·Cursor 또는 모든 지원 client의
OpenLog MCP 등록, 로컬 MCP 권한 프로필 선택을 차례로 안내합니다. 위저드는
언제든 다시 실행할 수 있습니다.

```bash
npx -y @openloghq/cli@latest setup
```

비대화형 환경이나 수동 설정에서는 개별 명령을 사용하세요.

```bash
npx -y @openloghq/cli@latest login
npx -y @openloghq/cli@latest whoami
npx -y @openloghq/cli@latest mcp
```

- `openlog login`: device login을 시작하고 브라우저에서 승인 화면을 엽니다.
- `openlog whoami`: 로컬에 로그인된 계정을 확인합니다.
- `openlog logout`: 로컬 OpenLog session을 삭제합니다.
- `openlog mcp`: stdio 기반 MCP server를 실행합니다.

전역으로 설치하면 `openlog` 명령을 바로 사용할 수 있습니다.

```bash
npm install -g @openloghq/cli
openlog
```

### MCP client 설정

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@openloghq/cli@latest", "mcp"]
    }
  }
}
```

지원하는 client에는 CLI로 자동 등록할 수도 있습니다.

```bash
openlog mcp install all
openlog mcp install codex
openlog mcp install claude-code
openlog mcp install cursor
```

`all`은 Codex, Claude Code, Cursor에 차례로 등록합니다. Cursor 설정은 전역
`~/.cursor/mcp.json`에 추가되며 기존 MCP server 설정은 유지됩니다.

### 로컬 MCP 권한

OpenLog는 로컬 권한 프로필에 따라 MCP tool을 등록합니다.

```bash
openlog mcp permissions
openlog mcp permissions set read-only
openlog mcp permissions set safe-write
openlog mcp permissions set full
openlog mcp permissions reset
```

| 프로필 | 허용 기능 |
| --- | --- |
| `read-only` | 인증 상태와 조회 tool |
| `safe-write` | 조회, 생성, 수정, 연결, 이미지 업로드, 확인 후 발행 tool |
| `full` | `safe-write` 기능과 개별 즉시 삭제, working brief 초기화 tool |

기본값은 `safe-write`입니다. 프로필을 바꾼 뒤 MCP server를 재시작하거나 다시 로드해야 합니다. 이 설정은 로컬 에이전트 안전 정책이며, API는 로그인 사용자의 서버 권한을 별도로 계속 검사합니다.

### MCP tools

| 영역 | Tool |
| --- | --- |
| 권한과 계정 | `get_mcp_permissions`, `get_auth_status`, `get_me`, `list_my_notifications`, `list_my_posts`, `list_my_liked_posts` |
| 공개 게시글 | `get_post_detail`, `upload_post_image`, `publish_post` |
| 워크스페이스와 활동 | `start_openlog_session`, `list_workspaces`, `get_workspace`, `get_workspace_project`, `get_workspace_agent_guide`, `get_working_brief`, `push_working_brief`, `get_workspace_activity`, `get_workspace_activity_day_logs` |
| Agent Guide | `update_workspace_agent_guide` |
| Capture Mode | `update_workspace_project_capture_mode` |
| Task와 Log | workspace task와 log의 list/get/create/update tool |
| Todo와 Memory | todo 조회·생성·완료 tool, memory 조회·생성·log 변환·수정 tool |
| Output | `list_workspace_outputs`, `get_workspace_output`, `create_workspace_output`, `update_workspace_output`, `publish_workspace_output` |
| Graph link | `list_workspace_links`와 task/log/cross-link 생성 tool |
| Full 삭제 | working brief 초기화와 task/log/todo/memory/output/link 개별 삭제 tool |

`publish_post`, `publish_workspace_output`, `update_workspace_agent_guide`, `update_workspace_project_capture_mode`는 기본적으로 미리보기만 반환합니다. 실제 반영에는 `confirm: true`가 필요하며, 사용자가 추가 확인 없이 쓰라고 명시한 경우에만 `skipConfirmation: true`를 사용할 수 있습니다.

### 로컬 서버 연결

```bash
OPENLOG_API_BASE_URL=http://localhost:8080/api \
OPENLOG_WEB_BASE_URL=http://localhost:3030 \
npx -y @openloghq/cli@latest mcp
```

- `OPENLOG_API_BASE_URL`: CLI와 MCP server가 호출할 API base URL
- `OPENLOG_WEB_BASE_URL`: 게시글 발행 응답에 사용할 웹 base URL
- `OPENLOG_AUTH_FILE`: 기본 `~/.openlog/auth.json`을 대신할 인증 파일 경로
- `OPENLOG_MCP_CONFIG_FILE`: 기본 `~/.openlog/mcp-config.json`을 대신할 권한 설정 파일 경로

## 로컬 개발

### 필요 환경

- Java 21
- Node.js 20 이상
- pnpm 10
- 로컬 인프라 실행을 위한 Docker

### 실행

```bash
docker compose up -d
./gradlew :backend:bootRunLocal
```

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend는 `http://localhost:3030`, API는 `http://localhost:8080/api`에서 실행됩니다.

### 검증

```bash
./gradlew :backend:test
cd frontend && pnpm lint && pnpm build && pnpm test:e2e
cd packages/openlog-cli && npm test && npm run build
```

## 저장소 구조

```text
backend/                Spring Boot API와 DB migration
frontend/               Next.js 웹 애플리케이션과 Playwright 테스트
packages/openlog-cli/   공식 CLI와 MCP server
deploy/                 운영 배포 설정
_docs/                  Plan, Worklog, Task, Issue, PR 기록
```

## 저작권과 저장소 이용

Copyright © 2026 OpenLog. All rights reserved.

이 저장소는 포트폴리오와 기술 검토를 목적으로 공개되어 있지만 오픈소스가 아닙니다. GitHub 이용약관 또는 관련 법률이 허용하는 범위를 제외하고, 사전 서면 허가 없이 코드나 문서를 사용, 복제, 수정, 재배포하거나 상업적으로 이용할 수 없습니다. 저장소 공개는 저작권 포기 또는 추가 라이선스 부여를 의미하지 않습니다.

## 기여 안내

현재 외부 코드 기여는 받지 않습니다. Issue를 통한 버그 제보와 기능 제안은 환영합니다. 사전 협의 없이 생성된 Pull Request는 병합되지 않을 수 있습니다. 향후 기여 정책과 기여자 라이선스 동의서(Contributor License Agreement, CLA)를 제공할 수 있습니다.

## Release

변경 내용과 버전 기록은 [OpenLog Releases](https://github.com/kitae9999/OpenLog/releases)에서 확인할 수 있습니다.
