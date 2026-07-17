export type McpGuideLocale = "en" | "ko";

export const MCP_GUIDE_LOCALES: Array<{ key: McpGuideLocale; label: string }> =
  [
    { key: "ko", label: "KOR" },
    { key: "en", label: "ENG" },
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

export const mcpGuideCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "MCP Guide",
    title: "MCP Guide",
    subtitle:
      "In your project folder, run one command. It signs you in, registers OpenLog with your agent, sets permissions, then binds the folder with init.",
    sections: {
      setup: {
        title: "Get started",
        prerequisiteBefore: "If you don't have Node.js yet, install it from",
        prerequisiteLink: "nodejs.org",
        prerequisiteAfter: " first.",
        body: "Copy the command below into a terminal in your project folder, then follow the wizard steps.",
        footnoteBefore: "To reopen setup alone later, run",
        footnoteAfter: ".",
        steps: {
          run: {
            title: "Run the command",
            body: "Paste this in your project folder. One command covers setup and folder init.",
          },
          signIn: {
            title: "Sign in with the browser",
            body: "Confirm the prompt, approve the device code in the browser, then return to the terminal.",
          },
          agents: {
            title: "Register your agents",
            body: "Pick Codex, Claude Code, Cursor, or all of them. The CLI writes each client's MCP config.",
          },
          permissions: {
            title: "Choose a permission profile",
            body: "safe-write is the default — read, write, and publish without delete tools.",
          },
          init: {
            title: "Bind this folder",
            body: "Init connects the folder to a workspace project, then asks how the agent should capture drafts.",
            bullets: [
              "ASK — confirm before creating or updating",
              "AUTO — the agent decides on its own and records",
              "EXPLICIT — only when you explicitly request it",
            ],
          },
        },
      },
      advanced: {
        title: "Optional / advanced",
        body: "If you skipped client registration in the wizard or need a custom config, add OpenLog to your MCP client:",
        installers: "Or register clients with the CLI:",
        manualBody: "Most clients start the server automatically. To run it yourself for debugging:",
        manualFootnote:
          "That terminal is reserved for MCP protocol traffic. Without an override it connects to https://api.openlog.kr/api.",
        permissionsBody:
          "To review or change the local permission profile after setup:",
        colProfile: "Profile",
        colCapability: "Capabilities",
        permissionsFootnote:
          "Changes apply after the MCP server restarts. This is a local agent safety policy; OpenLog API authentication and ownership checks still apply.",
      },
      troubleshooting: {
        title: "If something fails",
        items: [
          {
            label: "npx not found",
            body: "install Node.js from https://nodejs.org/en/download (includes `npx`), then open a new terminal and try again.",
          },
          {
            label: "Not authenticated",
            body: "run `npx -y @openloghq/cli@latest login` again and complete browser approval.",
          },
          {
            label: "Client cannot find npx",
            body: "use the full path to npx in `command`, or install globally with `npm i -g @openloghq/cli` and point `command` at `openlog`.",
          },
          {
            label: "Setup incomplete",
            body: "run `npx -y @openloghq/cli@latest setup` and finish the wizard.",
          },
          {
            label: "Folder not initialized or binding is stale",
            body: "in that folder run `npx -y @openloghq/cli@latest init`. The agent will not guess a project when the binding is missing or stale.",
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
      "작업 중인 폴더에서 명령 하나만 실행하면 로그인, 에이전트 연결, 권한 설정, 폴더 init까지 이어서 끝나요.",
    sections: {
      setup: {
        title: "시작하기",
        prerequisiteBefore: "Node.js가 없다면",
        prerequisiteLink: "nodejs.org",
        prerequisiteAfter: "에서 먼저 설치해요.",
        body: "아래 명령을 프로젝트 폴더 터미널에 붙여넣은 뒤, 위저드 단계를 따라가면 돼요.",
        footnoteBefore: "setup만 다시 열려면",
        footnoteAfter: "을 실행하세요.",
        steps: {
          run: {
            title: "명령을 실행해요",
            body: "작업 중인 폴더에 붙여넣어요. 한 번에 setup과 폴더 연결까지 진행해요.",
          },
          signIn: {
            title: "브라우저에서 로그인해요",
            body: "확인 프롬프트에 동의한 뒤, 브라우저에서 기기 코드를 승인하고 터미널로 돌아와요.",
          },
          agents: {
            title: "에이전트를 등록해요",
            body: "Codex, Claude Code, Cursor 중 고르거나 전부 선택해요. CLI가 각 클라이언트의 MCP 설정을 써 줘요.",
          },
          permissions: {
            title: "권한 프로필을 골라요",
            body: "기본값은 safe-write예요. 조회·작성·발행은 되고 삭제 도구는 없어요.",
          },
          init: {
            title: "이 폴더를 연결해요",
            body: "폴더를 워크스페이스 프로젝트에 연결한 뒤 Capture Mode를 골라요.",
            bullets: [
              "ASK — 만들기·수정 전에 확인해요",
              "AUTO — 에이전트가 알아서 판단해서 남겨요",
              "EXPLICIT — 직접 요청할 때만 남겨요",
            ],
          },
        },
      },
      advanced: {
        title: "선택 / 고급",
        body: "위저드에서 클라이언트 연결을 건너뛰었거나 직접 설정하려면 MCP 클라이언트에 OpenLog를 추가하세요:",
        installers: "또는 CLI로 클라이언트를 등록하세요:",
        manualBody:
          "대부분의 클라이언트는 MCP 서버를 자동으로 실행해요. 디버깅할 때 직접 실행하려면:",
        manualFootnote:
          "MCP 서버가 실행되는 동안 이 터미널은 프로토콜 통신에만 사용해요. 따로 주소를 설정하지 않으면 https://api.openlog.kr/api에 연결해요.",
        permissionsBody: "setup 이후 로컬 권한을 확인하거나 바꾸려면:",
        colProfile: "프로필",
        colCapability: "사용할 수 있는 기능",
        permissionsFootnote:
          "MCP 서버를 다시 시작하면 바뀐 권한이 적용돼요. 이 설정은 에이전트가 쓸 수 있는 도구 범위를 정해요. OpenLog API의 인증과 소유권 검사는 별도로 계속 적용돼요.",
      },
      troubleshooting: {
        title: "안 될 때",
        items: [
          {
            label: "npx를 찾을 수 없어요",
            body: "https://nodejs.org/en/download 에서 Node.js를 설치하면 `npx`도 함께 들어와요. 설치 후 터미널을 새로 열고 다시 시도해 주세요.",
          },
          {
            label: "로그인이 풀렸어요",
            body: "`npx -y @openloghq/cli@latest login`을 다시 실행하고 브라우저에서 승인해 주세요.",
          },
          {
            label: "클라이언트에서 npx를 찾지 못해요",
            body: "`command`에 npx 전체 경로를 넣거나, `npm i -g @openloghq/cli`로 전역 설치한 뒤 `command`를 `openlog`로 바꿔 주세요.",
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
  setup:
    "npx -y @openloghq/cli@latest setup && npx -y @openloghq/cli@latest init",
  setupAgain: "npx -y @openloghq/cli@latest setup",
  init: "npx -y @openloghq/cli@latest init",
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
  return value === "en" ? "en" : "ko";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "ko"
    ? "/settings/mcp-guide"
    : "/settings/mcp-guide?lang=en";
}
