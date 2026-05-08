"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { assets } from "@/shared/config/assets";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";

type NotificationActor = {
  id: number;
  username: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
};

type PostPublishedPayload = {
  post?: {
    title?: string;
    slug?: string;
  };
  author?: {
    username?: string;
    nickname?: string | null;
    profileImageUrl?: string | null;
  };
};

type NotificationItem = {
  id: number;
  type: string;
  targetDomain: string;
  targetId: string;
  payload: PostPublishedPayload;
  actor: NotificationActor | null;
  readAt: string | null;
  createdAt: string;
  unread: boolean;
};

type NotificationListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadNotificationSummary() {
      try {
        const data = await fetchNotifications(1, abortController.signal);
        setUnreadCount(data.unreadCount);
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        setUnreadCount(0);
      }
    }

    void loadNotificationSummary();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const abortController = new AbortController();

    async function loadNotificationList() {
      setIsLoading(true);
      setLoadError(false);

      try {
        const data = await fetchNotifications(10, abortController.signal);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        setNotifications([]);
        setUnreadCount(0);
        setLoadError(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotificationList();

    return () => {
      abortController.abort();
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="group relative grid size-9 cursor-pointer place-items-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <Image
          src="/Bell.svg"
          alt=""
          width={20}
          height={20}
          aria-hidden="true"
          className="size-5 opacity-80 transition group-hover:brightness-0"
        />
        {unreadCount > 0 ? (
          <span className="absolute right-[9px] top-[9px] size-2 rounded-full border-2 border-white bg-red-500" />
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute -right-11 top-[calc(100%+7px)] z-50 w-[28rem] max-w-[calc(100vw_-_2rem)] rounded-xl border border-zinc-200 bg-white shadow-[0_18px_45px_rgba(24,24,27,0.14)] before:pointer-events-none before:absolute before:-top-[6px] before:right-[58px] before:size-3 before:rotate-45 before:border-l before:border-t before:border-zinc-200 before:bg-white before:content-['']"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-950">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <span className="text-xs font-semibold text-black">
                {unreadCount} new
              </span>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {isLoading ? <NotificationLoadingState /> : null}

            {!isLoading && loadError ? (
              <NotificationEmptyState message="Could not load notifications." />
            ) : null}

            {!isLoading && !loadError && notifications.length === 0 ? (
              <NotificationEmptyState message="No notifications yet." />
            ) : null}

            {!isLoading && !loadError
              ? notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onNavigate={() => setIsOpen(false)}
                  />
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function fetchNotifications(size: number, signal: AbortSignal) {
  const response = await fetch(`/api/notifications?size=${size}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to load notifications.");
  }

  return (await response.json()) as NotificationListResponse;
}

function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: NotificationItem;
  onNavigate: () => void;
}) {
  const viewModel = getNotificationViewModel(notification);
  const avatarSrc =
    notification.actor?.profileImageUrl ??
    notification.payload.author?.profileImageUrl ??
    assets.defaultAvatar;
  const content = (
    <div className="flex min-w-0 gap-3 rounded-lg px-3 py-3 transition hover:bg-zinc-50">
      <Image
        src={avatarSrc}
        alt=""
        width={36}
        height={36}
        aria-hidden="true"
        className="mt-0.5 size-9 shrink-0 rounded-full border border-zinc-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-sm leading-5 text-zinc-700">
            <span className="font-semibold text-zinc-950">
              {viewModel.actorName}
            </span>{" "}
            {viewModel.message}
          </p>
          {notification.unread ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />
          ) : null}
        </div>
        {viewModel.title ? (
          <p className="mt-1 truncate text-sm font-medium text-zinc-950">
            {viewModel.title}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-zinc-500">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  return viewModel.href ? (
    <Link href={viewModel.href} role="menuitem" onClick={onNavigate}>
      {content}
    </Link>
  ) : (
    <div role="menuitem">{content}</div>
  );
}

function NotificationLoadingState() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-lg px-3 py-3">
          <div className="size-9 rounded-full bg-zinc-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-4/5 rounded-full bg-zinc-100" />
            <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationEmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm font-medium text-zinc-500">
      {message}
    </div>
  );
}

function getNotificationViewModel(notification: NotificationItem) {
  const actorName =
    notification.actor?.nickname ??
    notification.payload.author?.nickname ??
    notification.actor?.username ??
    notification.payload.author?.username ??
    "Someone";
  const username =
    notification.actor?.username ?? notification.payload.author?.username;
  const postSlug = notification.payload.post?.slug;
  const postTitle = notification.payload.post?.title;
  const href =
    notification.type === "POST_PUBLISHED" && username && postSlug
      ? buildPublicPostPath(username, postSlug)
      : null;

  if (notification.type === "POST_PUBLISHED") {
    return {
      actorName,
      href,
      message: "published a new post.",
      title: postTitle ?? "Untitled post",
    };
  }

  return {
    actorName,
    href: null,
    message: "sent you a notification.",
    title: postTitle ?? null,
  };
}

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}
