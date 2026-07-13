import type { NextConfig } from "next";

const NO_INDEX_HEADER = {
  key: "X-Robots-Tag",
  value: "noindex, nofollow, noarchive, nosnippet",
};

const PRIVATE_ROUTE_PREFIXES = [
  "api",
  "auth",
  "activity",
  "cli-login",
  "e2e",
  "graph",
  "landing-preview",
  "logs",
  "memory",
  "onboarding",
  "outputs",
  "planner",
  "settings",
  "tasks",
  "workspaces",
  "write",
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
      return [
        {
          source: "/:path*",
          headers: [NO_INDEX_HEADER],
        },
      ];
    }

    return [
      ...PRIVATE_ROUTE_PREFIXES.map((prefix) => ({
        source: `/${prefix}/:path*`,
        headers: [NO_INDEX_HEADER],
      })),
      {
        source: "/:username/posts/:postSlug/edit",
        headers: [NO_INDEX_HEADER],
      },
      {
        source: "/:username/posts/:postSlug/suggestions/:path*",
        headers: [NO_INDEX_HEADER],
      },
    ];
  },
};

export default nextConfig;
