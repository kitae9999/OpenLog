import Image from "next/image";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { topContributors } from "./data";

export function TopContributors() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-400">
          TOP CONTRIBUTORS
        </h2>
        <span className="text-zinc-400">
          <GitPullRequestIcon className="size-4" />
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {topContributors.map((person, idx) => (
          <div
            key={`${person.name}-${idx}`}
            className="flex items-center gap-3"
          >
            <Image
              src={person.avatar}
              alt={`${person.name} avatar`}
              width={36}
              height={36}
              className="size-9 rounded-full border border-zinc-200 object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {person.name}
              </p>
              <p className="truncate text-xs text-zinc-500">{person.summary}</p>
            </div>

            <button
              type="button"
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
