import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../src/api-client.js";
import {
  runInit,
  type InitDeps,
  type Workspace,
  type WorkspaceProject,
} from "../src/init.js";
import type { PromptIo } from "../src/prompt.js";
import type { LocalProject, ProjectBinding } from "../src/project-binding.js";

function scriptedPrompt(answers: string[]): PromptIo {
  const queue = [...answers];
  return {
    question: async () => {
      const answer = queue.shift();
      if (answer === undefined) {
        throw new Error("Unexpected prompt — answer queue empty");
      }
      return answer;
    },
  };
}

function localProjectFixture(overrides: Partial<LocalProject> = {}): LocalProject {
  return {
    root: "/work/local-api",
    displayName: "local-api",
    kind: "directory",
    bindingPath: "/work/local-api/.openlog/project.json",
    remoteUrl: null,
    repositoryFullName: null,
    projectId: null,
    ...overrides,
  };
}

function projectFixture(overrides: Partial<WorkspaceProject> = {}): WorkspaceProject {
  return {
    id: 20,
    workspaceId: 10,
    displayName: "local-api",
    repositoryFullName: null,
    captureMode: "ASK",
    createdAt: "2026-07-14T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
    ...overrides,
  };
}

function workspaceFixture(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 10,
    slug: "default",
    name: "Default",
    projects: [],
    createdAt: "2026-07-14T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
    ...overrides,
  };
}

function silentSpinner() {
  return { stop: () => {} };
}

test("init creates a general-folder project binding and stores its ID", async () => {
  const output: string[] = [];
  const requests: Array<{ path: string; body?: unknown }> = [];
  let writtenProjectId: number | null = null;
  const project = projectFixture({ captureMode: "AUTO" });

  await runInit({
    isTTY: true,
    projectPath: "/work/local-api",
    promptIo: scriptedPrompt(["y", "1", "2"]),
    writeOutput: (message) => output.push(message),
    webBaseUrl: "https://openlog.example",
    spinner: silentSpinner,
    binding: {
      inspect: async () => localProjectFixture(),
      writeProjectId: async (_project, id) => {
        writtenProjectId = id;
      },
    },
    api: {
      get: async <T>(path: string) => {
        requests.push({ path });
        if (path === "/workspaces") return [workspaceFixture()] as T;
        if (path === "/workspace-projects/20/agent-context") {
          return {
            workspace: workspaceFixture(),
            project,
            guide: {
              workspaceId: 10,
              content: "Guide",
              revision: 3,
              createdAt: "2026-07-14T00:00:00",
              updatedAt: "2026-07-14T00:00:00",
            },
          } as T;
        }
        throw new Error(`Unexpected GET ${path}`);
      },
      post: async <T>(path: string, body?: unknown) => {
        requests.push({ path, body });
        return project as T;
      },
      patch: async <T>() => project as T,
      deleteNoContent: async () => {},
    },
  });

  assert.equal(writtenProjectId, 20);
  assert.deepEqual(requests[1], {
    path: "/workspaces/10/projects",
    body: {
      displayName: "local-api",
      repositoryFullName: null,
      captureMode: "AUTO",
    },
  });
  assert.match(output.join("\n"), /Guide revision\s+3/);
  assert.match(output.join("\n"), /General folder/);
  assert.match(output.join("\n"), /\.openlog\/project\.json/);
  assert.match(output.join("\n"), /settings\/workspaces\/10\/agent/);
});

test("init warns about a stale local project ID and reinitializes", async () => {
  const output: string[] = [];
  const created = projectFixture({ id: 21 });

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["y", "1", "1"]),
    writeOutput: (message) => output.push(message),
    spinner: silentSpinner,
    binding: projectBinding(localProjectFixture({ projectId: 999 })),
    api: {
      get: async <T>(path: string) => {
        if (path === "/workspace-projects/999") {
          throw new ApiError(404, path, "Not found");
        }
        if (path === "/workspaces") return [workspaceFixture()] as T;
        return {
          workspace: workspaceFixture(),
          project: created,
          guide: { workspaceId: 10, content: "Guide", revision: 1 },
        } as T;
      },
      post: async <T>() => created as T,
      patch: async <T>() => created as T,
      deleteNoContent: async () => {},
    },
  });

  assert.match(output.join("\n"), /project ID 999 is stale/);
});

test("init can bind a folder to a project that was created without a directory", async () => {
  const existing = projectFixture({ id: 31, displayName: "Research notes" });
  const requests: Array<{ method: string; path: string; body?: unknown }> = [];
  let writtenProjectId: number | null = null;

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["y", "1", "2", "1"]),
    writeOutput: () => {},
    spinner: silentSpinner,
    binding: {
      inspect: async () => localProjectFixture(),
      writeProjectId: async (_project, projectId) => {
        writtenProjectId = projectId;
      },
    },
    api: {
      get: async <T>(path: string) => {
        requests.push({ method: "GET", path });
        if (path === "/workspaces") {
          return [workspaceFixture({ projects: [existing] })] as T;
        }
        return {
          workspace: workspaceFixture({ projects: [existing] }),
          project: existing,
          guide: { workspaceId: 10, content: "Guide", revision: 1 },
        } as T;
      },
      post: async <T>() => {
        throw new Error("should not create a duplicate project");
      },
      patch: async <T>(path: string, body?: unknown) => {
        requests.push({ method: "PATCH", path, body });
        return existing as T;
      },
      deleteNoContent: async () => {},
    },
  });

  assert.equal(writtenProjectId, 31);
  assert.deepEqual(requests[1], {
    method: "PATCH",
    path: "/workspace-projects/31",
    body: {
      workspaceId: 10,
      displayName: "Research notes",
      repositoryFullName: null,
      captureMode: "ASK",
    },
  });
});

test("init can leave the current folder unbound", async () => {
  let apiCalls = 0;

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["n"]),
    writeOutput: () => {},
    spinner: silentSpinner,
    binding: projectBinding(localProjectFixture()),
    api: {
      get: async <T>() => {
        apiCalls += 1;
        return [] as T;
      },
      post: async <T>() => {
        apiCalls += 1;
        return {} as T;
      },
      patch: async <T>() => {
        apiCalls += 1;
        return {} as T;
      },
      deleteNoContent: async () => {
        apiCalls += 1;
      },
    },
  });

  assert.equal(apiCalls, 0);
});

test("init cancels before moving an existing repository binding", async () => {
  let patchCalls = 0;
  const existing = projectFixture({ repositoryFullName: "openlog/local-api" });
  const secondWorkspace = { ...workspaceFixture(), id: 11, slug: "team", name: "Team" };

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["y", "2", "n"]),
    writeOutput: () => {},
    spinner: silentSpinner,
    binding: projectBinding(
      localProjectFixture({
        kind: "git",
        bindingPath: "/work/local-api/.git/config",
        repositoryFullName: "openlog/local-api",
        remoteUrl: "git@github.com:openlog/local-api.git",
      }),
    ),
    api: {
      get: async <T>(path: string) => {
        if (path.startsWith("/workspace-projects/resolve")) return existing as T;
        return [workspaceFixture(), secondWorkspace] as T;
      },
      post: async <T>() => existing as T,
      patch: async <T>() => {
        patchCalls += 1;
        return existing as T;
      },
      deleteNoContent: async () => {},
    },
  });

  assert.equal(patchCalls, 0);
});

test("init rolls back a new server binding when the local binding cannot be written", async () => {
  const deleted: string[] = [];
  const created = projectFixture();
  const binding: ProjectBinding = {
    inspect: async () => localProjectFixture(),
    writeProjectId: async () => {
      throw new Error("read-only config");
    },
  };

  await assert.rejects(
    () =>
      runInit({
        isTTY: true,
        promptIo: scriptedPrompt(["y", "1", "1"]),
        writeOutput: () => {},
        spinner: silentSpinner,
        binding,
        api: {
          get: async <T>() => [workspaceFixture()] as T,
          post: async <T>() => created as T,
          patch: async <T>() => created as T,
          deleteNoContent: async (path) => {
            deleted.push(path);
          },
        },
      }),
    /Could not write the OpenLog project binding/,
  );

  assert.deepEqual(deleted, ["/workspace-projects/20"]);
});

function projectBinding(project: LocalProject): ProjectBinding {
  return {
    inspect: async () => project,
    writeProjectId: async () => {},
  };
}

type _EnsureInitApiIsCovered = InitDeps["api"];
