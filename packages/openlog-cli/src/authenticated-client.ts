import { OpenLogApiClient, type RefreshedTokens } from "./api-client.js";
import {
  readAuthFile,
  updateAuthFileTokens,
  type AuthFile,
} from "./auth-store.js";

let cachedClient:
  | {
      fingerprint: string;
      client: OpenLogApiClient;
    }
  | undefined;

export async function createAuthenticatedApiClient(): Promise<OpenLogApiClient> {
  const authFile = await readAuthFile();
  if (!authFile) {
    throw new Error("Run `openlog login` before using OpenLog.");
  }

  const fingerprint = authFingerprint(authFile);
  if (cachedClient?.fingerprint === fingerprint) {
    return cachedClient.client;
  }

  const client = new OpenLogApiClient({
    accessToken: authFile.accessToken,
    refreshToken: authFile.refreshToken,
    apiBaseUrl: authFile.apiBaseUrl,
    onTokenRefresh: async (tokens) => {
      const updatedAuthFile = await updateAuthFileTokens(authFile, tokens);
      cachedClient = {
        fingerprint: authFingerprint(updatedAuthFile),
        client,
      };
    },
  });
  cachedClient = { fingerprint, client };
  return client;
}

function authFingerprint(authFile: AuthFile): string {
  return [
    authFile.apiBaseUrl,
    authFile.accessToken,
    authFile.refreshToken ?? "",
  ].join("\u0000");
}

export type { RefreshedTokens };
