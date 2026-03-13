import { API_CONFIG } from "@/shared/lib/api";
import type { AuthMode, OAuthProvider } from "@/features/auth/model/auth.type";

const providerPath = {
  GOOGLE: "google",
  GITHUB: "github",
} satisfies Record<OAuthProvider, string>;

export const handleOAuth = (provider: OAuthProvider, action: AuthMode) => {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = new URL(
    `/api/auth/${providerPath[provider]}`,
    API_CONFIG.baseURL,
  );

  endpoint.search = new URLSearchParams({
    intent: action === "signup" ? "register" : "login",
  }).toString();

  window.location.assign(endpoint.toString());
};
