import { API_CONFIG } from "@/shared/lib/api";
import type { AuthMode, OAuthProvider } from "@/features/auth/model/auth.type";

const providerPath = {
  GOOGLE: "google",
  GITHUB: "github",
} satisfies Record<OAuthProvider, string>;

export const handleOAuth = (provider: OAuthProvider) => {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = new URL(
    `/api/auth/${providerPath[provider]}`,
    API_CONFIG.baseURL,
  );

  window.location.assign(endpoint.toString());
};
