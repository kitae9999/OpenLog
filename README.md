# OpenLog

OpenLog는 개발자를 위한 지식 공유 플랫폼입니다.  
단순히 글을 읽고 끝나는 블로그가 아니라, 글에 직접 제안하고 토론하고 개선 이력을 남길 수 있는 협업형 기술 콘텐츠 공간을 지향합니다.

기존 기술 블로그가 작성자 중심의 일방향 구조에 머무르는 경우가 많다면, OpenLog는 오픈소스의 Pull Request 문화를 콘텐츠에 적용해 독자도 지식 생산에 참여할 수 있도록 설계되었습니다.  
좋은 글을 쌓는 것에서 끝나지 않고, 더 정확하고 더 살아 있는 문서를 함께 만들어가는 것이 이 프로젝트의 핵심입니다.

## Why OpenLog

기술 문서는 시간이 지나면 낡습니다.  
예제가 바뀌고, API가 달라지고, 더 나은 설명 방식이 생깁니다.

하지만 대부분의 블로그 플랫폼에서는 이런 변화가 댓글이나 개인 메모 수준에 머무릅니다.  
OpenLog는 이 문제를 "수정 제안이 가능한 글"이라는 방식으로 풀고자 합니다.

- 독자는 글의 오류나 개선점을 제안할 수 있습니다.
- 작성자는 제안을 검토하고 반영할 수 있습니다.
- 반영된 기여는 기록으로 남아, 단순한 댓글이 아니라 실제 기여 이력이 됩니다.
- 글은 혼자 쓰는 문서가 아니라, 함께 다듬는 지식 자산이 됩니다.

## Core Features

### 1. PR 방식의 글 수정 제안
OpenLog의 가장 큰 특징은 게시글에 대해 PR처럼 수정 제안을 남길 수 있다는 점입니다.  
독자는 본문을 읽다가 더 나은 설명, 최신 정보, 수정된 예제를 제안할 수 있고, 작성자는 이를 검토해 반영할 수 있습니다.

### 2. Contributors 중심의 지식 축적
누가 어떤 글에 기여했는지가 드러납니다.  
좋은 기술적 수정과 개선은 플랫폼 안에서 기록되고, 이는 단순 활동 로그가 아니라 개인의 기여 이력으로 남습니다.

### 3. 지식 그래프 기반 탐색
글은 독립적으로 존재하지 않습니다.  
OpenLog는 글과 주제 사이의 연결성을 시각적으로 보여주어, 사용자가 하나의 글을 읽다가 관련된 다른 지식으로 자연스럽게 확장해 나갈 수 있도록 돕습니다.

### 4. 피드 기반 발견 경험
트렌딩 글, 최신 글, 팔로우 기반 피드를 통해 단순 검색이 아니라 발견 중심의 읽기 경험을 제공합니다.  
좋은 글을 “찾는” 것뿐 아니라 “발견하는” 서비스가 되는 것이 목표입니다.

### 5. 프로필과 활동 이력
사용자는 자신이 작성한 글뿐 아니라, 어떤 글에 제안했고 어떤 기여를 남겼는지도 보여줄 수 있습니다.  
이는 개발자에게 하나의 지식 포트폴리오가 됩니다.

### 6. 개발자 친화적인 작성 경험
마크다운 기반 글쓰기와 미리보기 흐름을 통해, 개발자가 익숙한 방식으로 기술 글을 작성할 수 있도록 했습니다.  
글 작성 경험은 가볍지만, 결과물은 구조적이고 재사용 가능한 문서를 지향합니다.

## What Makes OpenLog Different

OpenLog는 “기술 블로그”와 “오픈소스 협업 방식”의 중간 지점을 만듭니다.

- 블로그처럼 읽기 쉽고
- 문서처럼 누적되며
- PR처럼 개선되고
- 커뮤니티처럼 함께 성장합니다

즉, OpenLog는 단순한 포스팅 플랫폼이 아니라  
**개발 지식을 작성, 검토, 개선, 축적하는 협업형 지식 레이어**를 목표로 합니다.

## Who It’s For

OpenLog는 이런 사용자에게 잘 맞습니다.

- 기술 글을 꾸준히 쓰고 싶은 개발자
- 다른 사람의 글을 읽으며 개선점을 제안하고 싶은 독자
- 자신의 기여를 포트폴리오처럼 남기고 싶은 기여자
- 문서와 블로그의 장점을 함께 가진 플랫폼을 원하는 팀과 커뮤니티

## CLI and MCP

OpenLog는 공식 CLI와 MCP server를 npm 패키지로 제공합니다.

CLI는 웹에서 승인한 로그인 결과를 로컬에 저장하고, MCP server는 Codex나 Claude Code 같은 MCP client가 로그인한 OpenLog 계정의 데이터를 조회하거나 글을 발행할 수 있게 합니다.

### CLI 사용

```bash
npx -y @kitae9999/openlog-cli login
npx -y @kitae9999/openlog-cli whoami
npx -y @kitae9999/openlog-cli mcp
```

- `openlog login`: device login을 시작하고 브라우저에서 OpenLog 승인 화면을 엽니다.
- `openlog whoami`: 현재 저장된 로그인 계정을 확인합니다.
- `openlog logout`: 로컬에 저장된 OpenLog 인증 정보를 삭제합니다.
- `openlog mcp`: stdio 기반 OpenLog MCP server를 실행합니다.

전역 설치 후에는 `openlog` 명령을 직접 사용할 수 있습니다.

```bash
npm install -g @kitae9999/openlog-cli
openlog login
openlog mcp
```

### MCP client 설정

MCP client에는 다음처럼 등록할 수 있습니다.

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@kitae9999/openlog-cli", "mcp"]
    }
  }
}
```

CLI에서 지원하는 자동 등록 명령도 제공합니다.

```bash
openlog mcp install codex
openlog mcp install claude-code
```

### MCP tools

- `get_auth_status`: 로컬 CLI 로그인 상태 확인
- `get_me`: 현재 로그인 사용자 조회
- `list_my_notifications`: 내 알림 목록 조회
- `list_my_posts`: 내가 작성한 글 목록 조회
- `list_my_liked_posts`: 내가 좋아요한 글 목록 조회
- `get_post_detail`: 특정 글 상세 조회
- `upload_post_image`: 로컬 이미지를 WebP로 변환해 OpenLog 글 본문 이미지로 업로드
- `publish_post`: 로그인 계정으로 새 글 발행

`publish_post`는 기본적으로 preview만 반환하며, 실제 발행은 `confirm: true` 또는 명시적인 `skipConfirmation: true`가 있을 때만 수행합니다.

### 로컬 개발 환경 연결

운영 API 대신 로컬 서버를 사용할 때는 환경 변수를 지정합니다.

```bash
OPENLOG_API_BASE_URL=http://localhost:8080/api \
OPENLOG_WEB_BASE_URL=http://localhost:3030 \
npx -y @kitae9999/openlog-cli mcp
```

- `OPENLOG_API_BASE_URL`: CLI/MCP가 호출할 OpenLog API base URL
- `OPENLOG_WEB_BASE_URL`: `publish_post` 응답에 포함할 웹 URL base
- `OPENLOG_AUTH_FILE`: 기본 `~/.openlog/auth.json` 대신 사용할 인증 파일 경로

## Vision

OpenLog의 목표는 “좋은 글이 쌓이는 서비스”를 넘어서,  
**좋은 기술 지식이 함께 유지되고 업데이트되는 생태계**를 만드는 것입니다.

한 번 쓰고 묻히는 글이 아니라,  
여러 사람의 기여를 거쳐 더 정확해지고 더 풍부해지는 문서.  
OpenLog는 그 흐름을 제품 경험으로 만들고자 합니다.

## Status

OpenLog는 현재 협업형 기술 콘텐츠 플랫폼의 핵심 경험을 만들어가는 단계에 있습니다.  
글 작성, 피드 탐색, 제안 흐름, 기여자 개념, 프로필 활동, 인증 기반 사용자 경험 등을 중심으로 제품의 뼈대를 다듬고 있습니다.

## Next

앞으로는 다음과 같은 방향으로 확장될 수 있습니다.

- 제안 승인/병합 흐름의 고도화
- 기여 이력의 정교한 시각화
- 지식 그래프 탐색 경험 개선
- 협업 토론 기능 강화
- 개발자 커뮤니티에 맞는 신뢰도/기여도 체계 확장
