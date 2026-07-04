export type McpGuideLocale = "en" | "ko";

export const MCP_GUIDE_LOCALES: Array<{ key: McpGuideLocale; label: string }> = [
  { key: "en", label: "ENG" },
  { key: "ko", label: "KOR" },
];

export const mcpGuideCopyButtonLabels = {
  en: { copy: "Copy", copied: "Copied", retry: "Retry", aria: "Copy code" },
  ko: { copy: "복사", copied: "복사됨", retry: "다시", aria: "코드 복사" },
} as const;

export const mcpGuideTools = [
  {
    name: "get_auth_status",
    description: {
      en: "Check whether the local CLI is authenticated.",
      ko: "로컬 CLI 로그인 상태를 확인합니다.",
    },
  },
  {
    name: "get_me",
    description: {
      en: "Return the currently authenticated OpenLog user.",
      ko: "현재 로그인한 OpenLog 사용자 정보를 반환합니다.",
    },
  },
  {
    name: "list_my_notifications",
    description: {
      en: "Return notifications for the authenticated user.",
      ko: "로그인한 사용자의 알림 목록을 반환합니다.",
    },
  },
  {
    name: "list_my_posts",
    description: {
      en: "Return posts authored by the authenticated user.",
      ko: "내가 작성한 글 목록을 반환합니다.",
    },
  },
  {
    name: "list_my_liked_posts",
    description: {
      en: "Return posts liked by the authenticated user.",
      ko: "내가 좋아요한 글 목록을 반환합니다.",
    },
  },
  {
    name: "get_post_detail",
    description: {
      en: "Return a public post by author username and slug.",
      ko: "작성자 username과 slug로 공개 글 상세를 조회합니다.",
    },
  },
  {
    name: "upload_post_image",
    description: {
      en: "Upload a local image as WebP and return markdown for post content.",
      ko: "로컬 이미지를 WebP로 변환·업로드하고 본문용 markdown을 반환합니다.",
    },
  },
  {
    name: "publish_post",
    description: {
      en: "Publish a new post. Returns a preview unless confirm: true or skipConfirmation: true is set.",
      ko: "새 글을 발행합니다. confirm: true 또는 skipConfirmation: true 없이는 미리보기만 반환합니다.",
    },
  },
] as const;

export const mcpGuideCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "MCP Guide",
    title: "MCP Guide",
    subtitle:
      "Connect Claude Code, Codex, or any MCP client to OpenLog. The CLI stores your login locally; the MCP server exposes tools over stdio so agents can read workspace data and publish posts.",
    sections: {
      login: {
        title: "1. Log in with the CLI",
        body: "MCP tools require a local OpenLog session. Run device login once in your terminal and approve the request in the browser.",
        footnoteBefore: "Verify with",
        footnoteAfter:
          ". The sidebar footer shows MCP connected when a client is linked.",
        mcpConnected: "MCP connected",
      },
      register: {
        title: "2. Register the MCP server",
        body: "Add OpenLog to your MCP client configuration:",
        installers: "Or use the built-in installers:",
      },
      manual: {
        title: "3. Start the server (manual)",
        body: "Most clients launch the server automatically. To run it yourself for debugging:",
        footnote:
          "The terminal is reserved for MCP protocol traffic once the server is running.",
      },
      tools: {
        title: "4. Available tools",
        colTool: "Tool",
        colDescription: "Description",
        footnoteBefore: "returns a preview first. Pass",
        footnoteAfter: "to publish after review.",
      },
      local: {
        title: "5. Local development",
        body: "Point the CLI at a local API and web origin:",
        envApi: "API base URL the CLI and MCP call.",
        envWeb: "Web origin used in publish_post response URLs.",
        envAuthBefore: "Optional path instead of default",
        envAuthAfter: ".",
      },
      troubleshooting: {
        title: "6. Troubleshooting",
        items: [
          {
            label: "Not authenticated",
            body: "run `openlog login` again and complete browser approval.",
          },
          {
            label: "Client cannot find npx",
            body: "use the full path to npx in `command` or install globally: `npm i -g @kitae9999/openlog-cli`.",
          },
          {
            label: "Onboarding incomplete",
            body: "finish profile setup before listing or publishing posts.",
          },
        ],
      },
    },
    footerPackage: "Package:",
  },
  ko: {
    breadcrumbSettings: "설정",
    breadcrumbCurrent: "MCP 가이드",
    title: "MCP 가이드",
    subtitle:
      "Claude Code, Codex 등 MCP client를 OpenLog에 연결하는 방법입니다. CLI가 로그인 정보를 로컬에 저장하고, MCP server가 stdio로 tool을 노출해 agent가 워크스페이스 데이터를 읽고 글을 발행할 수 있습니다.",
    sections: {
      login: {
        title: "1. CLI로 로그인",
        body: "MCP tool을 쓰려면 로컬 OpenLog 세션이 필요합니다. 터미널에서 device login을 한 번 실행하고 브라우저에서 승인하세요.",
        footnoteBefore: "확인:",
        footnoteAfter:
          ". client가 연결되면 사이드바 하단에 MCP connected가 표시됩니다.",
        mcpConnected: "MCP connected",
      },
      register: {
        title: "2. MCP server 등록",
        body: "MCP client 설정에 OpenLog를 추가합니다:",
        installers: "또는 내장 installer를 사용합니다:",
      },
      manual: {
        title: "3. server 수동 실행",
        body: "대부분의 client가 server를 자동으로 띄웁니다. 디버깅용으로 직접 실행하려면:",
        footnote: "server가 실행 중이면 해당 터미널은 MCP 프로토콜 전용입니다.",
      },
      tools: {
        title: "4. 사용 가능한 tool",
        colTool: "Tool",
        colDescription: "설명",
        footnoteBefore: "는 먼저 미리보기를 반환합니다. 검토 후",
        footnoteAfter: "로 발행하세요.",
      },
      local: {
        title: "5. 로컬 개발",
        body: "로컬 API와 web origin을 지정합니다:",
        envApi: "CLI와 MCP가 호출하는 API base URL.",
        envWeb: "publish_post 응답 URL에 쓰는 web origin.",
        envAuthBefore: "기본",
        envAuthAfter: " 대신 쓸 인증 파일 경로(선택).",
      },
      troubleshooting: {
        title: "6. 문제 해결",
        items: [
          {
            label: "인증되지 않음",
            body: "`openlog login`을 다시 실행하고 브라우저 승인을 완료하세요.",
          },
          {
            label: "client가 npx를 찾지 못함",
            body: "`command`에 npx 전체 경로를 넣거나 `npm i -g @kitae9999/openlog-cli`로 전역 설치하세요.",
          },
          {
            label: "온보딩 미완료",
            body: "글 목록 조회·발행 전에 프로필 설정을 마치세요.",
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
      "args": ["-y", "@kitae9999/openlog-cli", "mcp"]
    }
  }
}`;

export const mcpGuideCommands = {
  login: "npx -y @kitae9999/openlog-cli login",
  mcp: "npx -y @kitae9999/openlog-cli mcp",
  installCodex: "openlog mcp install codex",
  installClaude: "openlog mcp install claude-code",
  localDev: `OPENLOG_API_BASE_URL=http://localhost:8080/api \\
OPENLOG_WEB_BASE_URL=http://localhost:3030 \\
npx -y @kitae9999/openlog-cli mcp`,
} as const;

export function parseMcpGuideLocale(value: string | null): McpGuideLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildMcpGuideHref(locale: McpGuideLocale) {
  return locale === "en" ? "/settings/mcp-guide" : "/settings/mcp-guide?lang=ko";
}
