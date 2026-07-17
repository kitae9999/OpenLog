# OpenLog

[English](./README.md) | [한국어](./README.ko.md)

**작업하며 쌓인 맥락을 기록하고, 오래 쓰는 지식으로 만들어요.**

[OpenLog](https://openlog.kr)는 개발자 워크스페이스와 협업형 글쓰기를 연결한 서비스예요. AI 코딩 에이전트와 작업하며 생긴 Task, Log, 결정, Memory, Output을 한곳에 남겨요. 이렇게 쌓인 맥락은 다른 사람과 함께 검토하고 다듬을 수 있는 기술 글로 이어져요.

OpenLog v1.0.0은 새로 설계한 워크스페이스 경험을 처음 선보인 릴리스예요.

## 왜 OpenLog가 필요할까요?

변경한 이유와 중요한 판단은 대화 기록, 터미널 출력, 이슈 트래커, 임시 메모 곳곳에 흩어지기 쉬워요. 나중에 글로 정리하려고 보면, 작업할 때 어떤 고민을 했는지 떠올리기 어려울 때가 많아요.

OpenLog는 작업이 끝나기 전에 그 맥락을 가까운 곳에 남겨요.

- 에이전트가 지금 하는 일과 남은 문제를 계속 정리해요.
- Task, Log, Todo, Memory, Output을 하나의 워크스페이스에서 연결해요.
- Activity와 Graph에서 작업 흐름과 문서 관계를 살펴볼 수 있어요.
- 완성한 Output은 Markdown 게시글로 발행해요.
- 독자는 PR과 비슷한 제안 방식으로 글을 함께 다듬어요.

## 이렇게 사용해요

1. OpenLog 원격 MCP 서버를 코딩 에이전트에 연결해요.
2. 평소처럼 작업해요. 에이전트가 워크스페이스의 Now Working을 갱신해요.
3. 구현 과정과 결정, 문제를 해결한 내용, 다시 쓸 맥락은 Log와 Memory에 남겨요.
4. 관련된 Task, Log, Memory, Output을 Graph로 연결해요.
5. 쌓인 맥락을 Output으로 정리하고 게시글로 발행해요.
6. 제안을 검토하며 공개된 지식을 최신 상태로 유지해요.

## 주요 기능

### 에이전트와 연결되는 워크스페이스

- **Now Working**에서 최근 브랜치와 연결된 Task, 완료한 작업, 고민 중인 문제, 다음 단계를 한눈에 볼 수 있어요.
- **Tasks와 Todos**로 예정된 작업과 진행 중인 일을 관리해요.
- **Logs**에는 진행 상황과 결정, 이슈, 수정 내역을 종류별로 기록해요.
- **Memory**는 따로 작성할 수도 있고, 기존 Log에서 오래 남길 맥락을 가져올 수도 있어요.
- **Outputs**는 워크스페이스 문서를 모아 발행할 수 있는 Markdown 결과물로 만들어요.

### Activity와 지식 Graph

- GitHub 형태의 Activity 화면에서 최근 1년간의 Log 활동과 날짜별 내역을 확인해요.
- Planner와 Dashboard에서는 현재 작업과 월간 진행 상황을 빠르게 살펴볼 수 있어요.
- Graph로 Task, Log, Memory, Output을 연결해요. 서로 다른 문서 유형도 직접 연결할 수 있어요.

### 협업형 글쓰기

- Markdown 작성과 미리보기
- 공개 프로필과 작성한 게시글
- 피드 탐색과 팔로우
- 게시글 수정 제안, 토론, 댓글, 좋아요, 기여 이력
- 관련 글 연결과 공개 지식 Graph 탐색

### 로그인은 오래 유지돼요

- 웹은 수명이 짧은 access token과 주기적으로 바뀌는 refresh session을 사용해요.
- 원격 MCP는 OAuth로 연결하며, 에이전트 설정에 계정 비밀번호나 OpenLog 토큰을 저장하지 않아요.

## 시작해 볼까요?

[openlog.kr](https://openlog.kr)에 로그인하고 워크스페이스를 먼저 만들어 주세요.

### 원격 MCP 연결 (권장)

새 연결은 `https://api.openlog.kr/mcp`의 Streamable HTTP MCP를 사용해요.
로컬 OpenLog CLI나 MCP 서버를 설치할 필요가 없어요. 연결 상태와 권한은
[OpenLog 에이전트 가이드](https://openlog.kr/settings/mcp-guide)에서 확인·변경·해지할 수 있어요.

#### Codex CLI

```bash
codex mcp add openlog --url https://api.openlog.kr/mcp
codex mcp login openlog
```

#### Claude Code

```bash
claude mcp add --transport http --scope user openlog https://api.openlog.kr/mcp
claude mcp login openlog
```

#### Cursor

[Add to Cursor](https://cursor.com/install-mcp?name=openlog&config=eyJ1cmwiOiJodHRwczovL2FwaS5vcGVubG9nLmtyL21jcCJ9)를 누르거나 다음 설정을 등록하세요.

```json
{
  "mcpServers": {
    "openlog": {
      "url": "https://api.openlog.kr/mcp"
    }
  }
}
```

처음 연결할 때 브라우저에서 OpenLog 로그인과 연결 승인을 진행해요. 기본 권한은
`safe-write`이고, 삭제 도구가 필요한 경우에만 `full`을 명시적으로 선택해요.

`start_openlog_session`은 로컬 경로 없이 시작해요. 프로젝트가 하나면 바로 연결하고,
여러 개면 에이전트가 목록을 보여준 뒤 사용자의 선택을 받아요. 원격 v1은 로컬
경로 탐색과 `upload_post_image(filePath)`를 제공하지 않아요.

MCP 서버가 에이전트에 건네는 기본 세션 안내는 한국어예요. 워크스페이스별
Agent Guide와 프로젝트별 Capture Mode(`AUTO`, `ASK`, `EXPLICIT`)는 서버에 저장되고
세션 시작 시 적용돼요. 기본 Capture Mode는 `ASK`예요.

### 기존 로컬 CLI (호환 유지)

stdio CLI, device login, 로컬 프로젝트 바인딩은 한 버전 동안만 호환을 유지해요.
신규 사용자에게는 원격 MCP 연결을 권장해요.

공식 CLI를 사용하려면 Node.js 20 이상이 필요해요.

처음이라면 대화형 설정으로 시작해 보세요.

```bash
npx -y @openloghq/cli@latest
```

온보딩 위저드가 로그인부터 MCP 등록, 로컬 MCP 권한 설정까지 차례로 안내해요.
Codex·Claude Code·Cursor를 하나씩 고르거나 한 번에 모두 연결할 수 있어요.
이 과정에서 현재 디렉토리를 살펴보거나 연결하지는 않아요. 설정을 마치면 로컬
폴더가 없어도 에이전트가 OpenLog 프로젝트를 찾을 수 있어요. 위저드는 언제든
다시 실행할 수 있어요.

```bash
npx -y @openloghq/cli@latest setup
```

폴더 경로로 프로젝트를 자동으로 찾고 싶다면 해당 폴더에서 init을 실행해요.

```bash
cd <folder>
npx -y @openloghq/cli@latest init
```

`openlog init`은 현재 폴더가 Git 저장소인지 일반 폴더인지 먼저 보여줘요. 연결할지
확인한 뒤 프로젝트를 선택해요. Git 저장소에서는 로컬 `.git/config`의
`openlog.projectId`를 사용하고, 일반 폴더에서는 버전이 포함된
`.openlog/project.json`을 사용해요. 일반 폴더의 하위 경로에서 세션을 시작해도
가장 가까운 상위 바인딩을 찾아요. 폴더 안의 파일은 살펴보지 않아요.

`start_openlog_session`은 경로 없이도 호출할 수 있어요. 프로젝트가 하나라면 바로
시작하고, 여러 개라면 에이전트가 어떤 프로젝트를 사용할지 물어봐요.
`create_workspace_project`로는 디렉토리 없이 프로젝트를 만들고 시작할 수 있어요.
필요할 때 `openlog init`으로 로컬 폴더를 연결하면 돼요.

MCP 서버가 에이전트에 건네는 기본 세션 안내는 한국어예요. 도구명과 입력 필드,
Capture Mode, 응답 상태값은 바꾸지 않아요. 워크스페이스별 Agent Guide는 기본
세션 안내와 따로 관리해요.

대화형 화면을 사용할 수 없거나 직접 설정하고 싶다면 아래 명령을 사용해요.

```bash
npx -y @openloghq/cli@latest login
npx -y @openloghq/cli@latest whoami
npx -y @openloghq/cli@latest mcp
```

- `openlog login`: device login을 시작하고 브라우저에서 승인 화면을 열어요.
- `openlog whoami`: 로컬에 로그인된 계정을 확인해요.
- `openlog logout`: 로컬 OpenLog session을 삭제해요.
- `openlog init`: 현재 폴더를 OpenLog 프로젝트에 연결해요.
- `openlog mcp`: stdio 기반 MCP 서버를 실행해요.

전역으로 설치하면 `openlog` 명령을 바로 사용할 수 있어요.

```bash
npm install -g @openloghq/cli
openlog
```

### 기존 로컬 MCP 클라이언트 연결하기

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

지원하는 클라이언트에는 CLI가 MCP 설정을 자동으로 등록해요.

```bash
openlog mcp install all
openlog mcp install codex
openlog mcp install claude-code
openlog mcp install cursor
```

`all`을 선택하면 Codex, Claude Code, Cursor에 차례로 등록해요. Cursor 설정은
전역 `~/.cursor/mcp.json`에 추가하고, 기존 MCP 서버 설정은 그대로 둬요.

### 로컬 MCP 권한

OpenLog는 선택한 로컬 권한 프로필에 맞춰 MCP 도구를 등록해요.

```bash
openlog mcp permissions
openlog mcp permissions set read-only
openlog mcp permissions set safe-write
openlog mcp permissions set full
openlog mcp permissions reset
```

| 프로필       | 사용할 수 있는 기능                                           |
| ------------ | ------------------------------------------------------------- |
| `read-only`  | 인증 상태와 조회 도구                                         |
| `safe-write` | 조회, 생성, 수정, 연결, 이미지 업로드, 확인 후 발행 도구      |
| `full`       | `safe-write` 기능과 개별 즉시 삭제, working brief 초기화 도구 |

기본 프로필은 `safe-write`예요. 프로필을 바꾸면 MCP 서버를 재시작하거나 다시
불러와 주세요. 이 설정은 로컬 에이전트에 적용되는 안전 정책이에요. API는 로그인한
사용자의 서버 권한을 별도로 계속 확인해요.

### MCP 도구

| 영역                | 도구                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 권한과 계정         | `get_mcp_permissions`, `get_auth_status`, `get_me`, `list_my_notifications`, `list_my_posts`, `list_my_liked_posts`                                                                                                                                   |
| Post                | `list_my_posts`, `get_my_post`, `create_post_draft`, `update_post`, `publish_post`, `unpublish_post`, `get_post_detail`                                                                                                                               |
| 워크스페이스와 활동 | `start_openlog_session`, `list_workspaces`, `get_workspace`, `get_workspace_project`, `create_workspace_project`, `get_workspace_agent_guide`, `get_working_brief`, `push_working_brief`, `get_workspace_activity`, `get_workspace_activity_day_logs` |
| Agent Guide         | `update_workspace_agent_guide`                                                                                                                                                                                                                        |
| Capture Mode        | `update_workspace_project_capture_mode`                                                                                                                                                                                                               |
| Task와 Log          | workspace task와 log의 조회·생성·수정 도구                                                                                                                                                                                                            |
| Todo와 Memory       | todo 조회·생성·완료 도구, memory 조회·생성·log 변환·수정 도구                                                                                                                                                                                         |
| Output              | `list_workspace_outputs`, `get_workspace_output`, `create_workspace_output`, `update_workspace_output`, `create_post_draft_from_output`                                                                                                               |
| Graph 연결          | `list_workspace_links`와 task/log/cross-link 생성 도구                                                                                                                                                                                                |
| `full` 삭제         | working brief 초기화와 task/log/todo/memory/output/link 개별 삭제 도구                                                                                                                                                                                |

`create_workspace_project`, `create_post_draft_from_output`, `publish_post`, `unpublish_post`,
`update_workspace_agent_guide`, `update_workspace_project_capture_mode`는 먼저
미리보기를 보여줘요. 실제로 반영하려면 `confirm: true`가 필요해요. 사용자가
추가 확인 없이 진행해 달라고 직접 요청한 경우에만 `skipConfirmation: true`를
사용할 수 있어요.

## 저장소 구조

```text
backend/                Spring Boot API와 DB 마이그레이션
frontend/               Next.js 웹 애플리케이션과 Playwright 테스트
packages/openlog-cli/   원격 MCP 서버와 호환 CLI
deploy/                 운영 배포 설정
```

## 저작권과 저장소 이용

Copyright © 2026 OpenLog. All rights reserved.

이 저장소는 포트폴리오와 기술 검토를 목적으로 공개되어 있지만 오픈소스가 아닙니다. GitHub 이용약관 또는 관련 법률이 허용하는 범위를 제외하고, 사전 서면 허가 없이 코드나 문서를 사용, 복제, 수정, 재배포하거나 상업적으로 이용할 수 없습니다. 저장소 공개는 저작권 포기 또는 추가 라이선스 부여를 의미하지 않습니다.

## 기여 안내

현재 외부 코드 기여는 받지 않습니다. Issue를 통한 버그 제보와 기능 제안은 환영합니다. 사전 협의 없이 생성된 Pull Request는 병합되지 않을 수 있습니다. 향후 기여 정책과 기여자 라이선스 동의서(Contributor License Agreement, CLA)를 제공할 수 있습니다.

## 릴리스

변경 내용과 버전 기록은 [OpenLog Releases](https://github.com/kitae9999/OpenLog/releases)에서 확인해 주세요.
