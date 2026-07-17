export type McpGuideLocale = "en" | "ko";

export const MCP_GUIDE_LOCALES: Array<{ key: McpGuideLocale; label: string }> =
  [
    { key: "en", label: "ENG" },
    { key: "ko", label: "KOR" },
  ];

export const remoteMcpGuideCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "Remote MCP",
    title: "Remote MCP",
    subtitle:
      "Connect agents with OAuth — no local install. Only the tools allowed for each connection are exposed.",
    agents: {
      title: "Connect an agent",
      cursor: {
        status: "Ready to connect",
        description:
          "Opens the Cursor install confirmation screen, then continues to OAuth approval.",
        action: "Open in Cursor",
      },
      codex: {
        status: "Plugin pending review",
        description:
          "Until the public plugin is approved, register with these commands and start OAuth.",
        action: "Copy command",
      },
      claude: {
        status: "Marketplace pending review",
        description:
          "Until the official marketplace listing is approved, use a user-scoped remote MCP command.",
        action: "Copy command",
      },
      terminalHint:
        "Confirm the Codex CLI or Claude Code CLI is already installed (`codex --version` / `claude --version`), then paste the copied command into your terminal.",
      terminalTitle: "zsh — ~/project",
    },
    connections: {
      title: "Connected agents",
      signedOut:
        "Sign in to manage connected agents and their current permissions.",
      login: "Sign in to OpenLog",
      empty:
        "No agents connected yet. Connect one above and it will show up here.",
      connectedOn: "Connected",
      permissionAria: "Permissions for",
      fullOption: "full · deletes allowed",
      update: "Update",
      revoke: "Disconnect",
    },
    permissions: {
      title: "Permission profiles",
      readOnly: "Read tools only.",
      safeWrite:
        "Default. Create, update, and publish — delete tools never appear.",
      full: "Allows delete tools. Must be chosen explicitly on the consent screen.",
      footnote:
        "Permission changes and disconnects apply on the next MCP request.",
    },
    manual: {
      title: "Manual setup",
      footnote:
        "The legacy stdio CLI is supported through this compatibility window only. New connections should use remote MCP. Local path discovery and filePath image uploads are not in remote v1.",
    },
  },
  ko: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "Remote MCP",
    title: "Remote MCP",
    subtitle:
      "로컬에 따로 설치하지 않고도 에이전트를 OAuth로 연결해요. 각 연결에 허용된 OpenLog 도구만 보여줘요.",
    agents: {
      title: "에이전트 연결",
      cursor: {
        status: "바로 연결 가능",
        description:
          "Cursor 설치 확인 화면이 열린 뒤 OAuth 승인으로 이어져요.",
        action: "Cursor에서 열기",
      },
      codex: {
        status: "플러그인 심사 전",
        description:
          "공개 플러그인이 승인되기 전에는 명령으로 등록하고 OAuth를 시작해요.",
        action: "명령 복사",
      },
      claude: {
        status: "마켓 심사 전",
        description:
          "공식 마켓에 올라가기 전에는 사용자 범위 원격 MCP 명령을 사용해요.",
        action: "명령 복사",
      },
      terminalHint:
        "먼저 Codex CLI나 Claude Code CLI가 설치돼 있는지 확인해요 (`codex --version` / `claude --version`). 그다음 복사한 명령을 터미널에 붙여넣어요.",
      terminalTitle: "zsh — ~/project",
    },
    connections: {
      title: "연결된 에이전트",
      signedOut:
        "로그인하면 연결된 에이전트와 현재 권한을 관리할 수 있어요.",
      login: "OpenLog 로그인",
      empty:
        "아직 연결된 에이전트가 없어요. 위에서 연결하면 여기에 보여요.",
      connectedOn: "연결일",
      permissionAria: "권한",
      fullOption: "full · delete 허용",
      update: "변경",
      revoke: "연결 해지",
    },
    permissions: {
      title: "권한 프로필",
      readOnly: "조회 도구만 보여줘요.",
      safeWrite:
        "기본값이에요. 삭제 도구는 목록에도 나오지 않아요.",
      full: "삭제 도구까지 허용해요. 승인 화면에서 직접 골라야 해요.",
      footnote:
        "권한을 바꾸거나 연결을 끊으면 다음 MCP 요청부터 바로 반영돼요.",
    },
    manual: {
      title: "직접 설정",
      footnote:
        "기존 stdio CLI는 이번 호환 버전까지만 유지해요. 새로 연결할 때는 원격 MCP를 쓰고, 로컬 경로 탐색과 filePath 이미지 업로드는 원격 v1에 없어요.",
    },
  },
} as const;

export function parseMcpGuideLocale(value: string | null): McpGuideLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "en"
    ? "/settings/mcp-guide"
    : "/settings/mcp-guide?lang=ko";
}
