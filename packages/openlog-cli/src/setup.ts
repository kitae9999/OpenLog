import { readAuthFile } from "./auth-store.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import {
  banner,
  dim,
  heading,
  kv,
  success,
} from "./cli-ui.js";
import { login } from "./login.js";
import { installMcp } from "./mcp-install.js";
import {
  DEFAULT_MCP_PERMISSION_PROFILE,
  isMcpPermissionProfile,
  readMcpPermissions,
  writeMcpPermissionProfile,
} from "./mcp-permissions.js";
import {
  choose,
  confirm,
  createPromptIo,
  InvalidChoiceError,
  type PromptIo,
} from "./prompt.js";

type SetupAgent = "all" | "codex" | "claude-code" | "cursor" | "skip";

export type SetupDeps = {
  isTTY: boolean;
  promptIo?: PromptIo;
  readAuth: typeof readAuthFile;
  login: typeof login;
  fetchMe: () => Promise<Record<string, unknown>>;
  installMcp: typeof installMcp;
  readPermissions: typeof readMcpPermissions;
  writePermissionProfile: typeof writeMcpPermissionProfile;
  writeOutput?: (message: string) => void;
};

const AGENT_OPTIONS = [
  { value: "all", label: "All agents (Codex, Claude Code, Cursor)" },
  { value: "codex", label: "Codex" },
  { value: "claude-code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "skip", label: "Skip for now" },
] as const;

const PERMISSION_OPTIONS = [
  {
    value: "safe-write",
    label: "safe-write — read, write, publish (recommended)",
  },
  { value: "read-only", label: "read-only — read tools only" },
  { value: "full", label: "full — includes deletes" },
  { value: "keep", label: "Keep current profile" },
] as const;

export async function runSetup(
  deps: Partial<SetupDeps> = {},
): Promise<void> {
  const write = deps.writeOutput ?? console.log;
  const isTTY = deps.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);

  if (!isTTY) {
    throw new Error(
      "openlog setup needs an interactive terminal. Run `openlog login` and `openlog mcp install <client>` instead.",
    );
  }

  const io = deps.promptIo ?? (await createPromptIo());
  const readAuth = deps.readAuth ?? readAuthFile;
  const runLogin = deps.login ?? login;
  const fetchMe =
    deps.fetchMe ??
    (async () => {
      const api = await createAuthenticatedApiClient();
      return (await api.get("/auth/me")) as Record<string, unknown>;
    });
  const runInstall = deps.installMcp ?? installMcp;
  const readPermissions = deps.readPermissions ?? readMcpPermissions;
  const writePermissionProfile =
    deps.writePermissionProfile ?? writeMcpPermissionProfile;

  try {
    write(banner());
    write("");
    write(heading("Setup"));
    write(dim("Sign in, pick an agent, set MCP permissions."));
    write("");

    await ensureSignedIn({
      io,
      readAuth,
      runLogin,
      fetchMe,
      write,
    });

    write("");
    const agent = (await chooseStep(
      io,
      heading("Which agent should use OpenLog MCP?"),
      AGENT_OPTIONS,
      "all",
    )) as SetupAgent;

    if (agent !== "skip") {
      write("");
      try {
        await runInstall({ client: agent, printOnly: false });
      } catch (error) {
        if (agent !== "all") {
          throw error;
        }
        write(dim("Some clients could not be configured:"));
        write(dim(error instanceof Error ? error.message : String(error)));
        write(dim("Continuing with MCP permission setup."));
      }
    } else {
      write(dim("Skipped MCP install. You can run `openlog mcp install` later."));
    }

    write("");
    const permissions = await readPermissions();
    write(kv("Current profile", permissions.profile));
    const profileChoice = await chooseStep(
      io,
      heading("MCP permission profile"),
      PERMISSION_OPTIONS,
      permissions.configured ? "keep" : DEFAULT_MCP_PERMISSION_PROFILE,
    );

    if (profileChoice !== "keep") {
      if (!isMcpPermissionProfile(profileChoice)) {
        throw new Error(`Unsupported permission profile: ${profileChoice}`);
      }
      const next = await writePermissionProfile(profileChoice);
      write(success(`Permissions set to ${next.profile}.`));
      write(
        dim("Restart or reload the MCP server in your agent to apply this."),
      );
    } else {
      write(dim(`Keeping ${permissions.profile}.`));
    }

    write("");
    write(success("Setup complete."));
    write(dim("Next: open your agent and confirm OpenLog under /mcp."));
    write(dim("Commands: openlog whoami · openlog mcp permissions · openlog help"));
  } finally {
    await io.close?.();
  }
}

async function chooseStep(
  io: PromptIo,
  message: string,
  options: readonly { value: string; label: string }[],
  defaultValue?: string,
): Promise<string> {
  for (;;) {
    try {
      return await choose(io, message, options, defaultValue);
    } catch (error) {
      if (!(error instanceof InvalidChoiceError)) {
        throw error;
      }
      console.log(
        dim(error.message),
      );
    }
  }
}

async function ensureSignedIn(options: {
  io: PromptIo;
  readAuth: typeof readAuthFile;
  runLogin: typeof login;
  fetchMe: () => Promise<Record<string, unknown>>;
  write: (message: string) => void;
}): Promise<void> {
  const auth = await options.readAuth();

  if (!auth) {
    options.write(dim("Not signed in."));
    const shouldLogin = await confirm(
      options.io,
      "Sign in with the browser now?",
      true,
    );
    if (!shouldLogin) {
      throw new Error("Setup cancelled — sign in with `openlog login` first.");
    }
    options.write("");
    await options.runLogin({ showBanner: false });
    return;
  }

  try {
    const me = await options.fetchMe();
    const name =
      pickString(me, "nickname") ??
      pickString(me, "username") ??
      pickString(me, "name") ??
      "OpenLog user";
    options.write(success(`Signed in as ${name}.`));
  } catch {
    options.write(dim("Saved credentials look stale."));
    const shouldLogin = await confirm(
      options.io,
      "Sign in again?",
      true,
    );
    if (!shouldLogin) {
      throw new Error("Setup cancelled — run `openlog login` and try again.");
    }
    options.write("");
    await options.runLogin({ showBanner: false });
  }
}

function pickString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const next = value[key];
  return typeof next === "string" && next.trim().length > 0 ? next : undefined;
}
