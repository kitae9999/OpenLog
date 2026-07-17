# OpenLog CLI

Official OpenLog remote MCP service and compatibility CLI.

## Remote MCP (recommended)

New connections use the hosted Streamable HTTP endpoint. No local OpenLog CLI
or MCP server is required.

```json
{
  "mcpServers": {
    "openlog": {
      "type": "http",
      "url": "https://api.openlog.kr/mcp"
    }
  }
}
```

Codex CLI before the public plugin is approved:

```bash
codex mcp add openlog --url https://api.openlog.kr/mcp --oauth-resource https://api.openlog.kr/mcp
codex mcp login openlog
```

Claude Code before the public marketplace plugin is approved:

```bash
claude mcp add --transport http --scope user openlog https://api.openlog.kr/mcp
```

OAuth connections default to `safe-write`. Choose `full` explicitly to expose
delete tools. Remote v1 does not inspect local paths and does not expose
`upload_post_image(filePath)`.

## Legacy stdio compatibility (2.1 only)

The local stdio CLI remains available for this compatibility release and prints
a deprecation notice when it starts. It will be removed with device login,
local project binding, and stdio installation commands in the next release.

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

Setup never inspects or connects the current directory. After setup, an agent
can discover OpenLog projects without a local folder. Non-interactive shells
should use the individual commands instead.

## Project init

Run init inside any local folder you want OpenLog agents to identify automatically:

```bash
cd <folder>
npx -y @openloghq/cli@latest init
```

The interactive flow shows the detected folder type and asks whether to connect
it. Git repositories keep `openlog.projectId` in local `.git/config`. General
folders use `.openlog/project.json` with a versioned project ID. A session
started from a descendant of a general folder resolves the nearest parent
binding. OpenLog does not inspect the folder contents.

Init can create a new OpenLog project or bind the folder to an existing project
in the selected workspace. One workspace may contain Git, general-folder, and
directory-free projects. A user's same normalized repository can be connected
only once. If the server project is created but writing the local binding fails,
init rolls the new project back.

`start_openlog_session` accepts a local `projectPath`, an explicit `projectId`,
or no selector. With no selector it starts automatically only when exactly one
project exists. With multiple projects it returns `selection_required` so the
agent asks the user and retries with the selected ID. With no projects, agents
with write permission can preview and confirm `create_workspace_project`; this
does not require or create a local directory.

The MCP server sends its built-in session instructions in Korean. Tool names,
input fields, Capture Mode values, and response status values use the server API contract.
Workspace Agent Guides are managed separately as workspace-owned Markdown.

## Post lifecycle tools (2.0)

Post creation now starts with a server draft. Use `create_post_draft`,
`get_my_post`, and `update_post` for draft work, then call the ID-based
`publish_post` after preview confirmation. `unpublish_post` hides a published
Post without deleting comments, likes, or suggestions. Converting an Output is
handled by `create_post_draft_from_output`; the source Output becomes read-only
and the new Post draft is edited independently.

Each workspace owns one editable English Markdown Agent Guide. The MCP server's
`start_openlog_session` and `get_workspace_agent_guide` tools return the latest
Guide revision. `update_workspace_agent_guide` replaces Guide content after a
preview confirmation (`confirm: true`, or `skipConfirmation: true` when the user
explicitly asked to skip). Use the Guide for durable agent behavior and recording
policy; keep one-off knowledge in NOTE Logs.

`get_workspace_project` returns the connected project's Capture Mode.
`update_workspace_project_capture_mode` changes it after the same preview
confirmation pattern. After a confirmed change, re-read the project or call
`start_openlog_session` again so the new mode applies in the session.

The project Capture Mode returned with the session:

- `AUTO`: create or update Task, Log, and Output drafts when the Guide says the work matters
- `ASK`: ask before those writes; this is the default
- `EXPLICIT`: perform those writes only after an explicit request

Capture Mode is model guidance, not a server authorization boundary. MCP
permissions take precedence, and publishing, Agent Guide updates, Capture Mode
updates, or deletion keep their own confirmation policy.

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

- Account and posts: authentication, notifications, authored/liked posts, image upload, Post drafts, and confirmed publish/unpublish
- Workspace context: project session start, workspace and project discovery, activity, working brief, tasks, logs, todos, memories, outputs, and graph links
- Project creation: confirmed `create_workspace_project` without a required local directory
- Safe writes: create/update, todo completion, link creation, image upload, confirmed Output conversion, and Post publish/unpublish
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
