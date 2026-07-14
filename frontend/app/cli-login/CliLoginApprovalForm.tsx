"use client";

import { useActionState } from "react";
import {
  approveCliLogin,
  type CliLoginApprovalState,
} from "@/app/cli-login/actions";
import { cn } from "@/shared/lib/cn";

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

  const canSubmit = !isPending && state.status !== "success";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="userCode" value={userCode} />

      <div>
        <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
          Account
        </p>
        <p className="mt-2 border-0 border-b border-zinc-200 py-2 text-[15px] font-medium text-zinc-950">
          {accountLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
        <span className="text-[12.5px] text-zinc-500">
          {state.message && state.status === "error"
            ? null
            : state.status === "success"
              ? "You can return to the terminal."
              : "This grants CLI access to your account."}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            canSubmit
              ? "text-zinc-950 hover:text-zinc-700"
              : "cursor-not-allowed text-zinc-400",
          )}
        >
          {isPending
            ? "Approving..."
            : state.status === "success"
              ? "Approved"
              : "Approve CLI login"}
        </button>
      </div>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "text-[12.5px] font-medium",
            state.status === "error" ? "text-rose-600" : "text-zinc-500",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
