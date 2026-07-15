import { execFile } from "node:child_process";
import { chmod, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DIRECTORY_BINDING_VERSION = 1;
const DIRECTORY_BINDING_RELATIVE_PATH = path.join(".openlog", "project.json");

export type LocalProject = {
  root: string;
  displayName: string;
  kind: "git" | "directory";
  bindingPath: string;
  remoteUrl: string | null;
  repositoryFullName: string | null;
  projectId: number | null;
};

export type ProjectBinding = {
  inspect: (projectPath: string) => Promise<LocalProject>;
  writeProjectId: (project: LocalProject, projectId: number) => Promise<void>;
};

export function createProjectBinding(): ProjectBinding {
  return {
    inspect: inspectLocalProject,
    writeProjectId: async (project, projectId) => {
      if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        throw new Error("OpenLog project ID must be a positive integer.");
      }

      if (project.kind === "git") {
        await runGit(project.root, [
          "config",
          "--local",
          "openlog.projectId",
          String(projectId),
        ]);
        return;
      }

      await mkdir(path.dirname(project.bindingPath), {
        recursive: true,
        mode: 0o700,
      });
      await writeFile(
        project.bindingPath,
        `${JSON.stringify({ version: DIRECTORY_BINDING_VERSION, projectId }, null, 2)}\n`,
        { encoding: "utf8", mode: 0o600 },
      );
      await chmod(project.bindingPath, 0o600);
    },
  };
}

export async function inspectLocalProject(projectPath: string): Promise<LocalProject> {
  const resolvedPath = await resolveDirectory(projectPath);
  const gitProject = await inspectGitProject(resolvedPath);
  if (gitProject) {
    return gitProject;
  }

  const directoryBinding = await findDirectoryBinding(resolvedPath);
  const root = directoryBinding?.root ?? resolvedPath;

  return {
    root,
    displayName: path.basename(root),
    kind: "directory",
    bindingPath:
      directoryBinding?.bindingPath ?? path.join(root, DIRECTORY_BINDING_RELATIVE_PATH),
    remoteUrl: null,
    repositoryFullName: null,
    projectId: directoryBinding?.projectId ?? null,
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

async function inspectGitProject(projectPath: string): Promise<LocalProject | null> {
  let root: string;
  try {
    root = await realpath(
      (await runGit(projectPath, ["rev-parse", "--show-toplevel"])).trim(),
    );
  } catch {
    return null;
  }

  const remoteUrl = await readOptionalGitValue(root, [
    "config",
    "--get",
    "remote.origin.url",
  ]);
  const projectIdValue = await readOptionalGitValue(root, [
    "config",
    "--local",
    "--get",
    "openlog.projectId",
  ]);
  const gitConfigPath = (
    await runGit(root, ["rev-parse", "--git-path", "config"])
  ).trim();

  return {
    root,
    displayName: path.basename(root),
    kind: "git",
    bindingPath: path.resolve(root, gitConfigPath),
    remoteUrl,
    repositoryFullName: remoteUrl ? parseRepositoryFullName(remoteUrl) : null,
    projectId: parseProjectId(projectIdValue),
  };
}

async function findDirectoryBinding(start: string): Promise<{
  root: string;
  bindingPath: string;
  projectId: number;
} | null> {
  let current = start;

  for (;;) {
    const bindingPath = path.join(current, DIRECTORY_BINDING_RELATIVE_PATH);
    const content = await readOptionalFile(bindingPath);
    if (content != null) {
      return {
        root: current,
        bindingPath,
        projectId: parseDirectoryBinding(content, bindingPath),
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function resolveDirectory(projectPath: string): Promise<string> {
  let resolved: string;
  try {
    resolved = await realpath(projectPath);
  } catch {
    throw new Error(`Project folder does not exist: ${projectPath}`);
  }

  if (!(await stat(resolved)).isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectPath}`);
  }
  return resolved;
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) {
      return null;
    }
    throw error;
  }
}

function parseDirectoryBinding(content: string, bindingPath: string): number {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    throw new Error(`Invalid OpenLog project binding JSON: ${bindingPath}`);
  }

  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== DIRECTORY_BINDING_VERSION ||
    !("projectId" in value)
  ) {
    throw new Error(`Unsupported OpenLog project binding: ${bindingPath}`);
  }

  const projectId = value.projectId;
  if (!Number.isSafeInteger(projectId) || (projectId as number) <= 0) {
    throw new Error(`Invalid OpenLog project ID in ${bindingPath}`);
  }
  return projectId as number;
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
    if (isMissingGitConfigValue(error)) {
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

function isMissingGitConfigValue(error: unknown): boolean {
  return hasErrorCode(error, 1);
}

function hasErrorCode(error: unknown, code: string | number): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string | number }).code === code,
  );
}
