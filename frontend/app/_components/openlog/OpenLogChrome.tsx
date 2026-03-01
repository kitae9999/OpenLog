import Image from "next/image";
import Link from "next/link";

export const openLogAssets = {
  featuredCover:
    "http://localhost:3845/assets/215944c0ae039b44468166b8e84bf99beae0f71d.png",
  postCover:
    "http://localhost:3845/assets/1d59d1970b8502f1a9dfc1f9aea722f8578e0946.png",
  knowledgeGraph:
    "http://localhost:3845/assets/7cccabd62c9ceae10c4b94563846cc9452172b1c.png",
  avatarA:
    "http://localhost:3845/assets/8925e570ef6cac4accffa930abb18210e5de450e.png",
  avatarB:
    "http://localhost:3845/assets/97658fca33fb8976d18773f7d5ef527f8d3a91a5.png",
} as const;

const navLinks = [
  { href: "/?tab=trending", label: "Trending" },
  { href: "/explore", label: "Explore" },
  { href: "/topics", label: "Topics" },
] as const;

export function OpenLogHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1083px] items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-black text-[13px] font-semibold text-white">
              O
            </span>
            <span className="text-[18px] font-semibold tracking-tight">
              OpenLog
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  item.label === "Trending" && "text-zinc-950"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar className="hidden md:block" />

          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconBell className="size-5" />
            <span className="absolute right-[9px] top-[9px] size-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <Link
            href="/profile"
            aria-label="Your profile"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <Image
              src={openLogAssets.avatarA}
              alt="Profile avatar"
              width={32}
              height={32}
              className="size-8 rounded-full border border-zinc-200 object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function OpenLogFooter() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto flex w-full max-w-[1083px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
          <span className="grid size-6 place-items-center rounded-md bg-black text-[12px] font-semibold text-white">
            O
          </span>
          OpenLog
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
          <span>© 2026 OpenLog. Collective Knowledge Platform.</span>
          <Link href="/terms" className="hover:text-zinc-950">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-zinc-950">
            Privacy
          </Link>
          <Link href="/status" className="hover:text-zinc-950">
            Status
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SearchBar({ className }: { className?: string }) {
  return (
    <form action="/" method="GET" className={cn("w-[320px]", className)}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <IconSearch className="size-4" />
        </span>
        <input
          name="q"
          type="search"
          placeholder="Search..."
          className="h-9 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>
    </form>
  );
}

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 19a8 8 0 100-16 8 8 0 000 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

