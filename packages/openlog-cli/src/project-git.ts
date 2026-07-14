import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GitProject = {
  root: string;
  displayName: string;
  remoteUrl: string | null;
  repositoryFullName: string | null;
  projectId: number | null;
};

export type ProjectGit = {
  inspect: (projectPath: string) => Promise<GitProject>;
  writeProjectId: (root: string, projectId: number) => Promise<void>;
  clearProjectId: (root: string) => Promise<void>;
};

export function createProjectGit(): ProjectGit {
  return {
    inspect: inspectGitProject,
    writeProjectId: async (root, projectId) => {
      await runGit(root, ["config", "--local", "openlog.projectId", String(projectId)]);
    },
    clearProjectId: async (root) => {
      try {
        await runGit(root, ["config", "--local", "--unset", "openlog.projectId"]);
      } catch (error) {
        if (!isMissingConfigValue(error)) {
          throw error;
        }
      }
    },
  };
}

export async function inspectGitProject(projectPath: string): Promise<GitProject> {
  let root: string;
  try {
    root = (await runGit(projectPath, ["rev-parse", "--show-toplevel"])).trim();
  } catch {
    throw new Error("openlog init must run inside a Git repository.");
  }

  const remoteUrl = await readOptionalGitValue(root, ["config", "--get", "remote.origin.url"]);
  const projectIdValue = await readOptionalGitValue(root, [
    "config",
    "--local",
    "--get",
    "openlog.projectId",
  ]);
  const projectId = parseProjectId(projectIdValue);

  return {
    root,
    displayName: path.basename(root),
    remoteUrl,
    repositoryFullName: remoteUrl ? parseRepositoryFullName(remoteUrl) : null,
    projectId,
  };
}

export function parseRepositoryFullName(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim().replace(/\/+$/, "");
  const withoutGit = trimmed.replace(/\.git$/i, "");
  const scpMatch = withoutGit.match(/^[^@\s]+@[^:\s]+:(.+)$/);
  const pathValue = scpMatch?.[1] ?? parseUrlPath(withoutGit);
  if (!pathValue) {
    return null;
  }

  const segments = pathValue.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }
  const repository = segments.slice(-2).join("/");
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
    ? repository
    : null;
}

function parseUrlPath(value: string): string | null {
  try {
    return new URL(value).pathname;
  } catch {
    return value.includes("/") ? value : null;
  }
}

function parseProjectId(value: string | null): number | null {
  if (value == null) {
    return null;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function readOptionalGitValue(root: string, args: string[]): Promise<string | null> {
  try {
    const value = (await runGit(root, args)).trim();
    return value.length > 0 ? value : null;
  } catch (error) {
    if (isMissingConfigValue(error)) {
      return null;
    }
    throw error;
  }
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", args, {
    cwd,
    encoding: "utf8",
  });
  return result.stdout;
}

function isMissingConfigValue(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 1,
  );
}
