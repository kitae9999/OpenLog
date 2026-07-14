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

1. Connect the OpenLog CLI and MCP server to your coding agent.
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
- CLI device login keeps MCP clients authenticated without embedding account credentials in agent configuration.

## Get started

Open [openlog.kr](https://openlog.kr), sign in, and create a workspace.

### CLI

The official CLI requires Node.js 20 or later.

Run the guided setup for your first connection:

```bash
npx -y @openloghq/cli
```

The interactive wizard signs you in, registers OpenLog MCP with Codex, Claude
Code, Cursor, or all supported clients, and lets you choose a local MCP
permission profile. You can run the wizard again at any time:

```bash
npx -y @openloghq/cli setup
```

For non-interactive shells or manual setup, run the individual commands:

```bash
npx -y @openloghq/cli login
npx -y @openloghq/cli whoami
npx -y @openloghq/cli mcp
```

- `openlog login` starts device login and opens the approval page in your browser.
- `openlog whoami` shows the locally authenticated account.
- `openlog logout` removes the local OpenLog session.
- `openlog mcp` starts the stdio MCP server.

You can also install the CLI globally:

```bash
npm install -g @openloghq/cli
openlog
```

### MCP client configuration

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@openloghq/cli", "mcp"]
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

| Profile | Capabilities |
| --- | --- |
| `read-only` | Authentication and read tools |
| `safe-write` | Read, create, update, link, upload, and confirmed publish tools |
| `full` | `safe-write` plus immediate single-item delete and working-brief clear tools |

`safe-write` is the default. Restart or reload the MCP server after changing the profile. This profile is a local agent safety policy; the API still enforces the authenticated user's server-side access.

### MCP tools

| Area | Tools |
| --- | --- |
| Permissions and account | `get_mcp_permissions`, `get_auth_status`, `get_me`, `list_my_notifications`, `list_my_posts`, `list_my_liked_posts` |
| Public posts | `get_post_detail`, `upload_post_image`, `publish_post` |
| Workspace and activity | `list_workspaces`, `get_workspace`, `get_working_brief`, `push_working_brief`, `get_workspace_activity`, `get_workspace_activity_day_logs` |
| Tasks and logs | `list_workspace_tasks`, `get_workspace_task`, `create_workspace_task`, `update_workspace_task`, and the matching workspace-log tools |
| Todos and memories | Todo list/create/done tools and memory list/get/create/from-log/update tools |
| Outputs | `list_workspace_outputs`, `get_workspace_output`, `create_workspace_output`, `update_workspace_output`, `publish_workspace_output` |
| Graph links | `list_workspace_links` and task/log/cross-link create tools |
| Full-profile deletes | Working-brief clear and individual task/log/todo/memory/output/link delete tools |

`publish_post` and `publish_workspace_output` return a preview by default. Publishing requires `confirm: true`, or `skipConfirmation: true` when the user has explicitly requested publishing without another confirmation.

### Connect to a local server

```bash
OPENLOG_API_BASE_URL=http://localhost:8080/api \
OPENLOG_WEB_BASE_URL=http://localhost:3030 \
npx -y @openloghq/cli mcp
```

- `OPENLOG_API_BASE_URL`: API base URL used by the CLI and MCP server
- `OPENLOG_WEB_BASE_URL`: web base URL used in published-post responses
- `OPENLOG_AUTH_FILE`: optional path replacing the default `~/.openlog/auth.json`
- `OPENLOG_MCP_CONFIG_FILE`: optional path replacing the default `~/.openlog/mcp-config.json`

## Development

### Requirements

- Java 21
- Node.js 20+
- pnpm 10
- Docker for the local infrastructure

### Run locally

```bash
docker compose up -d
./gradlew :backend:bootRunLocal
```

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend runs at `http://localhost:3030` and the API at `http://localhost:8080/api`.

### Verify

```bash
./gradlew :backend:test
cd frontend && pnpm lint && pnpm build && pnpm test:e2e
cd packages/openlog-cli && npm test && npm run build
```

## Repository structure

```text
backend/                Spring Boot API and database migrations
frontend/               Next.js web application and Playwright tests
packages/openlog-cli/   Official CLI and MCP server
deploy/                 Production deployment assets
_docs/                  Plans, worklogs, tasks, issues, and PR records
```

## Release

See [OpenLog releases](https://github.com/kitae9999/OpenLog/releases) for release notes and version history.
