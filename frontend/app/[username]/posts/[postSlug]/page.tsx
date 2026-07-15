import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { AppChromeShell } from "@/widgets/app-shell/ui/AppChromeShell";
import { loadAppChromeWorkspace } from "@/widgets/app-shell/api/loadAppChromeWorkspace";
import { PostArticle } from "@/widgets/post/ui";
import { getPostComments } from "@/entities/comment/api/getPostComments";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPostSuggestions } from "@/entities/post/api/getPostSuggestions";
import { getPostEntry, contributors } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import { assets } from "@/shared/config/assets";
import { SITE_NAME, SITE_URL } from "@/shared/config/site";
import { toJsonLdScript } from "@/shared/lib/jsonLd";
import { formatPostVersionLabel } from "@/shared/lib/postVersion";
import {
  buildPublicProfilePath,
  buildPublicPostEditPath,
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";
import { MarkdownContent } from "@/shared/ui/markdown";

type PublicPostPageProps = {
  params?: Promise<{ username?: string; postSlug?: string }>;
};

export async function generateMetadata({
  params,
}: PublicPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlugParam = resolvedParams?.postSlug;
  const username = usernameParam
    ? parsePublicUsernameParam(usernameParam)
    : null;
  const postSlug = postSlugParam
    ? parsePublicPostSlugParam(postSlugParam)
    : null;

  if (!username || !postSlug) {
    return noIndexMetadata();
  }

  const detail = await getPostDetail(username, postSlug);
  const entry = detail ? null : getPostEntry(username, postSlug);
  if (!detail && !entry) {
    return noIndexMetadata();
  }

  const title = detail?.title ?? entry?.post.title ?? "OpenLog post";
  const description = toMetaDescription(
    detail?.description ?? entry?.post.description,
  );
  const authorName = detail?.authorName ?? entry?.post.authorName ?? username;
  const canonical = buildPublicPostPath(
    detail?.authorUsername ?? username,
    detail?.slug ?? postSlug,
  );

  return {
    title,
    description,
    keywords: detail?.topics,
    authors: [{ name: authorName }],
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      authors: [authorName],
      tags: detail?.topics,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function PublicPostPage({
  params,
}: PublicPostPageProps) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;

  if (!usernameParam || !postSlug) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  if (!authorUsername || !canonicalPostSlug) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUser(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);
  const profileHref = viewer
    ? buildViewerProfileHref(viewer.username)
    : undefined;
  const chrome = await loadAppChromeWorkspace(!!viewer);

  if (detail) {
    const [commentItems, suggestions] = await Promise.all([
      getPostComments(detail.id),
      getPostSuggestions(detail.id),
    ]);
    const authorHref = buildPublicProfilePath(detail.authorUsername);
    const articleHref = buildPublicPostPath(detail.authorUsername, detail.slug);
    const editHref = buildPublicPostEditPath(
      detail.authorUsername,
      detail.slug,
    );
    const suggestsHref = buildPublicSuggestsPath(
      detail.authorUsername,
      detail.slug,
    );
    const isOwner = viewer?.username === detail.authorUsername;
    const articleDescription = toMetaDescription(detail.description);
    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: detail.title,
      description: articleDescription,
      url: new URL(articleHref, `${SITE_URL}/`).toString(),
      author: {
        "@type": "Person",
        name: detail.authorName,
        url: new URL(authorHref, `${SITE_URL}/`).toString(),
      },
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
      inLanguage: "en",
    };

    return (
      <AppChromeShell
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={profileHref}
        activeTab="home"
        workspaces={chrome.workspaces}
        workspaceData={chrome.workspaceData}
        footer={<Footer />}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdScript(articleJsonLd) }}
        />
        <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
          <PostArticle
            post={{
              title: detail.title,
              description: detail.description,
              authorName: detail.authorName,
              authorAvatarSrc: detail.authorAvatarSrc ?? assets.defaultAvatar,
              publishedAtLabel: detail.publishedAtLabel,
              versionLabel: formatPostVersionLabel(detail.version),
              tags: detail.topics,
              likes: detail.likes,
              liked: detail.liked,
              comments: commentItems.length,
            }}
            commentItems={commentItems}
            postId={detail.id}
            ownerActions={
              isOwner
                ? {
                    postId: detail.id,
                    editHref,
                    profileHref: authorHref,
                  }
                : undefined
            }
            authorHref={authorHref}
            currentUserAvatarSrc={viewer?.profileImageUrl}
            backHref="/"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestCount={suggestions.length}
            sourceTeaser={viewer ? undefined : { locked: true }}
            isAuthenticated={!!viewer}
          >
            <div className="mt-8 space-y-6 text-[16px] leading-8 text-zinc-700">
              <MarkdownContent
                markdown={detail.content}
                wikiLinks={detail.wikiLinks.map((link) => ({
                  label: link.label,
                  href: buildPublicPostPath(
                    detail.authorUsername,
                    link.targetSlug,
                  ),
                  targetSlug: link.targetSlug,
                }))}
              />
            </div>
          </PostArticle>
        </div>
      </AppChromeShell>
    );
  }

  const entry = getPostEntry(authorUsername, canonicalPostSlug);
  if (!entry) {
    notFound();
  }

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const authorHref = buildPublicProfilePath(authorUsername);
  const suggestsHref = buildPublicSuggestsPath(
    authorUsername,
    canonicalPostSlug,
  );
  const entryDescription = toMetaDescription(entry.post.description);
  const entryJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.post.title,
    description: entryDescription,
    url: new URL(articleHref, `${SITE_URL}/`).toString(),
    author: {
      "@type": "Person",
      name: entry.post.authorName,
      url: new URL(authorHref, `${SITE_URL}/`).toString(),
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: "en",
  };

  return (
    <AppChromeShell
      isLoggedIn={!!viewer}
      profileImageUrl={viewer?.profileImageUrl}
      profileHref={profileHref}
      activeTab="home"
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
      footer={<Footer />}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(entryJsonLd) }}
      />
      <div className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <PostArticle
          post={entry.post}
          contributors={contributors}
          authorHref={authorHref}
          currentUserAvatarSrc={viewer?.profileImageUrl}
          backHref="/"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestCount={entry.suggestCount}
          sourceTeaser={viewer ? undefined : { locked: true }}
          isAuthenticated={!!viewer}
        >
          {entry.body}
        </PostArticle>
      </div>
    </AppChromeShell>
  );
}

function noIndexMetadata(): Metadata {
  return {
    title: "Post not found",
    robots: { index: false, follow: false },
  };
}

function toMetaDescription(value: string | undefined): string {
  const fallback = "A developer knowledge post published on OpenLog.";
  const normalized = value?.replace(/\s+/g, " ").trim() || fallback;
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trimEnd()}...`
    : normalized;
}
