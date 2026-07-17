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
    <main className="min-h-dvh bg-zinc-100 px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[560px] flex-col justify-center">
        <div className="border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
          <header className="border-b border-zinc-200 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <OpenLogLogo variant="mark" className="size-8" decorative />
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-zinc-950">
                  OpenLog Remote MCP
                </p>
                <p className="font-mono text-[10px] tracking-[0.12em] text-emerald-700">
                  OAUTH CONNECTION
                </p>
              </div>
            </div>
          </header>

          <div className="px-6 py-7 sm:px-8 sm:py-8">
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
      <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-zinc-400">
        SIGN IN REQUIRED
      </p>
      <h1 className="mt-3 text-[25px] font-semibold tracking-[-0.025em]">
        먼저 OpenLog에 로그인하세요.
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-zinc-500">
        로그인 후 같은 승인 요청으로 돌아옵니다.
      </p>
      <div className="mt-7 grid gap-2">
        <a
          href={githubHref}
          className="inline-flex h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
        >
          <GitHubIcon className="size-4" />
          GitHub로 계속
        </a>
        <a
          href={googleHref}
          className="inline-flex h-11 items-center justify-center gap-2 border border-zinc-300 bg-white px-5 text-[13px] font-semibold text-zinc-800 transition hover:border-zinc-500"
        >
          <Image
            src="/google.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
          Google로 계속
        </a>
      </div>
    </div>
  );
}

function IncompleteOnboardingState() {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-amber-700">
        PROFILE REQUIRED
      </p>
      <h1 className="mt-3 text-[25px] font-semibold tracking-[-0.025em]">
        프로필 설정을 먼저 마쳐주세요.
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-zinc-500">
        워크스페이스가 준비된 뒤 MCP 연결을 승인할 수 있습니다.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 inline-flex h-11 items-center bg-zinc-950 px-5 text-[13px] font-semibold text-white"
      >
        온보딩 계속 →
      </Link>
    </div>
  );
}

function InvalidChallengeState() {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-red-600">
        INVALID REQUEST
      </p>
      <h1 className="mt-3 text-[25px] font-semibold tracking-[-0.025em]">
        승인 요청이 만료되었거나 올바르지 않습니다.
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-zinc-500">
        에이전트에서 OpenLog 연결을 다시 시작해 주세요.
      </p>
      <Link
        href="/settings/mcp-guide"
        className="mt-6 inline-flex text-[13px] font-semibold text-zinc-950"
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
