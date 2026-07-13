import "server-only";

import { redirect } from "next/navigation";
import type { WorkspaceUiData } from "./workspaceTypes";
import type { WorkspacePageData } from "./workspaceApi";

export function requireWorkspaceData(
  pageData: WorkspacePageData,
): WorkspaceUiData {
  if (pageData.workspaceData) {
    return pageData.workspaceData;
  }

  if (pageData.status === "empty") {
    redirect("/workspaces/new");
  }

  throw new Error("워크스페이스 데이터를 불러오지 못했습니다.");
}
