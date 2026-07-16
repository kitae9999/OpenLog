import type { Comment } from "@/entities/comment/api/getPostComments";
import type { Post, Suggestion } from "@/entities/post/model";
import type { PublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import type { FeedPost } from "@/entities/workspace/model/data";
import { FeedArticleCard } from "@/widgets/feed-article/ui/FeedArticleCard";
import { PostArticle } from "@/widgets/post/ui/PostArticle";
import { PostSuggests } from "@/widgets/post/ui/PostSuggests";
import { SuggestionDetail } from "@/widgets/post/ui/SuggestionDetail";
import { EditableProfileHeader } from "@/widgets/profile/ui/EditableProfileHeader";
import { assets } from "@/shared/config/assets";

const officialPost: Post = {
  title: "Why we built OpenLog",
  description: "A durable home for the context behind software work.",
  authorName: "Team OpenLog",
  authorAvatarSrc: assets.defaultAvatar,
  authorIsOpenLogOfficial: true,
  publishedAtLabel: "Jul 16, 2026",
  tags: ["OpenLog"],
  likes: 12,
  comments: 2,
};

const officialProfile: PublicUserProfile = {
  username: "openlog",
  nickname: "Team OpenLog",
  profileImageUrl: null,
  isOpenLogOfficial: true,
  bio: "The official OpenLog account.",
  location: null,
  websiteUrl: null,
  joinedAt: "2026-07-16T00:00:00",
  following: false,
  followersCount: 24,
  followingCount: 0,
};

const comments: Comment[] = [
  {
    id: 1,
    authorName: "Team OpenLog",
    authorProfileImageUrl: null,
    authorIsOpenLogOfficial: true,
    content: "Welcome to OpenLog.",
    createdAt: "2026-07-16T00:00:00",
    canManage: false,
  },
  {
    id: 2,
    authorName: "Regular author",
    authorProfileImageUrl: null,
    authorIsOpenLogOfficial: false,
    content: "Thanks for the guide.",
    createdAt: "2026-07-16T01:00:00",
    canManage: false,
  },
];

const suggestion: Suggestion = {
  id: "1",
  numberLabel: "#1",
  title: "Clarify the first publishing flow",
  activityLabel: "opened Jul 16, 2026",
  authorName: "Team OpenLog",
  authorAvatarSrc: assets.defaultAvatar,
  authorIsOpenLogOfficial: true,
  commentCount: 2,
  status: "open",
  comment: {
    authorName: "Team OpenLog",
    authorAvatarSrc: assets.defaultAvatar,
    authorIsOpenLogOfficial: true,
    commentedAtLabel: "Jul 16, 2026",
    message: "This wording makes the first publishing flow easier to follow.",
  },
  diffRows: [],
  discussionComments: [
    {
      id: "1",
      authorName: "Team OpenLog",
      authorAvatarSrc: assets.defaultAvatar,
      authorIsOpenLogOfficial: true,
      commentedAtLabel: "Jul 16, 2026",
      message: "We will include this in the guide.",
      canManage: false,
    },
    {
      id: "2",
      authorName: "Regular author",
      authorAvatarSrc: assets.defaultAvatar,
      authorIsOpenLogOfficial: false,
      commentedAtLabel: "Jul 16, 2026",
      message: "Looks good.",
      canManage: false,
    },
  ],
};

const feedPosts: FeedPost[] = [
  {
    id: "official",
    nickname: "Team OpenLog",
    profileImageSrc: assets.defaultAvatar,
    authorIsOpenLogOfficial: true,
    title: "Why we built OpenLog",
    description: "The story behind OpenLog.",
    dateLabel: "Jul 16",
    commentCount: "2",
    likeCount: "12",
    href: "#official-post",
  },
  {
    id: "regular",
    nickname: "Regular author",
    profileImageSrc: assets.defaultAvatar,
    authorIsOpenLogOfficial: false,
    title: "A community post",
    description: "A regular public post.",
    dateLabel: "Jul 15",
    commentCount: "0",
    likeCount: "3",
    href: "#regular-post",
  },
];

export default function OfficialBadgeFixturePage() {
  return (
    <main className="min-h-dvh bg-white px-4 py-10 text-zinc-950 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-20">
        <h1 className="text-2xl font-bold tracking-tight">
          Official badge fixture
        </h1>

        <section data-testid="feed-context" aria-label="Feed badge context">
          {feedPosts.map((post) => (
            <FeedArticleCard key={post.id} post={post} />
          ))}
        </section>

        <section
          data-testid="profile-context"
          aria-label="Profile badge context"
          className="max-w-xs"
        >
          <EditableProfileHeader
            profile={officialProfile}
            isViewer={false}
            canFollow={false}
            joinedLabel="Joined Jul 2026"
          />
        </section>

        <section data-testid="post-context" aria-label="Post badge context">
          <PostArticle
            post={officialPost}
            authorHref="#profile"
            articleHref="#article"
            suggestsHref="#suggests"
            showSuggestsTab={false}
            commentItems={comments}
            postId={1}
            isAuthenticated={false}
          >
            <p>Official post content.</p>
          </PostArticle>
        </section>

        <section
          data-testid="suggestions-context"
          aria-label="Suggestion list badge context"
        >
          <PostSuggests
            post={officialPost}
            suggestions={[
              {
                id: suggestion.id,
                detailHref: "#suggestion-detail",
                numberLabel: suggestion.numberLabel,
                title: suggestion.title,
                activityLabel: suggestion.activityLabel,
                authorName: suggestion.authorName,
                authorIsOpenLogOfficial:
                  suggestion.authorIsOpenLogOfficial,
                commentCount: suggestion.commentCount,
                status: suggestion.status,
              },
            ]}
            articleHref="#article"
            suggestsHref="#suggests"
            suggestCount={1}
            canCreateSuggestion={false}
          />
        </section>

        <section
          data-testid="suggestion-detail-context"
          aria-label="Suggestion detail badge context"
        >
          <SuggestionDetail
            post={officialPost}
            suggestion={suggestion}
            postId={1}
            suggestionId={1}
            articleHref="#article"
            suggestsHref="#suggests"
            canDiscuss={false}
          />
        </section>
      </div>
    </main>
  );
}
