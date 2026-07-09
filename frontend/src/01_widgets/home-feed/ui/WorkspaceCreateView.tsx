"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { getTabHref } from "./data";
import { createWorkspace } from "./workspaceActions";
import { setActiveWorkspaceId } from "./workspaceSelection";
import { notifyWorkspaceChange } from "./useActiveWorkspace";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const REPO_FULL_NAME_PATTERN =
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

/** Normalize GitHub URL or owner/repo into owner/repo. Empty → null. */
function normalizeRepoFullName(value: string): {
  repoFullName: string | null;
  error: string | null;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { repoFullName: null, error: null };
  }

  let candidate = trimmed.replace(/\/+$/, "").replace(/\.git$/i, "");

  const httpsMatch = candidate.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/#?]+)/i,
  );
  if (httpsMatch) {
    candidate = `${httpsMatch[1]}/${httpsMatch[2]}`;
  } else {
    const sshMatch = candidate.match(
      /^git@github\.com:([^/]+)\/([^/#?]+)/i,
    );
    if (sshMatch) {
      candidate = `${sshMatch[1]}/${sshMatch[2]}`;
    }
  }

  if (!REPO_FULL_NAME_PATTERN.test(candidate)) {
    return {
      repoFullName: null,
      error: "Use a GitHub URL or owner/repo.",
    };
  }

  return { repoFullName: candidate, error: null };
}

export function WorkspaceCreateView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [repoTouched, setRepoTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim().toLowerCase();
  const normalizedRepo = useMemo(
    () => normalizeRepoFullName(repoInput),
    [repoInput],
  );

  const slugError = useMemo(() => {
    if (!trimmedSlug) {
      return "Slug is required.";
    }
    if (!SLUG_PATTERN.test(trimmedSlug)) {
      return "Use lowercase letters, numbers, and hyphens.";
    }
    return null;
  }, [trimmedSlug]);

  const canSubmit =
    trimmedName.length > 0 && !slugError && !normalizedRepo.error;

  function handleNameChange(nextName: string) {
    setName(nextName);
    setErrorMessage(null);

    if (!slugTouched) {
      setSlug(slugify(nextName));
    }
  }

  function handleSlugChange(nextSlug: string) {
    setSlugTouched(true);
    setSlug(nextSlug.toLowerCase());
    setErrorMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isPending) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await createWorkspace({
          name: trimmedName,
          slug: trimmedSlug,
          repoFullName: normalizedRepo.repoFullName,
        });

        if (!result.ok || !result.id) {
          setErrorMessage(result.message ?? "Failed to create workspace.");
          return;
        }

        setActiveWorkspaceId(result.id);
        notifyWorkspaceChange();
        router.push(result.href ?? "/");
        router.refresh();
      } catch {
        setErrorMessage("Failed to create workspace.");
      }
    });
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">New workspace</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
            New workspace
          </h1>
          <p className="mt-2 max-w-[54ch] text-[13.5px] leading-6 text-zinc-500">
            Create a workspace for tasks, logs, and outputs.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Field
            label="Name"
            htmlFor="workspace-name"
            hint="Shown in the sidebar and dashboard."
          >
            <input
              id="workspace-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="My project"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="workspace-slug"
            hint="Lowercase letters, numbers, and hyphens."
            error={trimmedSlug || slugTouched ? slugError : null}
          >
            <input
              id="workspace-slug"
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="my-project"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 font-mono text-[13.5px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          <Field
            label="Repository"
            htmlFor="workspace-repo"
            hint="Optional. Paste a GitHub URL or owner/repo."
            error={repoTouched || repoInput.trim() ? normalizedRepo.error : null}
          >
            <input
              id="workspace-repo"
              value={repoInput}
              onChange={(event) => {
                setRepoTouched(true);
                setRepoInput(event.target.value);
                setErrorMessage(null);
              }}
              placeholder="https://github.com/owner/repo"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 font-mono text-[13.5px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          {errorMessage ? (
            <p className="text-xs font-medium leading-5 text-rose-600">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-5">
            <Link
              href={getTabHref("workspace", isLoggedIn)}
              className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="inline-flex h-9 items-center rounded-xl bg-zinc-950 px-3.5 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isPending ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold text-zinc-950"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
