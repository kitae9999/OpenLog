"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { logOut } from "@/features/auth/api/logOutActions";

export function ProfileMenu({
  profileHref,
  profileImageUrl,
}: {
  profileHref: string;
  profileImageUrl: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <Image
          src={profileImageUrl}
          alt="Profile avatar"
          width={32}
          height={32}
          className="size-8 rounded-full border border-zinc-200 object-cover transition hover:border-zinc-400"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-[calc(100%+7px)] z-50 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_18px_45px_rgba(24,24,27,0.14)] before:pointer-events-none before:absolute before:-top-[6px] before:right-[10px] before:size-3 before:rotate-45 before:border-l before:border-t before:border-zinc-200 before:bg-white before:content-['']"
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            Profile
          </Link>

          <form action={logOut}>
            <LogoutMenuItem />
          </form>
        </div>
      ) : null}
    </div>
  );
}

function LogoutMenuItem() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className="flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}
