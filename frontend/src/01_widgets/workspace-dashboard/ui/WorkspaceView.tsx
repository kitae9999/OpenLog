import Image from "next/image";
import Link from "next/link";
import { handleOAuth } from "@/features/auth/api/handleOAuth";
import { GitHubIcon } from "@/shared/ui/icons";
import type { PreviewReplaySnapshot } from "@/widgets/workspace-preview/model/previewSessionReplay";
import { WorkspaceDashboardView } from "@/widgets/workspace-dashboard/ui/WorkspaceDashboardView";
import type { WorkspaceActionResult } from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceActivity, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function WorkspaceView({
  isLoggedIn,
  workspaceData,
  activity,
  createTodoOverride,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
  activity?: WorkspaceActivity | null;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
}) {
  if (isLoggedIn) {
    return (
      <WorkspaceDashboardView
        workspaceData={workspaceData ?? null}
        activity={activity}
        createTodoOverride={createTodoOverride}
      />
    );
  }

  return <GuestWorkspaceEmpty />;
}

/** Dashboard canvas used inside the landing session demo browser pane. */
export function PreviewWorkspaceDashboard({
  replaySnapshot,
}: {
  replaySnapshot: PreviewReplaySnapshot;
}) {
  return (
    <WorkspaceDashboardView
      replaySnapshot={replaySnapshot}
      workspaceData={null}
    />
  );
}

function GuestWorkspaceEmpty() {
  return (
    <section
      aria-label="Workspace sign-in"
      className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24"
    >
      <h2 className="text-[32px] leading-[1.15] font-bold tracking-tight text-zinc-950 sm:text-[36px]">
        Work first.
        <br />
        Writing follows.
      </h2>
      <p className="mt-4 text-[15px] leading-6 text-zinc-500">
        Sign in to open your workspace — tasks, logs, and drafts stay with your
        account.
      </p>
      <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
        <button
          type="button"
          onClick={() => handleOAuth("GITHUB")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <GitHubIcon className="size-4" />
          Continue with GitHub
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("GOOGLE")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <Image
            src="/google.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
            className="size-4"
          />
          Continue with Google
        </button>
      </div>
      <div
        className="mt-6 h-px w-16 bg-zinc-200"
        aria-hidden="true"
      />
      <Link
        href="/#session"
        className="mt-4 text-sm font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        See how it works
      </Link>
    </section>
  );
}
