import { ApiError, type OpenLogApiClient } from "./api-client.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import {
  banner,
  createSpinner,
  dim,
  heading,
  kv,
  success,
  type CliSpinner,
} from "./cli-ui.js";
import { getWebBaseUrl } from "./config.js";
import { confirm, createPromptIo, choose, InvalidChoiceError, type PromptIo } from "./prompt.js";
import {
  createProjectBinding,
  type LocalProject,
  type ProjectBinding,
} from "./project-binding.js";

export type CaptureMode = "AUTO" | "ASK" | "EXPLICIT";

export type WorkspaceProject = {
  id: number;
  workspaceId: number;
  displayName: string;
  repositoryFullName: string | null;
  captureMode: CaptureMode;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  id: number;
  slug: string;
  name: string;
  projects: WorkspaceProject[];
  createdAt: string;
  updatedAt: string;
};

type AgentContext = {
  workspace: Workspace;
  project: WorkspaceProject;
  guide: {
    workspaceId: number;
    content: string;
    revision: number;
    createdAt: string;
    updatedAt: string;
  };
};

type InitApi = Pick<OpenLogApiClient, "get" | "post" | "patch" | "deleteNoContent">;

export type InitDeps = {
  isTTY: boolean;
  projectPath: string;
  promptIo: PromptIo;
  api: InitApi;
  binding: ProjectBinding;
  webBaseUrl: string;
  writeOutput: (message: string) => void;
  spinner: (label: string) => CliSpinner;
};

const CAPTURE_MODE_OPTIONS = [
  { value: "ASK", label: "ASK — ask before creating or updating (recommended)" },
  { value: "AUTO", label: "AUTO — act automatically when the Guide says it matters" },
  { value: "EXPLICIT", label: "EXPLICIT — act only when you explicitly request it" },
] as const;

export async function runInit(deps: Partial<InitDeps> = {}): Promise<void> {
  const isTTY = deps.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  if (!isTTY) {
    throw new Error("openlog init needs an interactive terminal.");
  }

  const io = deps.promptIo ?? (await createPromptIo());
  const api = deps.api ?? (await createAuthenticatedApiClient());
  const binding = deps.binding ?? createProjectBinding();
  const projectPath = deps.projectPath ?? process.cwd();
  const write = deps.writeOutput ?? console.log;
  const webBaseUrl = deps.webBaseUrl ?? getWebBaseUrl();
  const makeSpinner = deps.spinner ?? ((label) => createSpinner(label));

  try {
    write(banner({ tagline: "project init · cli" }));
    write("");
    write(heading("Project init"));

    const project = await withSpinner(
      makeSpinner,
      "Inspecting current folder...",
      () => binding.inspect(projectPath),
      "Folder inspected.",
    );
    write(kv("Folder", project.root));
    write(kv("Type", project.kind === "git" ? "Git repository" : "General folder"));
    if (project.repositoryFullName) {
      write(kv("Repository", project.repositoryFullName));
    }
    write(kv("Local binding", project.bindingPath));

    write("");
    const shouldConnect = await confirm(
      io,
      "Connect this folder to an OpenLog project?",
      true,
    );
    if (!shouldConnect) {
      write(dim("Project init cancelled. No local binding was written."));
      return;
    }

    let resolved = await resolveExistingProject(api, project, makeSpinner, write);
    const workspaces = await withSpinner(
      makeSpinner,
      "Loading OpenLog workspaces...",
      () => api.get<Workspace[]>("/workspaces"),
    );
    if (workspaces.length === 0) {
      write("");
      write(dim("No workspace is available yet."));
      write(`Create one: ${webBaseUrl}/workspaces/new`);
      return;
    }

    write("");
    const workspaceId = Number.parseInt(
      await chooseValue(
        io,
        heading("Connect this project to which workspace?"),
        workspaces.map((workspace) => ({
          value: String(workspace.id),
          label: `${workspace.name} (${workspace.slug})`,
        })),
        resolved ? String(resolved.workspaceId) : String(workspaces[0]!.id),
      ),
      10,
    );
    const workspace = workspaces.find((item) => item.id === workspaceId)!;

    if (resolved && resolved.workspaceId !== workspaceId) {
      const currentWorkspaceId = resolved.workspaceId;
      const currentWorkspace = workspaces.find(
        (item) => item.id === currentWorkspaceId,
      );
      const shouldMove = await confirm(
        io,
        `Move this project from ${currentWorkspace?.name ?? "its current workspace"} to ${workspace.name}?`,
        false,
      );
      if (!shouldMove) {
        write(dim("Project init cancelled. No changes were made."));
        return;
      }
    }

    if (!resolved && workspace.projects.length > 0) {
      write("");
      const selectedProjectId = await chooseValue(
        io,
        heading("Create a project or connect this folder to an existing one?"),
        [
          {
            value: "new",
            label: `Create a new project named ${project.displayName}`,
          },
          ...workspace.projects.map((item) => ({
            value: String(item.id),
            label: `Use existing project: ${item.displayName}`,
          })),
        ],
        "new",
      );
      if (selectedProjectId !== "new") {
        resolved = workspace.projects.find(
          (item) => item.id === Number.parseInt(selectedProjectId, 10),
        )!;
      }
    }

    write("");
    const captureMode = (await chooseValue(
      io,
      heading("How should the agent capture Task, Log, and Output drafts?"),
      CAPTURE_MODE_OPTIONS,
      resolved?.captureMode ?? "ASK",
    )) as CaptureMode;

    const savedProject = await saveProjectBinding({
      api,
      binding,
      project,
      existing: resolved,
      workspaceId,
      captureMode,
      makeSpinner,
    });
    const context = await withSpinner(
      makeSpinner,
      "Loading the latest Agent Guide...",
      () => api.get<AgentContext>(`/workspace-projects/${savedProject.id}/agent-context`),
    );

    write("");
    write(success("Project connected to OpenLog."));
    write(kv("Workspace", context.workspace.name));
    write(kv("Capture mode", context.project.captureMode));
    write(kv("Guide revision", String(context.guide.revision)));
    write(kv("Local binding", project.bindingPath));
    write(`Agent settings: ${webBaseUrl}/settings/workspaces/${context.workspace.id}/agent`);
  } finally {
    await io.close?.();
  }
}

async function resolveExistingProject(
  api: InitApi,
  project: LocalProject,
  makeSpinner: (label: string) => CliSpinner,
  write: (message: string) => void,
): Promise<WorkspaceProject | null> {
  if (project.projectId != null) {
    try {
      return await withSpinner(
        makeSpinner,
        "Checking existing OpenLog project ID...",
        () => api.get<WorkspaceProject>(`/workspace-projects/${project.projectId}`),
      );
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
      write(dim(`Stored OpenLog project ID ${project.projectId} is stale; reinitializing.`));
    }
  }

  if (!project.repositoryFullName) {
    return null;
  }

  try {
    return await withSpinner(
      makeSpinner,
      "Looking for an existing repository connection...",
      () =>
        api.get<WorkspaceProject>(
          `/workspace-projects/resolve?repositoryFullName=${encodeURIComponent(project.repositoryFullName!)}`,
        ),
    );
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function saveProjectBinding(options: {
  api: InitApi;
  binding: ProjectBinding;
  project: LocalProject;
  existing: WorkspaceProject | null;
  workspaceId: number;
  captureMode: CaptureMode;
  makeSpinner: (label: string) => CliSpinner;
}): Promise<WorkspaceProject> {
  const body = options.existing
    ? {
        displayName: options.existing.displayName,
        repositoryFullName: options.existing.repositoryFullName,
        captureMode: options.captureMode,
      }
    : {
        displayName: options.project.repositoryFullName ?? options.project.displayName,
        repositoryFullName: options.project.repositoryFullName,
        captureMode: options.captureMode,
      };
  const saved = await withSpinner(
    options.makeSpinner,
    "Saving project connection...",
    () =>
      options.existing
        ? options.api.patch<WorkspaceProject>(`/workspace-projects/${options.existing.id}`, {
            ...body,
            workspaceId: options.workspaceId,
          })
        : options.api.post<WorkspaceProject>(`/workspaces/${options.workspaceId}/projects`, body),
  );

  try {
    await options.binding.writeProjectId(options.project, saved.id);
  } catch (error) {
    if (!options.existing) {
      try {
        await options.api.deleteNoContent(`/workspace-projects/${saved.id}`);
      } catch {
        throw new Error(
          `Could not write openlog.projectId and the new server connection could not be rolled back. Disconnect project ${saved.id} in Agent Settings.`,
        );
      }
    }
    throw new Error(
      `Could not write the OpenLog project binding to ${options.project.bindingPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return saved;
}

async function chooseValue(
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
      console.log(dim(error.message));
    }
  }
}

async function withSpinner<T>(
  makeSpinner: (label: string) => CliSpinner,
  label: string,
  operation: () => Promise<T>,
  successMessage?: string,
): Promise<T> {
  const spinner = makeSpinner(label);
  try {
    const value = await operation();
    spinner.stop(successMessage ? success(successMessage) : undefined);
    return value;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
