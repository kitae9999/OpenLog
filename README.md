# OpenLog

[English](./README.md) | [한국어](./README.ko.md)

**Keep the context behind the code, then turn it into durable knowledge.**

[OpenLog](https://openlog.kr) is a developer workspace and collaborative publishing platform. It connects the context produced while you work with an AI coding agent—tasks, logs, decisions, memories, and outputs—and carries that context into technical writing that others can review and improve.

OpenLog v1.0.0 is the first official release of the renewed workspace experience.

## Why OpenLog

The useful story behind a change is usually scattered across chat history, terminal output, issue trackers, and short-lived notes. By the time a post or document is written, much of the reasoning has already disappeared.

OpenLog keeps that context close to the work:

- an agent can continuously update what is being worked on and what remains open;
- tasks, logs, todos, memories, and outputs stay connected inside one workspace;
- activity and graph views make the history and relationships visible;
- finished outputs can become Markdown posts;
- readers can propose improvements through a pull-request-like suggestion flow.

## Core workflow

1. Connect the hosted OpenLog MCP server to your coding agent.
2. Work normally while the agent updates the workspace working brief.
3. Capture implementation logs, decisions, fixes, and reusable memories.
4. Connect related tasks, logs, memories, and outputs in the graph.
5. Turn the accumulated context into an output and publish it.
6. Review suggestions and keep the published knowledge current.

## Features

### Agent-aware workspace

- **Now Working** summarizes the latest branch, task, completed work, open questions, and next step.
- **Tasks and Todos** keep planned and in-progress work visible.
- **Logs** capture development notes by type, including decisions, issues, fixes, and general progress.
- **Memory** preserves reusable context independently or from an existing log.
- **Outputs** assemble workspace material into publishable Markdown.

### Activity and knowledge graph

- A GitHub-style activity view shows the last year of log activity with daily drill-down.
- Planner and dashboard views make current work and monthly progress easy to scan.
- The graph connects tasks, logs, memories, and outputs, including manually created cross-type links.

### Collaborative publishing

- Markdown writing and preview
- Public profiles and authored posts
- Feed-based discovery and follows
- Post suggestions, discussion, comments, likes, and contributor history
- Related-post links and public knowledge graph navigation

### Durable authentication

- Browser sessions use short-lived access tokens with rotating refresh sessions.
- Remote MCP uses OAuth without storing an account password or OpenLog token in the agent configuration.

## Get started

Open [openlog.kr](https://openlog.kr), sign in, and create a workspace.

### Remote MCP (recommended)

New connections use the hosted Streamable HTTP endpoint at
`https://api.openlog.kr/mcp`. No local OpenLog CLI or MCP server is required.
Use the [OpenLog Agent Guide](https://openlog.kr/settings/mcp-guide) to inspect,
change, or revoke connected agents and their permissions.

#### Codex CLI

```bash
codex mcp add openlog --url https://api.openlog.kr/mcp
codex mcp login openlog
```

#### Claude Code

```bash
claude mcp add --transport http --scope user openlog https://api.openlog.kr/mcp
claude mcp login openlog
```

#### Cursor

Use [Add to Cursor](https://cursor.com/install-mcp?name=openlog&config=eyJ1cmwiOiJodHRwczovL2FwaS5vcGVubG9nLmtyL21jcCJ9)
or register the endpoint directly:

```json
{
  "mcpServers": {
    "openlog": {
      "url": "https://api.openlog.kr/mcp"
    }
  }
}
```

The first connection opens a browser for OpenLog sign-in and consent. OAuth
connections default to `safe-write`; select `full` explicitly only when delete
tools are required.

`start_openlog_session` begins without a local path. It starts immediately for
a single project or returns the project list so the agent can ask the user when
there are multiple choices. Remote v1 does not inspect local paths and does not
expose `upload_post_image(filePath)`.

The MCP server sends its built-in session instructions in Korean. Workspace
Agent Guides and per-project Capture Mode (`AUTO`, `ASK`, or `EXPLICIT`) are
stored on the server and loaded when a session starts. `ASK` is the default
Capture Mode.

### Legacy local CLI (compatibility)

The stdio CLI, device login, and local project binding remain available for one
compatibility release. New users should connect through remote MCP.

The official CLI requires Node.js 20 or later.

Run the guided setup for your first connection:

```bash
npx -y @openloghq/cli@latest
```

The interactive wizard signs you in, registers OpenLog MCP with Codex, Claude
Code, Cursor, or all supported clients, and lets you choose a local MCP
permission profile. Setup does not inspect or connect the current directory, and
agents can discover OpenLog projects without a local folder after setup. You can
run the wizard again at any time:

```bash
npx -y @openloghq/cli@latest setup
```

Optionally connect any local folder for automatic path-based identification:

```bash
cd <folder>
npx -y @openloghq/cli@latest init
```

`openlog init` shows whether the current folder is a Git repository or a general
folder, asks whether to connect it, and lets you choose a workspace, an existing
or new project, and Capture Mode. Git repositories store `openlog.projectId` in
local `.git/config`; general folders store a versioned ID in
`.openlog/project.json`. A session started from a descendant resolves the nearest
general-folder binding. OpenLog does not inspect folder contents.

Without a local path, `start_openlog_session` automatically starts only when the
account has exactly one project. It returns a project list when there are
multiple choices so the agent can ask the user. `create_workspace_project` can
create and start a project without creating a directory; `openlog init` can bind
a folder to that project later.

The MCP server sends its built-in session instructions in Korean. Tool names,
input fields, Capture Mode values, and response status values remain unchanged.
Workspace Agent Guides are managed separately as workspace-owned Markdown.

The workspace Agent Guide is an editable English Markdown SSOT. The MCP server
loads its latest revision at the start of each project session. Capture Mode is
stored per project:

| Mode       | Agent behavior for Task, Log, and Output create/update            |
| ---------- | ----------------------------------------------------------------- |
| `AUTO`     | May act when the Workspace Guide says the work is worth recording |
| `ASK`      | Asks before acting; this is the default                           |
| `EXPLICIT` | Acts only after an explicit user request                          |

Publishing and deletion retain their separate confirmation rules. The local MCP
permission profile always takes precedence over Capture Mode.

For non-interactive shells or manual setup, run the individual commands:

```bash
npx -y @openloghq/cli@latest login
npx -y @openloghq/cli@latest whoami
npx -y @openloghq/cli@latest mcp
```

- `openlog login` starts device login and opens the approval page in your browser.
- `openlog whoami` shows the locally authenticated account.
- `openlog logout` removes the local OpenLog session.
- `openlog init` connects the current folder and loads its Agent Guide.
- `openlog mcp` starts the stdio MCP server.

You can also install the CLI globally:

```bash
npm install -g @openloghq/cli
openlog
```

### Legacy local MCP client configuration

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

Automatic registration is available for supported clients:

```bash
openlog mcp install all
openlog mcp install codex
openlog mcp install claude-code
openlog mcp install cursor
```

`all` registers Codex, Claude Code, and Cursor in sequence. Cursor registration
updates the global `~/.cursor/mcp.json` while preserving existing MCP servers.

### Local MCP permissions

OpenLog registers MCP tools from a local permission profile:

```bash
openlog mcp permissions
openlog mcp permissions set read-only
openlog mcp permissions set safe-write
openlog mcp permissions set full
openlog mcp permissions reset
```

| Profile      | Capabilities                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| `read-only`  | Authentication and read tools                                                |
| `safe-write` | Read, create, update, link, upload, and confirmed publish tools              |
| `full`       | `safe-write` plus immediate single-item delete and working-brief clear tools |

`safe-write` is the default. Restart or reload the MCP server after changing the profile. This profile is a local agent safety policy; the API still enforces the authenticated user's server-side access.

### MCP tools

| Area                    | Tools                                                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions and account | `get_mcp_permissions`, `get_auth_status`, `get_me`, `list_my_notifications`, `list_my_posts`, `list_my_liked_posts`                                                                                                                                   |
| Posts                   | `list_my_posts`, `get_my_post`, `create_post_draft`, `update_post`, `publish_post`, `unpublish_post`, `get_post_detail`                                                                                                                               |
| Workspace and activity  | `start_openlog_session`, `list_workspaces`, `get_workspace`, `get_workspace_project`, `create_workspace_project`, `get_workspace_agent_guide`, `get_working_brief`, `push_working_brief`, `get_workspace_activity`, `get_workspace_activity_day_logs` |
| Agent Guide             | `update_workspace_agent_guide`                                                                                                                                                                                                                        |
| Capture Mode            | `update_workspace_project_capture_mode`                                                                                                                                                                                                               |
| Tasks and logs          | `list_workspace_tasks`, `get_workspace_task`, `create_workspace_task`, `update_workspace_task`, and the matching workspace-log tools                                                                                                                  |
| Todos and memories      | Todo list/create/done tools and memory list/get/create/from-log/update tools                                                                                                                                                                          |
| Outputs                 | `list_workspace_outputs`, `get_workspace_output`, `create_workspace_output`, `update_workspace_output`, `create_post_draft_from_output`                                                                                                               |
| Graph links             | `list_workspace_links` and task/log/cross-link create tools                                                                                                                                                                                           |
| Full-profile deletes    | Working-brief clear and individual task/log/todo/memory/output/link delete tools                                                                                                                                                                      |

`create_workspace_project`, `create_post_draft_from_output`, `publish_post`, `unpublish_post`, `update_workspace_agent_guide`, and `update_workspace_project_capture_mode` return a preview by default. Applying the write requires `confirm: true`, or `skipConfirmation: true` when the user has explicitly requested the write without another confirmation.

## Repository structure

```text
backend/                Spring Boot API and database migrations
frontend/               Next.js web application and Playwright tests
packages/openlog-cli/   Remote MCP server and compatibility CLI
deploy/                 Production deployment assets
```

## Copyright and repository use

Copyright © 2026 OpenLog. All rights reserved.

This repository is publicly available for portfolio and technical review purposes, but it is not open source. Except as permitted by the GitHub Terms of Service or applicable law, you may not use, copy, modify, redistribute, or commercially exploit any code or documentation without prior written permission. Public availability does not waive any copyright or grant any additional license.

## Contributions

OpenLog is not currently accepting external code contributions. Bug reports and feature suggestions submitted through Issues are welcome. Pull requests opened without prior discussion may not be merged. A contribution policy and Contributor License Agreement (CLA) may be provided in the future.

## Release

See [OpenLog releases](https://github.com/kitae9999/OpenLog/releases) for release notes and version history.
