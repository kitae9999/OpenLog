"use client";

import { useActionState } from "react";
import {
  approveCliLogin,
  type CliLoginApprovalState,
} from "@/app/cli-login/actions";

const initialState: CliLoginApprovalState = {
  status: "idle",
  message: null,
};

export function CliLoginApprovalForm({
  userCode,
  accountLabel,
}: {
  userCode: string;
  accountLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    approveCliLogin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="userCode" value={userCode} />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Account
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-950">
          {accountLabel}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || state.status === "success"}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isPending
          ? "Approving..."
          : state.status === "success"
            ? "Approved"
            : "Approve CLI login"}
      </button>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

