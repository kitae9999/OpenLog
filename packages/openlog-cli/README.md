# OpenLog CLI

Official CLI and MCP server for OpenLog.

```bash
npx -y @kitae9999/openlog-cli login
npx -y @kitae9999/openlog-cli whoami
npx -y @kitae9999/openlog-cli mcp
```

MCP tools:

- `get_auth_status`
- `get_me`
- `list_my_notifications`
- `list_my_posts`
- `list_my_liked_posts`
- `upload_post_image`
- `publish_post`
- `push_working_brief`
- `get_post_detail`

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

Set `OPENLOG_API_BASE_URL` to point at a non-production API. Set
`OPENLOG_WEB_BASE_URL` to control absolute post URLs returned by `publish_post`.
