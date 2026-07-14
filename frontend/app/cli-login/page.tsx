import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/features/auth/api/getUser";
import { API_CONFIG } from "@/shared/api";
import { logoMarkClassName } from "@/shared/config/brand";
import { cn } from "@/shared/lib/cn";
import { CliLoginApprovalForm } from "./CliLoginApprovalForm";

export const metadata: Metadata = {
  title: "CLI Login | OpenLog",
  description: "Approve OpenLog CLI access.",
};

export default async function CliLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const sp = await searchParams;
  const userCode = normalizeUserCode(sp?.code);
  const user = await getOptionalUser();

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[720px] flex-col justify-center">
        <div className="border border-zinc-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                OpenLog CLI
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                Authorize terminal access
              </h1>
            </div>
            <div
              className={cn(
                "grid size-12 shrink-0 place-items-center bg-zinc-950 text-xl text-white",
                logoMarkClassName,
              )}
            >
              O
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-8">
            {!userCode ? (
              <InvalidCodeState />
            ) : user ? (
              user.isOnboardingComplete ? (
                <ApproveState
                  userCode={userCode}
                  accountLabel={
                    user.username ?? user.nickname ?? user.email ?? "OpenLog user"
                  }
                />
              ) : (
                <IncompleteOnboardingState />
              )
            ) : (
              <LoginState userCode={userCode} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

async function getOptionalUser() {
  try {
    return await getUser();
  } catch {
    return null;
  }
}

function ApproveState({
  userCode,
  accountLabel,
}: {
  userCode: string;
  accountLabel: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-500">Approval code</p>
        <code className="w-fit border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-lg font-semibold tracking-[0.12em] text-zinc-950">
          {userCode}
        </code>
      </div>

      <CliLoginApprovalForm userCode={userCode} accountLabel={accountLabel} />
    </>
  );
}

function LoginState({ userCode }: { userCode: string }) {
  const returnTo = `/cli-login?code=${encodeURIComponent(userCode)}`;
  const googleHref = buildAuthHref("/auth/google", returnTo);
  const githubHref = buildAuthHref("/auth/github", returnTo);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Approval code</p>
        <code className="mt-3 inline-block border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-lg font-semibold tracking-[0.12em] text-zinc-950">
          {userCode}
        </code>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={googleHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50"
        >
          Continue with Google
        </a>
        <a
          href={githubHref}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#24292f] px-5 text-sm font-semibold text-white transition hover:bg-[#1b2027]"
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}

function InvalidCodeState() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-7 text-zinc-600">
        CLI approval code is missing or invalid.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 w-fit items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50"
      >
        Go home
      </Link>
    </div>
  );
}

function IncompleteOnboardingState() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-7 text-zinc-600">
        Finish your OpenLog profile before approving CLI access.
      </p>
      <Link
        href="/onboarding"
        className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Continue
      </Link>
    </div>
  );
}

function normalizeUserCode(value: string | undefined): string | null {
  const userCode = value?.trim().toUpperCase();

  if (!userCode || !/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(userCode)) {
    return null;
  }

  return userCode;
}

function buildAuthHref(path: string, returnTo: string): string {
  const url = new URL(`${API_CONFIG.baseURL.replace(/\/$/, "")}${path}`);
  url.searchParams.set("returnTo", returnTo);

  return url.toString();
}
