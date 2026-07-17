/**
 * Static CLI snapshots for step-by-step onboarding.
 * Text matches packages/openlog-cli output (80-col colors applied in the UI).
 */

export type McpSetupDemoLine =
  | { kind: "blank" }
  | { kind: "banner"; tagline: string }
  | { kind: "heading"; text: string }
  | { kind: "dim"; text: string }
  | { kind: "plain"; text: string }
  | { kind: "success"; text: string }
  | { kind: "kv"; key: string; value: string }
  | { kind: "choice"; text: string; default?: boolean }
  | { kind: "prompt"; text: string }
  | { kind: "box"; text: string }
  | { kind: "shell"; text: string };

export const MCP_SETUP_DEMO_COMMAND =
  "npx -y @openloghq/cli@latest setup && npx -y @openloghq/cli@latest init";

export const OPENLOG_BANNER_LOGO = [
  " ██████╗ ██████╗ ███████╗███╗   ██╗██╗      ██████╗  ██████╗ ",
  "██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║     ██╔═══██╗██╔════╝ ",
  "██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ███╗",
  "██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║   ██║",
  "╚██████╔╝██║     ███████╗██║ ╚████║███████╗╚██████╔╝╚██████╔╝",
  " ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ",
] as const;

export type McpSetupStepId =
  | "run"
  | "signIn"
  | "agents"
  | "permissions"
  | "init";

export const MCP_SETUP_STEP_SNAPSHOTS: Record<
  McpSetupStepId,
  McpSetupDemoLine[]
> = {
  run: [
    { kind: "shell", text: MCP_SETUP_DEMO_COMMAND },
  ],
  signIn: [
    { kind: "banner", tagline: "session log · cli" },
    { kind: "blank" },
    { kind: "heading", text: "Setup" },
    { kind: "dim", text: "Sign in, pick an agent, set MCP permissions." },
    { kind: "blank" },
    { kind: "dim", text: "Not signed in." },
    { kind: "prompt", text: "Sign in with the browser now? [Y/n] " },
    { kind: "blank" },
    { kind: "heading", text: "Authorize this terminal" },
    { kind: "blank" },
    { kind: "dim", text: "Approval code" },
    { kind: "box", text: "ABCD-1234" },
    { kind: "blank" },
    {
      kind: "kv",
      key: "URL",
      value: "https://openlog.kr/device?user_code=ABCD-1234",
    },
    { kind: "blank" },
    { kind: "dim", text: "Opened the approval page in your browser." },
    {
      kind: "success",
      text: "Login successful. You can return to the terminal.",
    },
  ],
  agents: [
    { kind: "heading", text: "Which agent should use OpenLog MCP?" },
    {
      kind: "choice",
      text: "1) All agents (Codex, Claude Code, Cursor)",
      default: true,
    },
    { kind: "choice", text: "2) Codex" },
    { kind: "choice", text: "3) Claude Code" },
    { kind: "choice", text: "4) Cursor" },
    { kind: "choice", text: "5) Skip for now" },
    { kind: "prompt", text: "> " },
    { kind: "blank" },
    { kind: "plain", text: "OpenLog MCP server registered with Codex." },
    {
      kind: "plain",
      text: "OpenLog MCP server registered with Claude Code.",
    },
    {
      kind: "plain",
      text: "OpenLog MCP server added to ~/.cursor/mcp.json.",
    },
  ],
  permissions: [
    { kind: "kv", key: "Current profile", value: "safe-write" },
    { kind: "heading", text: "MCP permission profile" },
    {
      kind: "choice",
      text: "1) safe-write — read, write, publish (recommended)",
      default: true,
    },
    { kind: "choice", text: "2) read-only — read tools only" },
    { kind: "choice", text: "3) full — includes deletes" },
    { kind: "choice", text: "4) Keep current profile" },
    { kind: "prompt", text: "> " },
    { kind: "success", text: "Permissions set to safe-write." },
    { kind: "blank" },
    { kind: "success", text: "Setup complete." },
  ],
  init: [
    { kind: "banner", tagline: "project init · cli" },
    { kind: "blank" },
    { kind: "heading", text: "Project init" },
    { kind: "success", text: "Folder inspected." },
    { kind: "kv", key: "Folder", value: "/Users/you/notes-app" },
    { kind: "kv", key: "Type", value: "Git repository" },
    { kind: "kv", key: "Repository", value: "you/notes-app" },
    { kind: "blank" },
    {
      kind: "prompt",
      text: "Connect this folder to an OpenLog project? [Y/n] ",
    },
    { kind: "blank" },
    {
      kind: "heading",
      text: "Connect this project to which workspace?",
    },
    { kind: "choice", text: "1) Personal (you)", default: true },
    { kind: "prompt", text: "> " },
    { kind: "blank" },
    {
      kind: "heading",
      text: "Create a project or connect this folder to an existing one?",
    },
    {
      kind: "choice",
      text: "1) Create a new project named notes-app",
      default: true,
    },
    { kind: "prompt", text: "> " },
    { kind: "blank" },
    {
      kind: "heading",
      text: "How should the agent capture Task, Log, and Output drafts?",
    },
    {
      kind: "choice",
      text: "1) ASK — ask before creating or updating (recommended)",
      default: true,
    },
    {
      kind: "choice",
      text: "2) AUTO — act automatically when the Guide says it matters",
    },
    {
      kind: "choice",
      text: "3) EXPLICIT — act only when you explicitly request it",
    },
    { kind: "prompt", text: "> " },
    { kind: "blank" },
    { kind: "success", text: "Project connected to OpenLog." },
    { kind: "kv", key: "Workspace", value: "Personal" },
    { kind: "kv", key: "Capture mode", value: "ASK" },
  ],
};

export const MCP_SETUP_STEP_ORDER: McpSetupStepId[] = [
  "run",
  "signIn",
  "agents",
  "permissions",
  "init",
];
