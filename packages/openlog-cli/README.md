# OpenLog CLI

Official CLI and MCP server for OpenLog.

```bash
npx -y @openloghq/cli@latest
npx -y @openloghq/cli@latest setup
npx -y @openloghq/cli@latest init
npx -y @openloghq/cli@latest login
npx -y @openloghq/cli@latest whoami
npx -y @openloghq/cli@latest mcp
```

## Guided setup

Running `openlog` or `openlog setup` in a TTY walks through:

1. Sign in (browser device login) if needed
2. Install MCP into Codex, Claude Code, Cursor, all of them, or skip
3. Choose an MCP permission profile

Setup never inspects or connects the current directory. Non-interactive shells
should use the individual commands instead.

## Project init

Run init separately from every Git project you want OpenLog agents to use:

```bash
cd <project>
npx -y @openloghq/cli@latest init
```

The interactive flow finds the Git root, checks a local or repository binding,
asks for a workspace and Capture Mode, and writes `openlog.projectId` to the
repository's local `.git/config`. Git is required; an origin remote is not. No
tracked OpenLog config or agent-instruction file is created.

One workspace may contain multiple repository or local Git projects. A user's
same normalized repository can be connected only once. If the server connection
is created but writing `.git/config` fails, init rolls the new connection back.

Each workspace owns one editable English Markdown Agent Guide. The MCP server's
`start_openlog_session` and `get_workspace_agent_guide` tools return the latest
Guide revision. `update_workspace_agent_guide` replaces Guide content after a
preview confirmation (`confirm: true`, or `skipConfirmation: true` when the user
explicitly asked to skip). Use the Guide for durable agent behavior and recording
policy; keep one-off knowledge in NOTE Logs.

The project Capture Mode returned with the session:

- `AUTO`: create or update Task, Log, and Output drafts when the Guide says the work matters
- `ASK`: ask before those writes; this is the default
- `EXPLICIT`: perform those writes only after an explicit request

Capture Mode is model guidance, not a server authorization boundary. MCP
permissions take precedence, and publishing, Agent Guide updates, or deletion
keep their own confirmation policy.

## Human-facing output

`help`, `setup`, `login`, `whoami`, and `mcp permissions` use a session-log skin
(ASCII logo, quiet ANSI when the terminal supports color). MCP `serve` stays
plain stdio JSON-RPC.

```text
 ██████╗ ██████╗ ███████╗███╗   ██╗██╗      ██████╗  ██████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║     ██╔═══██╗██╔════╝
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ███╗
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║   ██║
╚██████╔╝██║     ███████╗██║ ╚████║███████╗╚██████╔╝╚██████╔╝
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝
session log · cli

Usage
  openlog login              Sign in from the terminal
  ...
```

Interactive terminals use the human-readable `whoami` view. Pipes and scripts
keep the machine-readable `/auth/me` JSON; pass `--json` or `--human` to select
the output explicitly. Set `NO_COLOR=1` to disable ANSI styling.

## Local MCP permissions

```bash
openlog mcp permissions
openlog mcp permissions set read-only
openlog mcp permissions set safe-write
openlog mcp permissions set full
openlog mcp permissions reset
```

`safe-write` is the default. Permission changes apply after the MCP server is restarted or reloaded.

MCP tool groups:

- Account and posts: authentication, notifications, authored/liked posts, image upload, post detail, and confirmed publishing
- Workspace context: project session start, workspace discovery, activity, working brief, tasks, logs, todos, memories, outputs, and graph links
- Safe writes: create/update, todo completion, link creation, image upload, and confirmed output/post publishing
- Full-only writes: individual workspace-document/link deletes and working-brief clear

MCP client configuration:

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

Register every supported local client, or choose one:

```bash
openlog mcp install all
openlog mcp install codex
openlog mcp install claude-code
openlog mcp install cursor
```

Cursor registration updates the global `~/.cursor/mcp.json` while preserving
existing MCP servers.

Set `OPENLOG_API_BASE_URL` to point at a non-production API. Set
`OPENLOG_WEB_BASE_URL` to control absolute post URLs returned by `publish_post`.
Set `OPENLOG_MCP_CONFIG_FILE` to replace the default
`~/.openlog/mcp-config.json` permission file.
