import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";

export type PublicUserPostGraphNode = {
  slug: string;
  title: string;
  description: string;
};

export type PublicUserPostGraphEdge = {
  sourceSlug: string;
  targetSlug: string;
  label: string;
};

export type PublicUserPostGraph = {
  nodes: PublicUserPostGraphNode[];
  edges: PublicUserPostGraphEdge[];
};

export async function getPublicUserPostGraph(username: string) {
  try {
    return await apiClient<PublicUserPostGraph>(
      `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}/post-graph`,
      {
        cache: "no-store",
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
