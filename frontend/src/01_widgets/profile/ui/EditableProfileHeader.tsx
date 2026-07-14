"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useOptimistic,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { PublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import {
  type FollowListType,
  type FollowUser,
} from "@/entities/user/api/getUserFollowList";
import {
  getProfileFollowListAction,
  toggleFollowAction,
  updateProfileAction,
  type UpdateProfileActionState,
  type UpdateProfileValues,
} from "@/features/profile/api/profileActions";
import { assets } from "@/shared/config/assets";
import { buildPublicProfilePath } from "@/shared/lib/publicRoutes";

type FieldName = "nickname" | "bio" | "location" | "websiteUrl";

export function EditableProfileHeader({
  profile,
  isViewer,
  canFollow,
  joinedLabel,
  onEditingChange,
}: {
  profile: PublicUserProfile;
  isViewer: boolean;
  canFollow: boolean;
  joinedLabel: string;
  onEditingChange?: (editing: boolean) => void;
}) {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);

  function setEditing(next: boolean) {
    setIsEditing(next);
    onEditingChange?.(next);
  }
  const initialState: UpdateProfileActionState = {
    values: toUpdateProfileValues(currentProfile),
    errors: {},
    profile: null,
  };
  const [values, setValues] = useState(initialState.values);
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [serverErrors, setServerErrors] = useState(initialState.errors);
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useOptimistic(profile.following);
  const [isFollowPending, startFollowTransition] = useTransition();
  const [followListType, setFollowListType] = useState<FollowListType | null>(
    null,
  );
  const [followListUsers, setFollowListUsers] = useState<FollowUser[]>([]);
  const [isFollowListLoading, setIsFollowListLoading] = useState(false);
  const [followListError, setFollowListError] = useState<string | null>(null);

  const profileName = currentProfile.nickname ?? currentProfile.username;

  function validateField(name: FieldName, value: string) {
    const trimmed = value.trim();

    if (name === "nickname") {
      if (!trimmed) {
        return "닉네임은 필수입니다.";
      }
      if (trimmed.length > 40) {
        return "닉네임은 40자 이하로 입력해주세요.";
      }
      return undefined;
    }

    if (name === "bio" && trimmed.length > 160) {
      return "bio는 160자 이하로 입력해주세요.";
    }

    if (name === "location" && trimmed.length > 100) {
      return "location은 100자 이하로 입력해주세요.";
    }

    if (name === "websiteUrl" && trimmed.length > 2048) {
      return "website URL은 2048자 이하로 입력해주세요.";
    }

    return undefined;
  }

  function handleFieldChange(name: FieldName, nextValue: string) {
    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setClientErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setServerErrors((current) => ({
      ...current,
      [name]: undefined,
      form: undefined,
    }));
  }

  function handleFieldBlur(name: FieldName) {
    const nextError = validateField(name, values[name]);

    setClientErrors((current) => ({
      ...current,
      [name]: nextError,
    }));
  }

  function handleCancel() {
    if (isPending) {
      return;
    }

    setValues(toUpdateProfileValues(currentProfile));
    setClientErrors({});
    setServerErrors({});
    setEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<FieldName, string>> = {
      nickname: validateField("nickname", values.nickname),
      bio: validateField("bio", values.bio),
      location: validateField("location", values.location),
      websiteUrl: validateField("websiteUrl", values.websiteUrl),
    };

    setClientErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      let result: UpdateProfileActionState;

      try {
        result = await updateProfileAction(formData);
      } catch {
        setServerErrors({
          form: "프로필을 저장하는 중 문제가 발생했습니다.",
        });
        return;
      }

      if (result.profile) {
        setCurrentProfile(result.profile);
        setValues(toUpdateProfileValues(result.profile));
        setClientErrors({});
        setServerErrors({});
        setEditing(false);
        router.refresh();
        return;
      }

      setValues(result.values);
      setServerErrors(result.errors);
    });
  }

  function handleFollowToggle() {
    if (!canFollow || isFollowPending) {
      return;
    }

    const currentFollowing = following;

    startFollowTransition(async () => {
      setFollowing(!currentFollowing);

      try {
        await toggleFollowAction(currentProfile.username, currentFollowing);
        router.refresh();
      } catch {
        router.refresh();
      }
    });
  }

  async function handleOpenFollowList(type: FollowListType) {
    setFollowListType(type);
    setFollowListUsers([]);
    setFollowListError(null);
    setIsFollowListLoading(true);

    try {
      const users = await getProfileFollowListAction(
        currentProfile.username,
        type,
      );
      setFollowListUsers(users);
    } catch {
      setFollowListError("목록을 불러오지 못했습니다.");
    } finally {
      setIsFollowListLoading(false);
    }
  }

  if (isEditing) {
    return (
      <section>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="username" value={currentProfile.username} />

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">Edit profile</p>
            {isViewer ? (
              <EditActions onCancel={handleCancel} pending={isPending} />
            ) : null}
          </div>

          <div className="mb-8">
            <ProfileAvatar
              profile={currentProfile}
              profileName={profileName}
              onOpenFollowList={handleOpenFollowList}
            />
          </div>

          <div className="grid min-w-0 gap-5">
            <Field
              name="nickname"
              label="Nickname"
              value={values.nickname}
              placeholder="Display name"
              error={clientErrors.nickname ?? serverErrors.nickname}
              maxLength={40}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />

            <Field
              name="bio"
              label="Bio"
              value={values.bio}
              placeholder="A short bio"
              error={clientErrors.bio ?? serverErrors.bio}
              maxLength={160}
              multiline
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />

            <Field
              name="location"
              label="Location"
              value={values.location}
              placeholder="Optional"
              error={clientErrors.location ?? serverErrors.location}
              maxLength={100}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
            <Field
              name="websiteUrl"
              label="Website"
              value={values.websiteUrl}
              placeholder="Optional"
              error={clientErrors.websiteUrl ?? serverErrors.websiteUrl}
              maxLength={2048}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          </div>

          {serverErrors.form ? (
            <p className="mt-4 text-sm font-medium text-rose-700">
              {serverErrors.form}
            </p>
          ) : null}
        </form>
        {followListType ? (
          <FollowListModal
            type={followListType}
            users={followListUsers}
            loading={isFollowListLoading}
            error={followListError}
            onClose={() => setFollowListType(null)}
          />
        ) : null}
      </section>
    );
  }

  const metaItems = [
    joinedLabel,
    currentProfile.location,
    currentProfile.websiteUrl,
  ].filter((item): item is string => Boolean(item));

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="flex flex-col items-start">
        <ProfileAvatar
          profile={currentProfile}
          profileName={profileName}
          onOpenFollowList={handleOpenFollowList}
        />

        <div className="mt-5 w-full min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-[26px] font-bold leading-[1.15] tracking-tight text-zinc-950">
              {profileName}
            </h1>
            {isViewer ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <IconPencil className="size-3.5" />
                Edit
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            @{currentProfile.username}
          </p>

          {canFollow ? (
            <button
              type="button"
              onClick={handleFollowToggle}
              disabled={isFollowPending}
              className="mt-4 inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-950 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              {following ? "Following" : "Follow"}
            </button>
          ) : null}

          {currentProfile.bio ? (
            <p className="mt-4 text-[14.5px] leading-6 text-zinc-600">
              {currentProfile.bio}
            </p>
          ) : null}

          {metaItems.length > 0 ? (
            <ul className="mt-4 space-y-0 text-sm text-zinc-400">
              {metaItems.map((item, index) => (
                <li key={item}>
                  {index > 0 ? (
                    <div
                      className="my-2.5 h-px w-8 bg-zinc-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <p className="break-words">{item}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {followListType ? (
        <FollowListModal
          type={followListType}
          users={followListUsers}
          loading={isFollowListLoading}
          error={followListError}
          onClose={() => setFollowListType(null)}
        />
      ) : null}
    </aside>
  );
}

function ProfileAvatar({
  profile,
  profileName,
  onOpenFollowList,
}: {
  profile: PublicUserProfile;
  profileName: string;
  onOpenFollowList: (type: FollowListType) => void;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Image
        src={profile.profileImageUrl ?? assets.defaultAvatar}
        alt={`${profileName} avatar`}
        width={112}
        height={112}
        className="size-24 rounded-full object-cover sm:size-28"
        priority
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
        <button
          type="button"
          onClick={() => onOpenFollowList("followers")}
          className="inline-flex cursor-pointer items-baseline gap-1 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <span className="font-semibold tabular-nums text-zinc-950">
            {profile.followersCount}
          </span>
          <span>followers</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenFollowList("following")}
          className="inline-flex cursor-pointer items-baseline gap-1 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <span className="font-semibold tabular-nums text-zinc-950">
            {profile.followingCount}
          </span>
          <span>following</span>
        </button>
      </div>
    </div>
  );
}

function FollowListModal({
  type,
  users,
  loading,
  error,
  onClose,
}: {
  type: FollowListType;
  users: FollowUser[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="follow-list-title"
            className="text-base font-semibold text-zinc-950"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            aria-label="Close"
          >
            x
          </button>
        </div>
        <FollowListContent
          title={title}
          users={users}
          loading={loading}
          error={error}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function FollowListContent({
  title,
  users,
  loading,
  error,
  onClose,
}: {
  title: string;
  users: FollowUser[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <div className="mt-6 px-1 py-8 text-center text-sm text-zinc-500">
        Loading {title.toLowerCase()}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-sm font-medium text-rose-700">{error}</div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="mt-6 px-1 py-8 text-center text-sm text-zinc-500">
        No {title.toLowerCase()} yet.
      </div>
    );
  }

  return (
    <ul className="openlog-scroll mt-5 max-h-[360px] overflow-y-auto">
      {users.map((user) => {
        const name = user.nickname ?? user.username;

        return (
          <li key={user.username}>
            <Link
              href={buildPublicProfilePath(user.username)}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
            >
              <Image
                src={user.profileImageUrl ?? assets.defaultAvatar}
                alt={`${name} avatar`}
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-950">
                  {name}
                </span>
                <span className="block truncate text-sm text-zinc-500">
                  @{user.username}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Field({
  name,
  label,
  value,
  placeholder,
  error,
  maxLength,
  multiline = false,
  onChange,
  onBlur,
}: {
  name: FieldName;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  maxLength: number;
  multiline?: boolean;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
}) {
  const className = error
    ? "mt-1.5 w-full border-b border-rose-300 bg-transparent px-0 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-rose-400"
    : "mt-1.5 w-full border-b border-zinc-200 bg-transparent px-0 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className={`${className} min-h-[72px] resize-none leading-6`}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
        />
      ) : (
        <input
          name={name}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          className={className}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
        />
      )}
      {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

function EditActions({
  onCancel,
  pending,
}: {
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 self-start">
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="text-sm font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-zinc-950 transition hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toUpdateProfileValues(profile: PublicUserProfile): UpdateProfileValues {
  return {
    username: profile.username,
    nickname: profile.nickname ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    websiteUrl: profile.websiteUrl ?? "",
  };
}
