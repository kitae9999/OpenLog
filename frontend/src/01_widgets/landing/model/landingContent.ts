export type LandingLocale = "en" | "ko";

export const LANDING_LOCALES: Array<{ key: LandingLocale; label: string }> = [
  { key: "ko", label: "KOR" },
  { key: "en", label: "ENG" },
];

/** Display headlines stay English in both locales; bodies/UI chrome follow locale. */
export const landingCopy = {
  en: {
    nav: {
      session: "Session",
      graph: "Graph",
      publish: "Publish",
      signIn: "Sign in",
      getStarted: "Get started",
    },
    hero: {
      lines: [
        ["Work", "first."],
        ["Writing", "follows."],
      ] as const,
      subtitle:
        "OpenLog captures your development workflow context automatically, connecting tasks, logs, and decisions into publish-ready documentation.",
      startWriting: "Start writing",
      explorePosts: "Explore posts",
      noLoginNeeded: "No login needed",
    },
    session: {
      title: "A session becomes a draft",
      body: "Watch Claude Code talk through the work while OpenLog captures the task, logs, and links in the workspace.",
      guideCta: "MCP Guide →",
    },
    graph: {
      title: "Knowledge Graph",
      body: "Agents find related work and link it for you. Scattered pieces of work become visible at a glance.",
    },
    publish: {
      title: "Publish your context",
      body: "Turn what you lived through into a public post. What piled up in the workspace can publish like a developer blog.",
      steps: [
        {
          step: "01",
          title: "From the workspace",
          body: "Experience, fixes, and decisions you already recorded become the draft.",
        },
        {
          step: "02",
          title: "Publish the post",
          body: "Turn the trail you saved into a post — and share your experience and insights with others.",
        },
        {
          step: "03",
          title: "Open for review",
          body: "Readers can still send edit suggestions. You decide what sticks.",
        },
      ],
    },
    cta: {
      title: "Ready to log your work?",
      body: "Join developers building in public and tracking their knowledge as they work.",
      github: "Continue with GitHub",
      google: "Continue with Google",
      freeNote: "Free for personal use. No credit card required.",
    },
    footer: {
      blurb: "Work first. Writing follows.",
      product: "Product",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      rights: "All rights reserved.",
    },
  },
  ko: {
    nav: {
      session: "Session",
      graph: "Graph",
      publish: "Publish",
      signIn: "로그인",
      getStarted: "시작하기",
    },
    hero: {
      lines: [
        ["Work", "first."],
        ["Writing", "follows."],
      ] as const,
      subtitle:
        "일하면서 생긴 맥락을 알아서 모아 두고, 그게 나중에 글로 이어지게 해요.",
      startWriting: "시작하기",
      explorePosts: "글 둘러보기",
      noLoginNeeded: "No login needed",
    },
    session: {
      title: "A session becomes a draft",
      body: "에이전트랑 대화하듯 작업하면, OpenLog가 그 흐름을 워크스페이스에 정리해 둬요.",
      guideCta: "MCP Guide →",
    },
    graph: {
      title: "Knowledge Graph",
      body: "에이전트가 연관 있는 작업을 찾아서 이어 줘요. 파편처럼 흩어진 일도 한눈에 볼 수 있어요.",
    },
    publish: {
      title: "Publish your context",
      body: "겪은 일과 해결 과정을 공개 글로 남길 수 있어요. 워크스페이스에 쌓인 기록이, 그대로 블로그처럼 발행돼요.",
      steps: [
        {
          step: "01",
          title: "From the workspace",
          body: "이미 남겨 둔 경험과 해결, 판단이 초안이 돼요.",
        },
        {
          step: "02",
          title: "Publish the post",
          body: "쌓아 둔 맥락을 포스트로 작성할 수 있어요. 나만의 경험과 인사이트를 다른 사람과 나눌 수 있어요.",
        },
        {
          step: "03",
          title: "Open for review",
          body: "독자가 수정 제안을 보낼 수도 있어요. 받아들일지는 작성자가 정해요.",
        },
      ],
    },
    cta: {
      title: "Ready to log your work?",
      body: "Join developers building in public and tracking their knowledge as they work.",
      github: "Continue with GitHub",
      google: "Continue with Google",
      freeNote: "Free for personal use. No credit card required.",
    },
    footer: {
      blurb: "Work first. Writing follows.",
      product: "Product",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      rights: "All rights reserved.",
    },
  },
} as const;

export function parseLandingLocale(
  value: string | null | undefined,
): LandingLocale {
  return value === "en" ? "en" : "ko";
}

export function buildLandingHref(locale: LandingLocale) {
  return locale === "ko" ? "/" : "/?lang=en";
}
