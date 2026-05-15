# OpenLog CLI

Official CLI and MCP server for OpenLog.

```bash
npx -y @kitae9999/openlog-cli login
npx -y @kitae9999/openlog-cli whoami
npx -y @kitae9999/openlog-cli mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@kitae9999/openlog-cli", "mcp"]
    }
  }
}
```

Set `OPENLOG_API_BASE_URL` to point at a non-production API.
