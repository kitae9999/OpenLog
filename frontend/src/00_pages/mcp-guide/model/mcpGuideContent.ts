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
      "list_workspaces",
      "get_workspace",
      "get_working_brief",
      "get_workspace_activity",
      "get_workspace_activity_day_logs",
    ],
    access: "readOnly",
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
      "Connect Codex, Claude Code, Cursor, or any MCP client to OpenLog. The CLI stores your login locally; the MCP server exposes tools over stdio so agents can read workspace data and publish outputs.",
    sections: {
      login: {
        title: "1. Log in with the CLI",
        body: "MCP tools require a local OpenLog session. Run device login once in your terminal and approve the request in the browser.",
        footnoteBefore: "Verify with",
        footnoteAfter: ".",
      },
      register: {
        title: "2. Register the MCP server",
        body: "Add OpenLog to your MCP client configuration:",
        installers:
          "Register all supported local clients at once, or choose one client:",
      },
      manual: {
        title: "3. Start the server (manual)",
        body: "Most clients launch the server automatically. To run it yourself for debugging:",
        footnote:
          "The terminal is reserved for MCP protocol traffic once the server is running. Without an override, it connects to https://api.openlog.kr/api.",
      },
      permissions: {
        title: "4. Choose a local permission profile",
        body: "The profile controls which tools the local MCP server exposes. Check or change it with:",
        colProfile: "Profile",
        colCapability: "Capabilities",
        footnote:
          "Changes apply after the MCP server restarts. This is a local agent safety policy; OpenLog API authentication and ownership checks still apply.",
      },
      tools: {
        title: "5. Available tools",
        colArea: "Area",
        colTools: "Tools",
        colAccess: "Available from",
        footnote:
          "Publishing tools return a preview first. Pass confirm: true after review, or use skipConfirmation: true only when the user explicitly requested publishing without another confirmation.",
      },
      local: {
        title: "6. Local development",
        body: "Point the CLI at a local API and web origin:",
        envApi: "API base URL the CLI and MCP call.",
        envWeb: "Web origin used in published-post response URLs.",
        envAuthBefore: "Optional path instead of default",
        envAuthAfter: ".",
        envMcpBefore: "Optional permission config path instead of default",
        envMcpAfter: ".",
      },
      troubleshooting: {
        title: "7. Troubleshooting",
        items: [
          {
            label: "Not authenticated",
            body: "run `openlog login` again and complete browser approval.",
          },
          {
            label: "Client cannot find npx",
            body: "use the full path to npx in `command` or install globally: `npm i -g @openloghq/cli`.",
          },
          {
            label: "Onboarding incomplete",
            body: "finish profile setup before listing or publishing posts.",
          },
          {
            label: "Invalid permission config",
            body: "run `openlog mcp permissions reset`, then restart the MCP server.",
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
      "Codex, Claude Code, Cursor 등 MCP client를 OpenLog에 연결하는 방법입니다. CLI가 로그인 정보를 로컬에 저장하고, MCP server가 stdio로 tool을 노출해 agent가 워크스페이스 데이터를 읽고 output을 발행할 수 있습니다.",
    sections: {
      login: {
        title: "1. CLI로 로그인",
        body: "MCP tool을 쓰려면 로컬 OpenLog 세션이 필요합니다. 터미널에서 device login을 한 번 실행하고 브라우저에서 승인하세요.",
        footnoteBefore: "확인:",
        footnoteAfter: ".",
      },
      register: {
        title: "2. MCP server 등록",
        body: "MCP client 설정에 OpenLog를 추가합니다:",
        installers:
          "지원하는 로컬 client를 한 번에 등록하거나, 필요한 client만 선택해 등록합니다:",
      },
      manual: {
        title: "3. server 수동 실행",
        body: "대부분의 client가 server를 자동으로 띄웁니다. 디버깅용으로 직접 실행하려면:",
        footnote:
          "server가 실행 중이면 해당 터미널은 MCP 프로토콜 전용입니다. 별도 설정이 없으면 https://api.openlog.kr/api에 연결합니다.",
      },
      permissions: {
        title: "4. 로컬 권한 프로필 선택",
        body: "로컬 MCP server가 노출할 tool 범위를 프로필로 설정합니다. 현재 설정을 확인하거나 변경하려면:",
        colProfile: "프로필",
        colCapability: "허용 기능",
        footnote:
          "변경 사항은 MCP server를 재시작한 뒤 반영됩니다. 이 설정은 로컬 에이전트 안전 정책이며, OpenLog API의 인증과 소유권 검사는 그대로 적용됩니다.",
      },
      tools: {
        title: "5. 사용 가능한 tool",
        colArea: "영역",
        colTools: "Tool",
        colAccess: "사용 가능 프로필",
        footnote:
          "발행 tool은 먼저 미리보기를 반환합니다. 검토 후 confirm: true를 전달하세요. 사용자가 추가 확인 없이 발행하라고 명시한 경우에만 skipConfirmation: true를 사용할 수 있습니다.",
      },
      local: {
        title: "6. 로컬 개발",
        body: "로컬 API와 web origin을 지정합니다:",
        envApi: "CLI와 MCP가 호출하는 API base URL.",
        envWeb: "게시글 발행 응답 URL에 쓰는 web origin.",
        envAuthBefore: "기본",
        envAuthAfter: " 대신 쓸 인증 파일 경로(선택).",
        envMcpBefore: "기본",
        envMcpAfter: " 대신 쓸 권한 설정 파일 경로(선택).",
      },
      troubleshooting: {
        title: "7. 문제 해결",
        items: [
          {
            label: "인증되지 않음",
            body: "`openlog login`을 다시 실행하고 브라우저 승인을 완료하세요.",
          },
          {
            label: "client가 npx를 찾지 못함",
            body: "`command`에 npx 전체 경로를 넣거나 `npm i -g @openloghq/cli`로 전역 설치하세요.",
          },
          {
            label: "온보딩 미완료",
            body: "글 목록 조회·발행 전에 프로필 설정을 마치세요.",
          },
          {
            label: "잘못된 권한 설정",
            body: "`openlog mcp permissions reset`을 실행한 뒤 MCP server를 재시작하세요.",
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
      "args": ["-y", "@openloghq/cli", "mcp"]
    }
  }
}`;

export const mcpGuideCommands = {
  login: "npx -y @openloghq/cli login",
  mcp: "npx -y @openloghq/cli mcp",
  installAll: "openlog mcp install all",
  installCodex: "openlog mcp install codex",
  installClaude: "openlog mcp install claude-code",
  installCursor: "openlog mcp install cursor",
  permissions: `openlog mcp permissions
openlog mcp permissions set read-only|safe-write|full
openlog mcp permissions reset`,
  localDev: `OPENLOG_API_BASE_URL=http://localhost:8080/api \\
OPENLOG_WEB_BASE_URL=http://localhost:3030 \\
npx -y @openloghq/cli mcp`,
} as const;

export function parseMcpGuideLocale(value: string | null): McpGuideLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "en"
    ? "/settings/mcp-guide"
    : "/settings/mcp-guide?lang=ko";
}
