import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/features/auth/api/getUser";
import { API_CONFIG } from "@/shared/api";
import { OpenLogLogo } from "@/shared/ui/brand";
import { GitHubIcon } from "@/shared/ui/icons";
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
    <main className="min-h-dvh bg-white px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[480px] flex-col justify-center">
        <div className="flex items-center gap-3">
          <OpenLogLogo variant="mark" className="size-8" decorative />
          <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
            OpenLog CLI
          </p>
        </div>

        <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-zinc-950 sm:text-[32px]">
          Authorize terminal access
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-zinc-500">
          Approve this device so the CLI can use your OpenLog workspace.
        </p>

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
    <div className="flex flex-col gap-6">
      <CodeField label="Approval code" value={userCode} />
      <CliLoginApprovalForm userCode={userCode} accountLabel={accountLabel} />
    </div>
  );
}

function LoginState({ userCode }: { userCode: string }) {
  const returnTo = `/cli-login?code=${encodeURIComponent(userCode)}`;
  const googleHref = buildAuthHref("/auth/google", returnTo);
  const githubHref = buildAuthHref("/auth/github", returnTo);

  return (
    <div className="flex flex-col gap-6">
      <CodeField label="Approval code" value={userCode} />

      <div className="flex flex-col gap-3">
        <a
          href={githubHref}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <GitHubIcon className="size-4" />
          Continue with GitHub
        </a>
        <a
          href={googleHref}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
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
        </a>
      </div>
    </div>
  );
}

function InvalidCodeState() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14.5px] leading-6 text-zinc-600">
        CLI approval code is missing or invalid.
      </p>
      <Link
        href="/"
        className="inline-flex cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        ← Go home
      </Link>
    </div>
  );
}

function IncompleteOnboardingState() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14.5px] leading-6 text-zinc-600">
        Finish your OpenLog profile before approving CLI access.
      </p>
      <Link
        href="/onboarding"
        className="inline-flex cursor-pointer text-[13px] font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        Continue →
      </Link>
    </div>
  );
}

function CodeField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
        {label}
      </p>
      <code className="mt-2 block border-0 border-b border-zinc-200 bg-transparent py-2 font-mono text-[18px] font-semibold tracking-[0.14em] text-zinc-950">
        {value}
      </code>
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
