import { API_CONFIG } from "@/shared/api";
import type { OAuthProvider } from "@/features/auth/model/auth.type";

const providerOAuthPath = {
  GOOGLE: "/api/auth/google",
  GITHUB: "/api/auth/github",
} satisfies Record<OAuthProvider, string>;

export const handleOAuth = (provider: OAuthProvider, returnTo?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const endpoint = new URL(
    providerOAuthPath[provider],
    API_CONFIG.baseURL,
  );
  if (returnTo) {
    endpoint.searchParams.set("returnTo", returnTo);
  }

  window.location.assign(endpoint.toString());
};

