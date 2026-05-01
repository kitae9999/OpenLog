"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useOptimistic,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { PublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import {
  toggleFollowAction,
  updateProfileAction,
  type UpdateProfileActionState,
  type UpdateProfileValues,
} from "@/features/profile/api/profileActions";
import { assets } from "@/shared/config/assets";

type FieldName = "nickname" | "bio" | "location" | "websiteUrl";

export function EditableProfileHeader({
  profile,
  isViewer,
  canFollow,
  joinedLabel,
}: {
  profile: PublicUserProfile;
  isViewer: boolean;
  canFollow: boolean;
  joinedLabel: string;
}) {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
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
    setIsEditing(false);
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
        setIsEditing(false);
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

  if (isEditing) {
    return (
      <section className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8 sm:py-8">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-8 lg:flex-row lg:items-start"
        >
          <input type="hidden" name="username" value={currentProfile.username} />
          <ProfileAvatar profile={currentProfile} profileName={profileName} />

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                Edit profile details
              </p>
              {isViewer ? (
                <EditActions onCancel={handleCancel} pending={isPending} />
              ) : null}
            </div>

            <div className="grid min-w-0 gap-4">
              <Field
                name="nickname"
                label="Nickname"
                value={values.nickname}
                placeholder="프로필에 표시될 이름입니다."
                error={clientErrors.nickname ?? serverErrors.nickname}
                maxLength={40}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
              />

              <Field
                name="bio"
                label="Bio"
                value={values.bio}
                placeholder="No bio added yet."
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
                placeholder="No location added yet."
                error={clientErrors.location ?? serverErrors.location}
                maxLength={100}
                iconSrc="/MapPin.svg"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
              />
              <Field
                name="websiteUrl"
                label="Website"
                value={values.websiteUrl}
                placeholder="No website added yet."
                error={clientErrors.websiteUrl ?? serverErrors.websiteUrl}
                maxLength={2048}
                iconSrc="/LinkIcon.svg"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
              />
            </div>

            {serverErrors.form ? (
              <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {serverErrors.form}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <ProfileAvatar profile={currentProfile} profileName={profileName} />

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <h1 className="min-w-0 break-words font-[Georgia,serif] text-[40px] font-bold leading-none tracking-[-0.04em] text-zinc-950 sm:text-[48px]">
                {profileName}
              </h1>

              {isViewer ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  <IconPencil className="size-4" />
                  Edit
                </button>
              ) : canFollow ? (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={isFollowPending}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-sm font-semibold text-zinc-950 transition hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  {following ? (
                    <Image
                      src="/Users.svg"
                      alt=""
                      width={16}
                      height={16}
                      aria-hidden="true"
                      className="size-4"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="relative inline-block size-3 shrink-0"
                    >
                      <span className="absolute left-1/2 top-1/2 h-[1.5px] w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                      <span className="absolute left-1/2 top-1/2 h-2.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                    </span>
                  )}
                  {following ? "Following" : "Follow"}
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-sm font-medium text-zinc-500">
              @{currentProfile.username}
            </p>
            <p className="mt-4 max-w-3xl text-[18px] leading-8 text-zinc-600">
              {currentProfile.bio ?? "No bio added yet."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
            <ProfileMeta iconSrc="/Calendar.svg" label={joinedLabel} />
            <ProfileMeta
              iconSrc="/MapPin.svg"
              label={currentProfile.location ?? "No location added yet."}
              muted={!currentProfile.location}
            />
            <ProfileMeta
              iconSrc="/LinkIcon.svg"
              label={currentProfile.websiteUrl ?? "No website added yet."}
              muted={!currentProfile.websiteUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileAvatar({
  profile,
  profileName,
}: {
  profile: PublicUserProfile;
  profileName: string;
}) {
  return (
    <div className="mx-auto lg:mx-0">
      <div className="rounded-full border-4 border-zinc-50 bg-white p-1">
        <Image
          src={profile.profileImageUrl ?? assets.defaultAvatar}
          alt={`${profileName} avatar`}
          width={128}
          height={128}
          className="size-28 rounded-full object-cover sm:size-32"
          priority
        />
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  placeholder,
  error,
  maxLength,
  iconSrc,
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
  iconSrc?: string;
  multiline?: boolean;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
}) {
  const inputClassName = error
    ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
    : "border-zinc-200 bg-white focus:border-zinc-400 focus:ring-zinc-200/70";
  const className = `mt-2 w-full rounded-xl border px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:ring-4 ${inputClassName}`;

  return (
    <label className="block">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
        {iconSrc ? (
          <Image src={iconSrc} alt="" width={16} height={16} aria-hidden="true" />
        ) : null}
        {label}
      </span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className={`${className} min-h-[88px] resize-none leading-6`}
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
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
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
    <div className="flex items-center gap-2 self-start">
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:text-zinc-300"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function ProfileMeta({
  iconSrc,
  label,
  muted = false,
}: {
  iconSrc: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <Image src={iconSrc} alt="" width={16} height={16} aria-hidden="true" />
      <span className={muted ? "text-zinc-400" : undefined}>{label}</span>
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
