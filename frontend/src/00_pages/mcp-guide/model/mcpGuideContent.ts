export type McpGuideLocale = "en" | "ko";

export const MCP_GUIDE_LOCALES: Array<{ key: McpGuideLocale; label: string }> =
  [
    { key: "en", label: "ENG" },
    { key: "ko", label: "KOR" },
  ];

export const mcpGuideCopyButtonLabels = {
  en: { copy: "Copy", copied: "Copied", retry: "Retry", aria: "Copy code" },
  ko: {
    copy: "복사하기",
    copied: "복사했어요",
    retry: "다시 시도",
    aria: "코드 복사하기",
  },
} as const;

export const mcpGuidePermissionProfiles = [
  {
    name: "read-only",
    description: {
      en: "Authentication status and all read tools.",
      ko: "인증 상태를 확인하고 모든 조회 도구를 사용할 수 있어요.",
    },
  },
  {
    name: "safe-write",
    description: {
      en: "Read, create, update, link, upload, and confirmed publish tools. This is the default.",
      ko: "조회, 생성, 수정, 연결, 이미지 업로드, 확인 후 발행 도구를 사용할 수 있어요. 기본 프로필이에요.",
    },
  },
  {
    name: "full",
    description: {
      en: "Everything in safe-write, plus immediate single-item deletes and working-brief clear.",
      ko: "safe-write 기능에 개별 항목 즉시 삭제와 working brief 초기화가 더해져요.",
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
      "get_workspace_project",
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
    area: { en: "Capture Mode update", ko: "Capture Mode 수정" },
    tools: ["update_workspace_project_capture_mode"],
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
    readOnly: "read-only부터",
    safeWrite: "safe-write부터",
    full: "full에서만",
  },
} as const;

export const mcpGuideCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "MCP Guide",
    title: "MCP Guide",
    subtitle:
      "Connect Codex, Claude Code, Cursor, or any MCP client to OpenLog. Run setup once for sign-in, client registration, and permissions. A local folder is optional; bind one later with init when path-based project discovery is useful.",
    sections: {
      setup: {
        title: "1. Run guided setup",
        body: "Run one command in an interactive terminal. The wizard signs you in, registers OpenLog with Codex, Claude Code, Cursor, or all supported clients, and asks you to choose a local MCP permission profile. Setup does not inspect or connect the current directory.",
        footnoteBefore: "Run",
        footnoteAfter: " to reopen the wizard later.",
      },
      project: {
        title: "2. Bind a folder (optional)",
        body: "Run init inside any folder you want OpenLog to recognize. The wizard identifies whether it is a Git repository or a regular folder, then lets you create or choose a project and set Capture Mode. Git repositories store openlog.projectId in local .git/config; regular folders store a versioned .openlog/project.json. OpenLog does not inspect files inside the folder.",
        footnote:
          "Without a folder binding, start_openlog_session works pathlessly. It starts automatically when only one project exists and returns choices when there are several so the agent can ask. create_workspace_project can create and start a project without a directory.",
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
          "start_openlog_session loads the latest Workspace Guide and Capture Mode from a folder binding or an explicitly selected project. Publishing, Agent Guide, and Capture Mode update tools return a preview first. Pass confirm: true after review, or use skipConfirmation: true only when the user explicitly requested the write without another confirmation.",
      },
      troubleshooting: {
        title: "7. Troubleshooting",
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
            label: "Folder not initialized or binding is stale",
            body: "change to the folder and run `npx -y @openloghq/cli@latest init`. The agent will not guess a project when the binding is missing or stale.",
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
    breadcrumbSettings: "설정",
    breadcrumbCurrent: "MCP 가이드",
    title: "MCP 연결하기",
    subtitle:
      "Codex, Claude Code, Cursor 같은 MCP 클라이언트에 OpenLog를 연결해 보세요. 처음 한 번만 설정하면 로그인, 클라이언트 등록, 권한 설정이 끝나요. 폴더 연결은 필요할 때 추가하면 돼요.",
    sections: {
      setup: {
        title: "1. OpenLog MCP를 설정해요",
        body: "대화형 터미널에서 아래 명령을 실행해 주세요. 온보딩 위저드가 로그인부터 Codex·Claude Code·Cursor 연결, 로컬 MCP 권한 선택까지 차례로 도와드려요. 지금 열어 둔 폴더는 살펴보거나 연결하지 않아요.",
        footnoteBefore: "설정을 다시 열고 싶다면",
        footnoteAfter: "을 실행해 주세요.",
      },
      project: {
        title: "2. 폴더를 연결해요 (선택)",
        body: "OpenLog가 폴더 경로로 프로젝트를 찾게 하려면 해당 폴더에서 init을 실행해 주세요. Git 저장소인지 일반 폴더인지 확인한 뒤 새 프로젝트를 만들거나 기존 프로젝트를 고르고 Capture Mode를 정할 수 있어요. Git 저장소에는 로컬 .git/config의 openlog.projectId를, 일반 폴더에는 버전이 담긴 .openlog/project.json을 저장해요. 폴더 안의 파일은 살펴보지 않아요.",
        footnote:
          "폴더를 연결하지 않아도 사용할 수 있어요. 프로젝트가 하나면 바로 시작하고, 여러 개면 에이전트가 어떤 프로젝트를 쓸지 물어봐요. create_workspace_project는 폴더 없이 프로젝트를 만들고 시작해요.",
      },
      register: {
        title: "3. MCP 클라이언트를 직접 연결해요 (선택)",
        body: "위저드에서 클라이언트 연결을 건너뛰었거나 직접 설정하고 싶다면 MCP 클라이언트에 OpenLog를 추가해 주세요:",
        installers:
          "지원하는 클라이언트를 한 번에 모두 연결하거나 필요한 것만 골라도 돼요:",
      },
      manual: {
        title: "4. MCP 서버를 직접 실행해요",
        body: "대부분의 클라이언트는 MCP 서버를 자동으로 실행해요. 디버깅할 때 직접 실행하려면 아래 명령을 사용해 주세요:",
        footnote:
          "MCP 서버가 실행되는 동안 이 터미널은 프로토콜 통신에만 사용해요. 따로 주소를 설정하지 않으면 https://api.openlog.kr/api에 연결해요.",
      },
      permissions: {
        title: "5. 사용할 권한을 확인해요",
        body: "온보딩 위저드에서 고른 로컬 권한을 살펴보거나 바꾸려면 아래 명령을 실행해 주세요:",
        colProfile: "프로필",
        colCapability: "사용할 수 있는 기능",
        footnote:
          "MCP 서버를 다시 시작하면 바뀐 권한이 적용돼요. 이 설정은 에이전트가 사용할 수 있는 도구 범위를 정해요. OpenLog API의 인증과 소유권 검사는 별도로 계속 적용돼요.",
      },
      tools: {
        title: "6. 사용할 수 있는 도구를 살펴봐요",
        colArea: "영역",
        colTools: "도구",
        colAccess: "사용 가능 프로필",
        footnote:
          "start_openlog_session은 연결된 폴더나 선택한 프로젝트에서 최신 Workspace Guide와 Capture Mode를 불러와요. 발행, Agent Guide 수정, Capture Mode 변경은 먼저 미리보기를 보여줘요. 내용을 확인한 뒤 confirm: true를 전달해 주세요. 사용자가 추가 확인 없이 진행해 달라고 직접 요청한 경우에만 skipConfirmation: true를 사용할 수 있어요.",
      },
      troubleshooting: {
        title: "7. 연결이 안 될 때 확인해요",
        items: [
          {
            label: "로그인이 풀렸어요",
            body: "`npx -y @openloghq/cli@latest login`을 다시 실행하고 브라우저에서 승인해 주세요.",
          },
          {
            label: "클라이언트에서 npx를 찾지 못해요",
            body: "`command`에 npx 전체 경로를 넣거나 `npm i -g @openloghq/cli`로 전역 설치해 주세요.",
          },
          {
            label: "설정을 끝내지 못했어요",
            body: "`npx -y @openloghq/cli@latest setup`을 실행하고 남은 설정을 마쳐 주세요.",
          },
          {
            label: "폴더 연결이 없거나 오래됐어요",
            body: "연결할 폴더에서 `npx -y @openloghq/cli@latest init`을 실행해 주세요. 연결 정보가 없거나 오래되면 에이전트가 프로젝트를 임의로 고르지 않아요.",
          },
          {
            label: "권한 설정을 읽지 못해요",
            body: "`npx -y @openloghq/cli@latest mcp permissions reset`을 실행한 뒤 MCP 서버를 다시 시작해 주세요.",
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
  init: `cd <folder>
npx -y @openloghq/cli@latest init`,
  mcp: "npx -y @openloghq/cli@latest mcp",
  installAll: "npx -y @openloghq/cli@latest mcp install all",
  installCodex: "npx -y @openloghq/cli@latest mcp install codex",
  installClaude: "npx -y @openloghq/cli@latest mcp install claude-code",
  installCursor: "npx -y @openloghq/cli@latest mcp install cursor",
  permissions: `npx -y @openloghq/cli@latest mcp permissions
npx -y @openloghq/cli@latest mcp permissions set read-only|safe-write|full
npx -y @openloghq/cli@latest mcp permissions reset`,
} as const;

export function parseMcpGuideLocale(value: string | null): McpGuideLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "en"
    ? "/settings/mcp-guide"
    : "/settings/mcp-guide?lang=ko";
}
