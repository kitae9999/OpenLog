import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "./data";
import type {
  WorkspaceLogLinkItem,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
} from "./workspaceTypes";

/** Guest Workspace preview only — not used as logged-in fallback mock. */
export const previewDemoRepository = {
  fullName: "sample/notes-app",
  caption: "Example workspace — yours stays private",
} as const;

export const previewTasks: WorkspaceWorkItem[] = [
  {
    id: "share-link",
    title: "노트 공유 링크 만들기",
    description: "친구에게 노트를 보낼 때 읽기 전용 링크가 필요합니다.",
    status: "doing",
    body: `## Context

친구에게 노트를 보낼 때 읽기 전용 링크가 필요합니다.

## Goal

- 공유 링크 생성
- 링크만으로 노트 읽기
- 만료일 설정`,
  },
  {
    id: "dark-mode",
    title: "다크 모드 지원",
    description: "야간에도 편하게 노트를 읽고 쓸 수 있게 합니다.",
    status: "done",
    body: `## Context

야간에도 편하게 노트를 읽고 쓸 수 있게 합니다.

## Goal

- 시스템 설정 따라가기
- 수동 토글`,
  },
  {
    id: "search-notes",
    title: "노트 검색 추가",
    description: "제목과 본문으로 노트를 빠르게 찾습니다.",
    status: "todo",
    body: "",
  },
];

export const previewLogs: WorkspaceLogItem[] = [
  {
    id: "share-token-fix",
    tone: "green",
    label: "Fix",
    title: "공유 링크가 만료된 뒤에도 열리던 버그",
    description: "만료 시각 비교를 UTC로 통일해 해결했습니다.",
    meta: "Today 14:20 · auto-captured",
    commit: "a1b2c3d",
    href: "/write",
    taskId: "share-link",
    branch: "feat/share-link",
  },
  {
    id: "share-decision",
    tone: "blue",
    label: "Decision",
    title: "공유는 읽기 전용으로만 열기",
    description: "편집은 본인만, 링크로는 보기만 가능하게 하기로 했습니다.",
    meta: "Today 11:05 · auto-captured",
    commit: "d4e5f6a",
    href: "/write",
    taskId: "share-link",
    branch: "feat/share-link",
  },
  {
    id: "dark-mode-log",
    tone: "zinc",
    label: "Log",
    title: "다크 모드 토글과 시스템 설정 연동",
    description: "첫 방문은 OS 설정을 따르고, 이후에는 사용자 선택을 기억합니다.",
    meta: "Yesterday",
    commit: "b7c8d9e",
    href: "/write",
    taskId: "dark-mode",
    branch: "feat/dark-mode",
  },
  {
    id: "share-preview-issue",
    tone: "amber",
    label: "Issue",
    title: "공유 미리보기에 제목이 안 보임",
    description: "카톡·슬랙 미리보기에 노트 제목 대신 기본 문구가 나옵니다.",
    meta: "open 2d · feat/share-link",
    href: "/write",
    taskId: "share-link",
    branch: "feat/share-link",
    status: "OPEN",
  },
];

export const previewTodos: WorkspaceTodoItem[] = [
  {
    id: "preview-todo-expiry",
    title: "공유 링크 만료일 UI 다듬기",
    description: "from log",
    done: true,
    taskId: "share-link",
  },
  {
    id: "preview-todo-copy",
    title: "링크 복사 버튼에 완료 토스트 넣기",
    taskId: "share-link",
  },
  {
    id: "preview-todo-search",
    title: "검색어 하이라이트 방식 정하기",
    description: "suggested by AI",
    taskId: "search-notes",
  },
];

export const previewMemories = [
  {
    title: "공유 링크는 읽기 전용",
    description: "편집 권한은 계정 로그인 후에만 줍니다.",
    source: "decision",
    reads: "8 reads",
  },
  {
    title: "다크 모드는 OS 설정을 기본값으로",
    description: "사용자가 바꾸기 전까지는 시스템 테마를 따릅니다.",
    source: "recipe",
    reads: "3 reads",
  },
] as const;

export type PreviewMemory = (typeof previewMemories)[number];

export const previewOutputs: WorkspaceTaskOutput[] = [
  {
    id: "share-link-post",
    taskId: "share-link",
    taskIds: ["share-link"],
    logIds: ["share-token-fix", "share-decision", "share-preview-issue"],
    status: "draft",
    title: "How we built read-only share links",
    description: "from 3 logs",
    content: `## Summary

Share links stay read-only, expire on a UTC clock, and surface the note title in previews.`,
    updatedLabel: "Today",
  },
];

export const previewTaskLinks: WorkspaceTaskLinkItem[] = [
  {
    id: "preview-task-link-1",
    fromTaskId: "share-link",
    toTaskId: "search-notes",
    relation: "RELATES_TO",
  },
];

export const previewLogLinks: WorkspaceLogLinkItem[] = [
  {
    id: "preview-log-link-1",
    fromLogId: "share-token-fix",
    toLogId: "share-preview-issue",
    relation: "FIXES",
  },
];

/** Shared mock workspace for guest preview + landing graph demo. */
export function getPreviewWorkspaceData(): WorkspaceUiData {
  return {
    workspaceId: "preview-demo",
    workspaceName: "notes-app",
    repositoryFullName: previewDemoRepository.fullName,
    tasks: previewTasks,
    logs: previewLogs,
    todos: previewTodos,
    outputs: previewOutputs,
    taskLinks: previewTaskLinks,
    logLinks: previewLogLinks,
  };
}
