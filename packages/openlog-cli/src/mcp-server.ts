import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OpenLogApiClient } from "./api-client.js";
import { readAuthFile } from "./auth-store.js";
import { getApiBaseUrl } from "./config.js";

export async function runMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "openlog",
    version: "0.1.1",
  });

  server.registerTool(
    "get_auth_status",
    {
      title: "Get OpenLog Auth Status",
      description: "Check whether the local OpenLog CLI is authenticated.",
      inputSchema: {},
    },
    async () => {
      let apiBaseUrl = getApiBaseUrl();
      try {
        const authFile = await readAuthFile();
        if (!authFile) {
          return textResult({
            authenticated: false,
            apiBaseUrl,
          });
        }
        apiBaseUrl = authFile.apiBaseUrl;

        const me = await createAuthenticatedClient().then((client) =>
          client.get("/auth/me"),
        );

        return textResult({
          authenticated: true,
          apiBaseUrl: authFile.apiBaseUrl,
          user: me,
        });
      } catch (error) {
        return textResult({
          authenticated: false,
          apiBaseUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  server.registerTool(
    "get_me",
    {
      title: "Get OpenLog Me",
      description: "Return the currently authenticated OpenLog user.",
      inputSchema: {},
    },
    async () => withAuthenticatedClient((client) => client.get("/auth/me")),
  );

  server.registerTool(
    "list_my_notifications",
    {
      title: "List My OpenLog Notifications",
      description: "Return notifications for the authenticated OpenLog user.",
      inputSchema: {
        size: z.number().int().min(1).max(20).default(20),
      },
    },
    async ({ size }) =>
      withAuthenticatedClient((client) =>
        client.get(`/notifications?${new URLSearchParams({ size: String(size) })}`),
      ),
  );

  server.registerTool(
    "list_my_liked_posts",
    {
      title: "List My Liked OpenLog Posts",
      description: "Return posts liked by the authenticated OpenLog user.",
      inputSchema: {
        cursor: z.string().optional(),
        size: z.number().int().min(1).max(20).default(10),
      },
    },
    async ({ cursor, size }) => {
      const params = new URLSearchParams({ size: String(size) });
      if (cursor) {
        params.set("cursor", cursor);
      }

      return withAuthenticatedClient((client) =>
        client.get(`/users/me/liked-posts?${params}`),
      );
    },
  );

  server.registerTool(
    "list_my_posts",
    {
      title: "List My OpenLog Posts",
      description: "Return posts authored by the authenticated OpenLog user.",
      inputSchema: {
        size: z.number().int().min(1).max(100).default(20),
      },
    },
    async ({ size }) =>
      withAuthenticatedClient(async (client) => {
        const me = await client.get<{ username?: string | null }>("/auth/me");
        const username = me.username?.trim();

        if (!username) {
          throw new Error("Complete OpenLog onboarding before listing your posts.");
        }

        const posts = await client.get<unknown[]>(
          `/users/${encodeURIComponent(username)}/posts`,
        );

        return {
          username,
          total: posts.length,
          size,
          hasMore: posts.length > size,
          posts: posts.slice(0, size),
        };
      }),
  );

  server.registerTool(
    "get_post_detail",
    {
      title: "Get OpenLog Post Detail",
      description:
        "Return a public OpenLog post detail by author username and post slug.",
      inputSchema: {
        username: z.string().min(1),
        slug: z.string().min(1),
      },
    },
    async ({ username, slug }) =>
      withAuthenticatedClient((client) =>
        client.get(
          `/users/${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`,
        ),
      ),
  );

  await server.connect(new StdioServerTransport());
}

async function createAuthenticatedClient(): Promise<OpenLogApiClient> {
  const authFile = await readAuthFile();

  if (!authFile) {
    throw new Error("Run `openlog login` before using OpenLog MCP tools.");
  }

  return new OpenLogApiClient({
    accessToken: authFile.accessToken,
    apiBaseUrl: authFile.apiBaseUrl,
  });
}

async function withAuthenticatedClient(
  callback: (client: OpenLogApiClient) => Promise<unknown>,
) {
  try {
    const client = await createAuthenticatedClient();
    const result = await callback(client);
    return textResult(result);
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}
