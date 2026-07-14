# OpenLog CLI

Official CLI and MCP server for OpenLog.

```bash
npx -y @openloghq/cli login
npx -y @openloghq/cli whoami
npx -y @openloghq/cli mcp
```

Local MCP permissions:

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
- Workspace context: workspace discovery, activity, working brief, tasks, logs, todos, memories, outputs, and graph links
- Safe writes: create/update, todo completion, link creation, image upload, and confirmed output/post publishing
- Full-only writes: individual workspace-document/link deletes and working-brief clear

MCP client configuration:

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
