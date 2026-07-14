import { loadWorkspacePageData } from "@/entities/workspace/api/workspaceApi";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export type AppChromeWorkspaceProps = {
  workspaces: ManagedWorkspace[];
  workspaceData: WorkspaceUiData | null;
};

export async function loadAppChromeWorkspace(
  isLoggedIn: boolean,
): Promise<AppChromeWorkspaceProps> {
  if (!isLoggedIn) {
    return { workspaces: [], workspaceData: null };
  }

  const page = await loadWorkspacePageData();
  return {
    workspaces: page.workspaces,
    workspaceData: page.workspaceData,
  };
}
