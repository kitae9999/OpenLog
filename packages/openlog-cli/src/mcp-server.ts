import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OpenLogApiClient } from "./api-client.js";
import { readAuthFile } from "./auth-store.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import { getApiBaseUrl, getWebBaseUrl } from "./config.js";
import { uploadPostImage } from "./post-image-upload.js";

const WRITE_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

export async function runMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "openlog",
    version: "1.0.0",
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

        const me = await createAuthenticatedApiClient().then((client) =>
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
    "upload_post_image",
    {
      title: "Upload OpenLog Post Image",
      description:
        "Convert a local image file to WebP, upload it to OpenLog, and return markdown for post content.",
      annotations: WRITE_TOOL_ANNOTATIONS,
      inputSchema: {
        filePath: z.string().min(1),
        altText: z.string().optional(),
      },
    },
    async ({ filePath, altText }) =>
      withAuthenticatedClient((client) =>
        uploadPostImage(client, {
          filePath,
          altText,
        }),
      ),
  );

  server.registerTool(
    "publish_post",
    {
      title: "Publish OpenLog Post",
      description:
        "Publish a new post to the authenticated OpenLog account. Requires confirm: true unless skipConfirmation: true is explicitly provided.",
      annotations: WRITE_TOOL_ANNOTATIONS,
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        content: z.string().min(1),
        topics: z.array(z.string()).default([]),
        links: z
          .array(
            z.object({
              label: z.string().min(1),
              targetSlug: z.string().min(1),
            }),
          )
          .default([]),
        confirm: z.boolean().optional(),
        skipConfirmation: z.boolean().optional(),
      },
    },
    async ({
      title,
      description,
      content,
      topics,
      links,
      confirm,
      skipConfirmation,
    }) =>
      withAuthenticatedClient(async (client) => {
        const post = normalizePostInput({
          title,
          description,
          content,
          topics,
          links,
        });

        if (confirm !== true && skipConfirmation !== true) {
          return {
            requiresConfirmation: true,
            preview: {
              title: post.title,
              description: post.description,
              contentPreview: createContentPreview(post.content),
              contentLength: post.content.length,
              topics: post.topics,
              links: post.links,
            },
            nextStep:
              "Call publish_post again with confirm: true, or skipConfirmation: true if the user explicitly requested publishing without confirmation.",
          };
        }

        const published = await client.post<PostWriteResponse>("/posts", post);
        const postPath = buildPublicPostPath(
          published.authorUsername,
          published.slug,
        );

        return {
          ...published,
          path: postPath,
          url: new URL(postPath, `${getWebBaseUrl()}/`).toString(),
        };
      }),
  );

  server.registerTool(
    "push_working_brief",
    {
      title: "Push OpenLog Working Brief",
      description:
        "Overwrite the workspace Now Working brief with a short status update: what was done, what is still open, and optional task/branch context. Latest write wins.",
      annotations: {
        ...WRITE_TOOL_ANNOTATIONS,
        idempotentHint: true,
      },
      inputSchema: {
        workspaceId: z.number().int().positive(),
        title: z.string().min(1).max(255),
        prose: z.string().min(1),
        taskId: z.number().int().positive().optional(),
        branch: z.string().max(255).optional(),
      },
    },
    async ({ workspaceId, title, prose, taskId, branch }) =>
      withAuthenticatedClient((client) =>
        client.put(`/workspaces/${workspaceId}/working-brief`, {
          title,
          prose,
          taskId: taskId ?? null,
          branch: branch ?? null,
        }),
      ),
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

type PostWriteResponse = {
  authorUsername: string;
  slug: string;
};

type PostLinkInput = {
  label: string;
  targetSlug: string;
};

type PostWriteInput = {
  title: string;
  description: string;
  content: string;
  topics: string[];
  links: PostLinkInput[];
};

function normalizePostInput(input: PostWriteInput): PostWriteInput {
  const title = input.title.trim();
  const description = input.description.trim();
  const content = input.content.trim();

  if (!title) {
    throw new Error("title is required.");
  }

  if (!description) {
    throw new Error("description is required.");
  }

  if (!content) {
    throw new Error("content is required.");
  }

  return {
    title,
    description,
    content,
    topics: normalizeTopics(input.topics),
    links: normalizeLinks(input.links),
  };
}

function normalizeTopics(topics: string[]): string[] {
  const normalized = topics
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(normalized)];
}

function normalizeLinks(links: PostLinkInput[]): PostLinkInput[] {
  const normalized: PostLinkInput[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const label = link.label.trim();
    const targetSlug = link.targetSlug.trim();
    const key = `${label}\u0000${targetSlug}`;

    if (!label || !targetSlug || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ label, targetSlug });
  }

  return normalized;
}

function createContentPreview(content: string): string {
  const preview = content.replace(/\s+/g, " ").trim();
  return preview.length > 500 ? `${preview.slice(0, 497)}...` : preview;
}

function buildPublicPostPath(username: string, slug: string): string {
  return `/@${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`;
}

async function withAuthenticatedClient(
  callback: (client: OpenLogApiClient) => Promise<unknown>,
) {
  try {
    const client = await createAuthenticatedApiClient();
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
