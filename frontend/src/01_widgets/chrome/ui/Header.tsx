import Image from "next/image";
import Link from "next/link";
import { assets } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { GuestActions } from "@/features/auth/ui";
import { logoMarkClassName, logoWordmarkClassName, navLinks } from "./brand";
import { SearchBar } from "./SearchBar";
// import { getUser } from "@/features/auth/api/getUser";

export function Header({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  showWriteAction = true,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  showWriteAction?: boolean;
}) {
  const resolvedProfileImageUrl = profileImageUrl ?? assets.defaultAvatar;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1083px] items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-lg bg-black text-[16px] text-white",
                logoMarkClassName,
              )}
            >
              O
            </span>
            <span className={logoWordmarkClassName}>OpenLog</span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex"
          >
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  item.label === "Trending" && "text-zinc-950",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar className="hidden md:block" />

          {isLoggedIn ? (
            <>
              {showWriteAction ? (
                <Link
                  href="/write"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  <IconPencil className="size-4" />
                  Write
                </Link>
              ) : null}

              <button
                type="button"
                aria-label="Notifications"
                className="group relative grid size-9 place-items-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <Image
                  src="/Bell.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                  className="size-5 opacity-80 transition group-hover:brightness-0"
                />
                <span className="absolute right-[9px] top-[9px] size-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <Link
                href={profileHref ?? "/"}
                aria-label="Your profile"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <Image
                  src={resolvedProfileImageUrl}
                  alt="Profile avatar"
                  width={32}
                  height={32}
                  className="size-8 rounded-full border border-zinc-200 object-cover"
                />
              </Link>
            </>
          ) : (
            <GuestActions />
          )}
        </div>
      </div>
    </header>
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
