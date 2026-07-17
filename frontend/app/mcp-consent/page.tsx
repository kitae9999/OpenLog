import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getUser } from "@/features/auth/api/getUser";
import { API_CONFIG } from "@/shared/api";
import { OpenLogLogo } from "@/shared/ui/brand";
import { GitHubIcon } from "@/shared/ui/icons";
import { McpConsentForm, type ConsentChallenge } from "./McpConsentForm";

export const metadata: Metadata = {
  title: "MCP 연결 승인 | OpenLog",
  description: "OpenLog 원격 MCP 연결의 권한을 확인하고 승인합니다.",
  robots: { index: false, follow: false },
};

export default async function McpConsentPage({
  searchParams,
}: {
  searchParams?: Promise<{ challenge?: string }>;
}) {
  const challengeId = normalizeChallenge((await searchParams)?.challenge);
  const user = await getUser();

  let challenge: ConsentChallenge | null = null;
  if (challengeId && user?.isOnboardingComplete) {
    challenge = await getConsentChallenge(challengeId);
  }

  return (
    <main className="min-h-dvh bg-app px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[520px] flex-col justify-center">
        <div className="flex items-center gap-3">
          <OpenLogLogo variant="mark" className="size-8" decorative />
          <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
            OpenLog Remote MCP
          </p>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-8">
          {!challengeId ? (
            <InvalidChallengeState />
          ) : !user ? (
            <LoginState challengeId={challengeId} />
          ) : !user.isOnboardingComplete ? (
            <IncompleteOnboardingState />
          ) : challenge ? (
            <McpConsentForm challenge={challenge} />
          ) : (
            <InvalidChallengeState />
          )}
        </div>
      </section>
    </main>
  );
}

function LoginState({ challengeId }: { challengeId: string }) {
  const returnTo = `/mcp-consent?challenge=${encodeURIComponent(challengeId)}`;
  const googleHref = buildAuthHref("/auth/google", returnTo);
  const githubHref = buildAuthHref("/auth/github", returnTo);

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950 sm:text-[32px]">
        먼저 OpenLog에 로그인해요
      </h1>
      <p className="mt-2 text-[14.5px] leading-6 text-zinc-500">
        로그인하면 같은 승인 요청으로 돌아와요.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <a
          href={githubHref}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <GitHubIcon className="size-4" />
          GitHub로 계속
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
          Google로 계속
        </a>
      </div>
    </div>
  );
}

function IncompleteOnboardingState() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950 sm:text-[32px]">
        프로필 설정을 먼저 마쳐요
      </h1>
      <p className="text-[14.5px] leading-6 text-zinc-500">
        워크스페이스가 준비된 뒤에 MCP 연결을 승인할 수 있어요.
      </p>
      <Link
        href="/onboarding"
        className="inline-flex cursor-pointer text-[13px] font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        온보딩 계속 →
      </Link>
    </div>
  );
}

function InvalidChallengeState() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950 sm:text-[32px]">
        승인 요청이 만료됐거나 올바르지 않아요
      </h1>
      <p className="text-[14.5px] leading-6 text-zinc-500">
        에이전트에서 OpenLog 연결을 다시 시작해 주세요.
      </p>
      <Link
        href="/settings/mcp-guide"
        className="inline-flex cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        연결 가이드 보기 →
      </Link>
    </div>
  );
}

async function getConsentChallenge(
  challengeId: string,
): Promise<ConsentChallenge | null> {
  const headerStore = await headers();
  const url = new URL(
    `${API_CONFIG.baseURL.replace(/\/$/, "")}/oauth2/consent`,
  );
  url.searchParams.set("challenge", challengeId);

  const response = await fetch(url, {
    cache: "no-store",
    headers: { cookie: headerStore.get("cookie") ?? "" },
  });
  if (!response.ok) return null;
  return (await response.json()) as ConsentChallenge;
}

function normalizeChallenge(value: string | undefined): string | null {
  const challenge = value?.trim();
  return challenge && /^[A-Za-z0-9_-]{32,128}$/.test(challenge)
    ? challenge
    : null;
}

function buildAuthHref(path: string, returnTo: string): string {
  const url = new URL(`${API_CONFIG.baseURL.replace(/\/$/, "")}${path}`);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}
