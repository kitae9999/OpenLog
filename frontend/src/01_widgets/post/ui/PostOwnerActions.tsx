"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePostAction } from "@/features/post/api/postActions";

export function PostOwnerActions({
  postId,
  editHref,
  profileHref,
}: {
  postId: number;
  editHref: string;
  profileHref: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function deletePost() {
    if (isPending) {
      return;
    }

    if (!window.confirm("글을 삭제할까요?")) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await deletePostAction(postId);
        if (!result.ok) {
          setErrorMessage(result.message);
          return;
        }

        router.replace(profileHref);
      } catch {
        setErrorMessage("글을 삭제하는 중 문제가 발생했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex h-9 items-center gap-3">
        <Link
          href={editHref}
          className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={deletePost}
          disabled={isPending}
          className="cursor-pointer text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
        >
          {isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {errorMessage ? (
        <p className="max-w-[220px] text-right text-xs font-medium leading-5 text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
