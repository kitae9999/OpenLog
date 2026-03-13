import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { logoMarkClassName, logoWordmarkClassName } from "./brand";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto flex w-full max-w-[1083px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2 text-zinc-950">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-md bg-black text-[12px] text-white",
              logoMarkClassName,
            )}
          >
            O
          </span>
          <span className={logoWordmarkClassName}>OpenLog</span>
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
