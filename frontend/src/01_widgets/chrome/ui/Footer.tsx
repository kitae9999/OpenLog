import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto flex w-full max-w-[1083px] flex-wrap gap-6 px-4 py-8 text-sm text-zinc-500 sm:px-8">
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
    </footer>
  );
}
