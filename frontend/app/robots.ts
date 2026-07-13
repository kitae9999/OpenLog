import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/config/site";

const PRIVATE_PATHS = [
  "/api/",
  "/auth/",
  "/activity",
  "/cli-login",
  "/e2e/",
  "/graph",
  "/landing-preview",
  "/logs",
  "/memory",
  "/onboarding",
  "/outputs",
  "/planner",
  "/settings",
  "/tasks",
  "/workspaces",
  "/write",
  "/*/posts/*/edit",
  "/*/posts/*/suggestions",
];

export default function robots(): MetadataRoute.Robots {
  if (isVercelPreview()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

function isVercelPreview(): boolean {
  return Boolean(
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production",
  );
}
