export const OAUTH_PROVIDERS = ["GOOGLE", "GITHUB"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type AuthMode = "login" | "signup";
