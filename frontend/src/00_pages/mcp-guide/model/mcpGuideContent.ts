export type McpGuideLocale = "en" | "ko";

export const MCP_GUIDE_LOCALES: Array<{ key: McpGuideLocale; label: string }> =
  [
    { key: "en", label: "ENG" },
    { key: "ko", label: "KOR" },
  ];

export const mcpGuideCopyButtonLabels = {
  en: { copy: "Copy", copied: "Copied", retry: "Retry", aria: "Copy code" },
  ko: { copy: "복사", copied: "복사됨", retry: "다시", aria: "코드 복사" },
} as const;

export const mcpGuidePermissionProfiles = [
  {
    name: "read-only",
    description: {
      en: "Authentication status and all read tools.",
      ko: "인증 상태와 모든 조회 tool을 허용합니다.",
    },
  },
  {
    name: "safe-write",
    description: {
      en: "Read, create, update, link, upload, and confirmed publish tools. This is the default.",
      ko: "조회, 생성, 수정, 연결, 이미지 업로드, 확인 후 발행 tool을 허용합니다. 기본 프로필입니다.",
    },
  },
  {
    name: "full",
    description: {
      en: "Everything in safe-write, plus immediate single-item deletes and working-brief clear.",
      ko: "safe-write 기능에 개별 즉시 삭제와 working brief 초기화를 추가합니다.",
    },
  },
] as const;

export const mcpGuideTools = [
  {
    area: { en: "Permissions and account", ko: "권한과 계정" },
    tools: ["get_mcp_permissions", "get_auth_status", "get_me"],
    access: "readOnly",
  },
  {
    area: { en: "Personal activity", ko: "내 활동" },
    tools: ["list_my_notifications", "list_my_posts", "list_my_liked_posts"],
    access: "readOnly",
  },
  {
    area: { en: "Public post lookup", ko: "공개 게시글 조회" },
    tools: ["get_post_detail"],
    access: "readOnly",
  },
  {
    area: { en: "Public post publishing", ko: "공개 게시글 발행" },
    tools: ["upload_post_image", "publish_post"],
    access: "safeWrite",
  },
  {
    area: { en: "Workspace and activity", ko: "워크스페이스와 활동" },
    tools: [
      "start_openlog_session",
      "list_workspaces",
      "get_workspace",
      "get_workspace_agent_guide",
      "get_working_brief",
      "get_workspace_activity",
      "get_workspace_activity_day_logs",
    ],
    access: "readOnly",
  },
  {
    area: { en: "Agent Guide update", ko: "Agent Guide 수정" },
    tools: ["update_workspace_agent_guide"],
    access: "safeWrite",
  },
  {
    area: { en: "Working brief update", ko: "Working brief 수정" },
    tools: ["push_working_brief"],
    access: "safeWrite",
  },
  {
    area: { en: "Tasks — read", ko: "Task 조회" },
    tools: ["list_workspace_tasks", "get_workspace_task"],
    access: "readOnly",
  },
  {
    area: { en: "Tasks — write", ko: "Task 생성·수정" },
    tools: ["create_workspace_task", "update_workspace_task"],
    access: "safeWrite",
  },
  {
    area: { en: "Logs — read", ko: "Log 조회" },
    tools: ["list_workspace_logs", "get_workspace_log"],
    access: "readOnly",
  },
  {
    area: { en: "Logs — write", ko: "Log 생성·수정" },
    tools: ["create_workspace_log", "update_workspace_log"],
    access: "safeWrite",
  },
  {
    area: { en: "Todos — read", ko: "Todo 조회" },
    tools: ["list_workspace_todos"],
    access: "readOnly",
  },
  {
    area: { en: "Todos — write", ko: "Todo 생성·완료" },
    tools: ["create_workspace_todo", "set_workspace_todo_done"],
    access: "safeWrite",
  },
  {
    area: { en: "Memories — read", ko: "Memory 조회" },
    tools: ["list_workspace_memories", "get_workspace_memory"],
    access: "readOnly",
  },
  {
    area: { en: "Memories — write", ko: "Memory 생성·수정" },
    tools: [
      "create_workspace_memory",
      "create_workspace_memory_from_log",
      "update_workspace_memory",
    ],
    access: "safeWrite",
  },
  {
    area: { en: "Outputs — read", ko: "Output 조회" },
    tools: ["list_workspace_outputs", "get_workspace_output"],
    access: "readOnly",
  },
  {
    area: { en: "Outputs — write", ko: "Output 생성·수정·발행" },
    tools: [
      "create_workspace_output",
      "update_workspace_output",
      "publish_workspace_output",
    ],
    access: "safeWrite",
  },
  {
    area: { en: "Graph links — read", ko: "Graph link 조회" },
    tools: ["list_workspace_links"],
    access: "readOnly",
  },
  {
    area: { en: "Graph links — write", ko: "Graph link 생성" },
    tools: [
      "create_workspace_task_link",
      "create_workspace_log_link",
      "create_workspace_cross_link",
    ],
    access: "safeWrite",
  },
  {
    area: { en: "Single-item deletes", ko: "개별 삭제" },
    tools: [
      "clear_working_brief",
      "delete_workspace_task",
      "delete_workspace_log",
      "delete_workspace_todo",
      "delete_workspace_memory",
      "delete_workspace_output",
      "delete_workspace_task_link",
      "delete_workspace_log_link",
      "delete_workspace_cross_link",
    ],
    access: "full",
  },
] as const;

export const mcpGuideAccessLabels = {
  en: {
    readOnly: "read-only+",
    safeWrite: "safe-write+",
    full: "full only",
  },
  ko: {
    readOnly: "read-only 이상",
    safeWrite: "safe-write 이상",
    full: "full 전용",
  },
} as const;

export const mcpGuideCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "MCP Guide",
    title: "MCP Guide",
    subtitle:
      "Connect Codex, Claude Code, Cursor, or any MCP client to OpenLog. Run setup once for sign-in, client registration, and permissions, then init inside each Git project.",
    sections: {
      setup: {
        title: "1. Run guided setup",
        body: "Run one command in an interactive terminal. The wizard signs you in, registers OpenLog with Codex, Claude Code, Cursor, or all supported clients, and asks you to choose a local MCP permission profile. Setup does not inspect or connect the current directory.",
        footnoteBefore: "Run",
        footnoteAfter: " to reopen the wizard later.",
      },
      project: {
        title: "2. Connect a Git project",
        body: "From a Git project, run init separately. Choose a workspace and per-project Capture Mode. OpenLog stores only openlog.projectId in the repository's local .git/config; an origin remote is optional and no tracked agent instruction file is created.",
        footnote: "AUTO may create or update Task, Log, and Output drafts when the Workspace Guide says they matter. ASK confirms first and is the default. EXPLICIT acts only after a direct request. MCP permissions take precedence, while publish and delete keep separate confirmation rules.",
      },
      register: {
        title: "3. Register a client manually (optional)",
        body: "If you skipped client registration in the wizard or need a custom configuration, add OpenLog to your MCP client:",
        installers:
          "You can also register all supported local clients at once, or choose one client:",
      },
      manual: {
        title: "4. Start the server (manual)",
        body: "Most clients launch the server automatically. To run it yourself for debugging:",
        footnote:
          "The terminal is reserved for MCP protocol traffic once the server is running. Without an override, it connects to https://api.openlog.kr/api.",
      },
      permissions: {
        title: "5. Review or change local permissions",
        body: "The wizard sets the local permission profile. To review or change which tools the MCP server exposes, run:",
        colProfile: "Profile",
        colCapability: "Capabilities",
        footnote:
          "Changes apply after the MCP server restarts. This is a local agent safety policy; OpenLog API authentication and ownership checks still apply.",
      },
      tools: {
        title: "6. Available tools",
        colArea: "Area",
        colTools: "Tools",
        colAccess: "Available from",
        footnote:
          "start_openlog_session loads the latest Workspace Guide and Capture Mode from the project's local binding. Publishing and Agent Guide update tools return a preview first. Pass confirm: true after review, or use skipConfirmation: true only when the user explicitly requested the write without another confirmation.",
      },
      local: {
        title: "7. Local development",
        body: "Point the CLI at a local API and web origin:",
        envApi: "API base URL the CLI and MCP call.",
        envWeb: "Web origin used in published-post response URLs.",
        envAuthBefore: "Optional path instead of default",
        envAuthAfter: ".",
        envMcpBefore: "Optional permission config path instead of default",
        envMcpAfter: ".",
      },
      troubleshooting: {
        title: "8. Troubleshooting",
        items: [
          {
            label: "Not authenticated",
            body: "run `npx -y @openloghq/cli@latest login` again and complete browser approval.",
          },
          {
            label: "Client cannot find npx",
            body: "use the full path to npx in `command` or install globally: `npm i -g @openloghq/cli`.",
          },
          {
            label: "Onboarding incomplete",
            body: "run `npx -y @openloghq/cli@latest setup` and finish the guided setup.",
          },
          {
            label: "Project not initialized or stale",
            body: "change to the Git project and run `npx -y @openloghq/cli@latest init`. The agent will not guess a workspace binding.",
          },
          {
            label: "Invalid permission config",
            body: "run `npx -y @openloghq/cli@latest mcp permissions reset`, then restart the MCP server.",
          },
        ],
      },
    },
    footerPackage: "Package:",
  },
  ko: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "MCP Guide",
    title: "MCP Guide",
    subtitle:
      "Codex, Claude Code, Cursor 등 MCP client를 OpenLog에 연결하는 방법입니다. setup으로 로그인·client 등록·권한 설정을 마친 뒤 각 Git 프로젝트에서 init을 실행합니다.",
    sections: {
      setup: {
        title: "1. 대화형 설정 실행",
        body: "대화형 터미널에서 명령 하나를 실행하세요. 온보딩 위저드가 로그인, Codex·Claude Code·Cursor 또는 모든 지원 client의 OpenLog 등록, 로컬 MCP 권한 프로필 선택을 차례로 안내합니다. setup은 현재 디렉터리를 탐색하거나 연결하지 않습니다.",
        footnoteBefore: "나중에 위저드를 다시 열려면",
        footnoteAfter: "을 실행하세요.",
      },
      project: {
        title: "2. Git 프로젝트 연결",
        body: "Git 프로젝트로 이동해 init을 별도로 실행하세요. 워크스페이스와 프로젝트별 Capture Mode를 선택하면 OpenLog는 로컬 .git/config에 openlog.projectId만 저장합니다. origin remote는 선택 사항이며 추적 파일이나 에이전트 지침 파일은 만들지 않습니다.",
        footnote: "AUTO는 Workspace Guide 기준으로 Task·Log·Output 초안을 생성·수정할 수 있습니다. ASK는 먼저 확인하며 기본값입니다. EXPLICIT은 명시 요청 후에만 실행합니다. MCP 권한이 우선하고 발행·삭제 확인 정책은 별도로 유지됩니다.",
      },
      register: {
        title: "3. client 수동 등록(선택)",
        body: "위저드에서 client 등록을 건너뛰었거나 설정을 직접 구성하려면 MCP client에 OpenLog를 추가하세요:",
        installers:
          "명령으로 모든 지원 client를 한 번에 등록하거나 필요한 client만 선택할 수도 있습니다:",
      },
      manual: {
        title: "4. server 수동 실행",
        body: "대부분의 client가 server를 자동으로 띄웁니다. 디버깅용으로 직접 실행하려면:",
        footnote:
          "server가 실행 중이면 해당 터미널은 MCP 프로토콜 전용입니다. 별도 설정이 없으면 https://api.openlog.kr/api에 연결합니다.",
      },
      permissions: {
        title: "5. 로컬 권한 확인·변경",
        body: "위저드가 로컬 권한 프로필을 설정합니다. MCP server가 노출할 tool 범위를 확인하거나 변경하려면 다음 명령을 실행하세요:",
        colProfile: "프로필",
        colCapability: "허용 기능",
        footnote:
          "변경 사항은 MCP server를 재시작한 뒤 반영됩니다. 이 설정은 로컬 에이전트 안전 정책이며, OpenLog API의 인증과 소유권 검사는 그대로 적용됩니다.",
      },
      tools: {
        title: "6. 사용 가능한 tool",
        colArea: "영역",
        colTools: "Tool",
        colAccess: "사용 가능 프로필",
        footnote:
          "start_openlog_session은 프로젝트의 로컬 연결을 통해 최신 Workspace Guide와 Capture Mode를 불러옵니다. 발행·Agent Guide 수정 tool은 먼저 미리보기를 반환합니다. 검토 후 confirm: true를 전달하세요. 사용자가 추가 확인 없이 쓰라고 명시한 경우에만 skipConfirmation: true를 사용할 수 있습니다.",
      },
      local: {
        title: "7. 로컬 개발",
        body: "로컬 API와 web origin을 지정합니다:",
        envApi: "CLI와 MCP가 호출하는 API base URL.",
        envWeb: "게시글 발행 응답 URL에 쓰는 web origin.",
        envAuthBefore: "기본",
        envAuthAfter: " 대신 쓸 인증 파일 경로(선택).",
        envMcpBefore: "기본",
        envMcpAfter: " 대신 쓸 권한 설정 파일 경로(선택).",
      },
      troubleshooting: {
        title: "8. 문제 해결",
        items: [
          {
            label: "인증되지 않음",
            body: "`npx -y @openloghq/cli@latest login`을 다시 실행하고 브라우저 승인을 완료하세요.",
          },
          {
            label: "client가 npx를 찾지 못함",
            body: "`command`에 npx 전체 경로를 넣거나 `npm i -g @openloghq/cli`로 전역 설치하세요.",
          },
          {
            label: "온보딩 미완료",
            body: "`npx -y @openloghq/cli@latest setup`을 실행해 대화형 설정을 완료하세요.",
          },
          {
            label: "프로젝트 미초기화 또는 stale 연결",
            body: "Git 프로젝트로 이동해 `npx -y @openloghq/cli@latest init`을 실행하세요. 에이전트는 워크스페이스 연결을 임의로 추정하지 않습니다.",
          },
          {
            label: "잘못된 권한 설정",
            body: "`npx -y @openloghq/cli@latest mcp permissions reset`을 실행한 뒤 MCP server를 재시작하세요.",
          },
        ],
      },
    },
    footerPackage: "패키지:",
  },
} as const;

export const mcpClientConfig = `{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@openloghq/cli@latest", "mcp"]
    }
  }
}`;

export const mcpGuideCommands = {
  setup: "npx -y @openloghq/cli@latest",
  setupAgain: "npx -y @openloghq/cli@latest setup",
  init: `cd <project>
npx -y @openloghq/cli@latest init`,
  mcp: "npx -y @openloghq/cli@latest mcp",
  installAll: "npx -y @openloghq/cli@latest mcp install all",
  installCodex: "npx -y @openloghq/cli@latest mcp install codex",
  installClaude: "npx -y @openloghq/cli@latest mcp install claude-code",
  installCursor: "npx -y @openloghq/cli@latest mcp install cursor",
  permissions: `npx -y @openloghq/cli@latest mcp permissions
npx -y @openloghq/cli@latest mcp permissions set read-only|safe-write|full
npx -y @openloghq/cli@latest mcp permissions reset`,
  localDev: `OPENLOG_API_BASE_URL=http://localhost:8080/api \\
OPENLOG_WEB_BASE_URL=http://localhost:3030 \\
npx -y @openloghq/cli@latest mcp`,
} as const;

export function parseMcpGuideLocale(value: string | null): McpGuideLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "en"
    ? "/settings/mcp-guide"
    : "/settings/mcp-guide?lang=ko";
}
