# OpenLog CLI

Official CLI and MCP server for OpenLog.

```bash
npx -y openlog-cli login
npx -y openlog-cli whoami
npx -y openlog-cli mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "openlog-cli", "mcp"]
    }
  }
}
```

Set `OPENLOG_API_BASE_URL` to point at a non-production API.

