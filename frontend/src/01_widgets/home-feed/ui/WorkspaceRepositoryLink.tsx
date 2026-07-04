"use client";

import { useActiveWorkspace } from "./useActiveWorkspace";

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .75a11.25 11.25 0 00-3.556 21.922c.563.103.769-.244.769-.544 0-.269-.01-.981-.015-1.926-3.127.68-3.787-1.506-3.787-1.506-.512-1.303-1.25-1.65-1.25-1.65-1.022-.698.078-.684.078-.684 1.13.08 1.725 1.16 1.725 1.16 1.004 1.72 2.634 1.223 3.276.935.102-.727.393-1.223.715-1.504-2.496-.284-5.122-1.248-5.122-5.555 0-1.227.438-2.23 1.157-3.016-.116-.284-.501-1.43.109-2.98 0 0 .943-.302 3.09 1.152A10.76 10.76 0 0112 6.188c.952.004 1.91.129 2.805.378 2.146-1.454 3.087-1.152 3.087-1.152.612 1.55.227 2.696.112 2.98.72.786 1.155 1.79 1.155 3.016 0 4.318-2.631 5.268-5.136 5.546.404.348.764 1.035.764 2.087 0 1.507-.013 2.723-.013 3.094 0 .302.203.652.775.542A11.251 11.251 0 0012 .75z" />
    </svg>
  );
}

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
            <IconGitHub className="size-[18px]" />
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
