import { API_CONFIG } from "@/shared/api";
import type { OAuthProvider } from "@/features/auth/model/auth.type";

const providerOAuthPath = {
  GOOGLE: "/api/auth/google",
  GITHUB: "/api/oauth2/authorization/github",
} satisfies Record<OAuthProvider, string>;

export const handleOAuth = (provider: OAuthProvider) => {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = new URL(
    providerOAuthPath[provider],
    API_CONFIG.baseURL,
  );

  window.location.assign(endpoint.toString());
};
