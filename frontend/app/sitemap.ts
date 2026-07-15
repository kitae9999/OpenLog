import type { MetadataRoute } from "next";
import { getRecentPosts } from "@/entities/post/api/getRecentPosts";
import { SITE_URL } from "@/shared/config/site";
import {
  buildPublicPostPath,
  buildPublicProfilePath,
} from "@/shared/lib/publicRoutes";

const PAGE_SIZE = 10;
const MAX_PAGES = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const profileUrls = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;

    do {
      const page = await getRecentPosts(cursor, PAGE_SIZE, {
        next: { revalidate: 3600 },
      });

      for (const post of page.posts) {
        const profileUrl = new URL(
          buildPublicProfilePath(post.authorUsername),
          `${SITE_URL}/`,
        ).toString();
        if (!profileUrls.has(profileUrl)) {
          profileUrls.add(profileUrl);
          entries.push({
            url: profileUrl,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }

        entries.push({
          url: new URL(
            buildPublicPostPath(post.authorUsername, post.slug),
            `${SITE_URL}/`,
          ).toString(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }

      cursor = page.hasNext ? page.nextCursor : null;
      pages += 1;
    } while (cursor && pages < MAX_PAGES);
  } catch {
    // Keep the root sitemap available while the API is temporarily unavailable.
  }

  return entries;
}
