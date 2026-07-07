"use client";

import { GitHubIcon } from "@/shared/ui/icons";
import { useActiveWorkspace } from "./useActiveWorkspace";

export function WorkspaceRepositoryLink() {
  const workspace = useActiveWorkspace();
  const repoUrl = `https://github.com/${workspace.repositoryFullName}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="px-4 py-3 sm:px-[18px]">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-w-0 items-center gap-3 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white transition group-hover:bg-zinc-800">
            <GitHubIcon className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-zinc-950 transition group-hover:text-zinc-700">
              {workspace.repositoryFullName}
            </span>
            <span className="block text-[12px] text-zinc-400">
              Connected repository on GitHub
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
