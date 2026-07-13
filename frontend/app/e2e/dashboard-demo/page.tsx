"use client";

import { WorkspaceDashboardView } from "@/widgets/home-feed/ui/WorkspaceDashboardView";
import type { WorkspaceUiData } from "@/widgets/home-feed/ui/workspaceTypes";

const fixture: WorkspaceUiData = {
  workspaceId: "demo-workspace",
  workspaceName: "openlog",
  repositoryFullName: "kitae9999/openlog",
  tasks: [
    {
      id: "task-1",
      title: "Working brief API 연동",
      status: "doing",
      body: "## Context\nAgent session brief.",
      description: "push_working_brief 결과를 대시보드 Now working에 반영한다.",
    },
    {
      id: "task-2",
      title: "프로필 UI flat 리디자인",
      status: "todo",
      body: "## Goal\nRemove card chrome.",
    },
    {
      id: "task-3",
      title: "MCP guide 문서 정리",
      status: "done",
      body: "## Done",
    },
    {
      id: "task-4",
      title: "Activity heatmap 분리",
      status: "todo",
      body: "",
    },
    {
      id: "task-5",
      title: "Graph 페이지 성능",
      status: "todo",
      body: "",
    },
  ],
  logs: [
    {
      id: "log-1",
      tone: "zinc",
      label: "decision",
      title: "Dashboard는 Status Brief 중심으로",
      description: "카드 위젯보드 대신 brief-first.",
      meta: "14:02 · feature/workspace",
      href: "/logs/log-1",
      taskId: "task-1",
      branch: "feature/workspace",
      createdAt: "2026-07-13T14:02:00Z",
    },
    {
      id: "log-2",
      tone: "zinc",
      label: "fix",
      title: "Working brief PUT 응답 매핑 수정",
      description: "null catch",
      meta: "13:40 · feature/workspace",
      href: "/logs/log-2",
      taskId: "task-1",
      createdAt: "2026-07-13T13:40:00Z",
    },
    {
      id: "log-3",
      tone: "zinc",
      label: "issue",
      status: "OPEN",
      title: "사이드바 MCP footer 데모 카피 제거 필요",
      description: "",
      meta: "Yesterday · main",
      href: "/logs/log-3",
      createdAt: "2026-07-12T10:00:00Z",
    },
    {
      id: "log-4",
      tone: "zinc",
      label: "note",
      title: "프로필 메타 구분선 추가",
      description: "",
      meta: "Yesterday",
      href: "/logs/log-4",
      taskId: "task-2",
      createdAt: "2026-07-12T09:00:00Z",
    },
    {
      id: "log-5",
      tone: "zinc",
      label: "issue",
      status: "OPEN",
      title: "List/Graph 탭 인디케이터 정렬",
      description: "",
      meta: "2d ago",
      href: "/logs/log-5",
      createdAt: "2026-07-11T12:00:00Z",
    },
    {
      id: "log-6",
      tone: "zinc",
      label: "fix",
      title: "Comments 섹션 flat 정리",
      description: "",
      meta: "3d ago",
      href: "/logs/log-6",
      createdAt: "2026-07-10T12:00:00Z",
    },
  ],
  outputs: [],
  todos: [
    { id: "todo-1", title: "Dashboard demo 가독성 점검", done: false },
    { id: "todo-2", title: "사이드바 DEMO 섹션 위치 조정", done: false },
    { id: "todo-3", title: "heatmap을 Activity로만 유지", done: false },
    { id: "todo-4", title: "완료된 할일 숨김 확인", done: true },
  ],
  taskLinks: [],
  logLinks: [],
  memories: [
    {
      id: "mem-1",
      title: "Working brief는 로그가 아니다",
      content: "",
      excerpt: "",
      task: null,
      originLog: null,
      createdAt: "2026-07-13T00:00:00Z",
      updatedAt: "2026-07-13T00:00:00Z",
    },
    {
      id: "mem-2",
      title: "공개 표면은 white flat",
      content: "",
      excerpt: "",
      task: null,
      originLog: null,
      createdAt: "2026-07-13T00:00:00Z",
      updatedAt: "2026-07-13T00:00:00Z",
    },
  ],
  workingBrief: {
    title: "Status Brief를 대시보드 중심에",
    prose:
      "카드 위젯보드를 걷어내고 Now working brief → Tasks/Todos → Recent logs 순으로 읽히게 재구성 중. Activity·Graph는 하단 링크로만 남긴다.",
    taskId: "task-1",
    taskTitle: "Working brief API 연동",
    branch: "feature/workspace",
    updatedLabel: "14:02",
  },
};

const activityFixture = {
  from: "2025-07-14",
  to: "2026-07-13",
  totalLogCount: 12,
  days: [
    { date: "2026-07-10", logCount: 1 },
    { date: "2026-07-11", logCount: 1 },
    { date: "2026-07-12", logCount: 2 },
    { date: "2026-07-13", logCount: 2 },
    { date: "2026-06-20", logCount: 1 },
    { date: "2026-05-03", logCount: 3 },
    { date: "2026-03-18", logCount: 1 },
    { date: "2026-01-08", logCount: 2 },
    { date: "2025-11-22", logCount: 1 },
    { date: "2025-09-14", logCount: 1 },
  ],
};

export default function WorkspaceDashboardE2EPage() {
  return (
    <main
      data-testid="workspace-dashboard-fixture"
      className="min-h-dvh bg-app px-6 py-8 text-zinc-950"
    >
      <WorkspaceDashboardView
        workspaceData={fixture}
        activity={activityFixture}
      />
    </main>
  );
}
