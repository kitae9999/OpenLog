import { cn } from "@/shared/lib/cn";

export function SearchBar({ className }: { className?: string }) {
  return (
    <form action="/" method="GET" className={cn("w-[256px]", className)}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <IconSearch className="size-4" />
        </span>
        <input
          name="q"
          type="search"
          placeholder="Search..."
          className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>
    </form>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
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
