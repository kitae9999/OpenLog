"use client";

import { useState } from "react";
import type { PublicUserPostSummary } from "@/entities/user/api/getPublicUserPosts";
import type { PublicUserPostGraph } from "@/entities/user/api/getPublicUserPostGraph";
import type { PublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { AuthoredPostsSection } from "./AuthoredPostsSection";
import { EditableProfileHeader } from "./EditableProfileHeader";

export function ProfileWorkspace({
  profile,
  isViewer,
  canFollow,
  joinedLabel,
  posts,
  graph,
}: {
  profile: PublicUserProfile;
  isViewer: boolean;
  canFollow: boolean;
  joinedLabel: string;
  posts: PublicUserPostSummary[];
  graph: PublicUserPostGraph;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={
        isEditing
          ? "max-w-xl"
          : "grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-14"
      }
    >
      <EditableProfileHeader
        profile={profile}
        isViewer={isViewer}
        canFollow={canFollow}
        joinedLabel={joinedLabel}
        onEditingChange={setIsEditing}
      />

      {isEditing ? null : (
        <AuthoredPostsSection
          username={profile.username}
          posts={posts}
          graph={graph}
        />
      )}
    </div>
  );
}
