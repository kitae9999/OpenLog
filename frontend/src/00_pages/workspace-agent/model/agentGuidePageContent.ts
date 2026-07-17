export type AgentGuidePageLocale = "en" | "ko";

export const AGENT_GUIDE_PAGE_LOCALES: Array<{
  key: AgentGuidePageLocale;
  label: string;
}> = [
  { key: "en", label: "ENG" },
  { key: "ko", label: "KOR" },
];

export const agentGuidePageCopy = {
  en: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "Agent Guide",
    headerSubtitle:
      "One workspace guide governs every connected project. Capture Mode decides when each project may turn that guidance into Task, Log, and Output drafts.",
    whatIs: {
      title: "What is Agent Guide",
      lead: "A durable policy document that agents load at the start of every OpenLog session. It tells them what this workspace is for, what is worth recording, and how to choose among Tasks, Logs, and Outputs.",
      points: [
        {
          title: "Loaded every session",
          body: "When an agent calls start_openlog_session, the latest Guide is returned with Capture Mode so the agent does not guess your preferences.",
        },
        {
          title: "Write the Guide in English",
          body: "Keep the Guide itself in English so agents follow it reliably. Workspace documents (Tasks, Logs, Outputs, Memories) can still be written in Korean.",
        },
        {
          title: "Shared across projects",
          body: "Every connected project in this workspace shares one Guide. Capture Mode stays per project and controls how proactive the agent may be.",
        },
        {
          title: "Policy, not a chat log",
          body: "Put lasting recording rules and workspace purpose here. One-off knowledge belongs in NOTE Logs, not in the Guide.",
        },
      ],
    },
  },
  ko: {
    breadcrumbSettings: "Settings",
    breadcrumbCurrent: "Agent Guide",
    headerSubtitle:
      "워크스페이스당 Guide는 하나예요. 연결된 프로젝트는 이 Guide를 같이 쓰고, Capture Mode로 Task·Log·Output 초안을 언제 만들지 정해요.",
    whatIs: {
      title: "Agent Guide가 뭔가요?",
      lead: "에이전트가 OpenLog 세션을 시작할 때마다 불러오는 정책 문서예요. 이 워크스페이스가 무엇을 위한지, 무엇을 남길지, Task·Log·Output을 어떻게 고를지 알려줘요.",
      points: [
        {
          title: "세션마다 새로 불러와요",
          body: "에이전트가 start_openlog_session을 호출하면 최신 Guide와 Capture Mode가 함께 와요. 그래서 에이전트가 선호를 마음대로 추측하지 않아요.",
        },
        {
          title: "Guide 본문은 영어로 써요",
          body: "에이전트가 안정적으로 따르도록 Guide는 영어로 남겨요. Task·Log·Output·Memory 같은 워크스페이스 문서는 한글로 써도 괜찮아요.",
        },
        {
          title: "프로젝트마다 Guide를 나누지 않아요",
          body: "이 워크스페이스에 연결된 프로젝트는 Guide를 하나 공유해요. Capture Mode만 프로젝트별로 두어 에이전트가 얼마나 먼저 움직일지 조절해요.",
        },
        {
          title: "대화 기록이 아니라 정책이에요",
          body: "오래 남을 기록 규칙과 워크스페이스 목적만 여기에 남겨요. 일회성 지식은 Guide가 아니라 NOTE Log에 남겨요.",
        },
      ],
    },
  },
} as const;

export function parseAgentGuidePageLocale(
  value: string | null,
): AgentGuidePageLocale {
  return value === "ko" ? "ko" : "en";
}

export function buildAgentGuidePageHref(
  workspaceId: string | number,
  locale: AgentGuidePageLocale,
) {
  const base = `/settings/workspaces/${workspaceId}/agent`;
  return locale === "en" ? base : `${base}?lang=ko`;
}
