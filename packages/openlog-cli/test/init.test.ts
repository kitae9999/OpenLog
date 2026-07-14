import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../src/api-client.js";
import { runInit, type InitDeps, type WorkspaceProject } from "../src/init.js";
import type { PromptIo } from "../src/prompt.js";
import type { GitProject, ProjectGit } from "../src/project-git.js";

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

function gitFixture(overrides: Partial<GitProject> = {}): GitProject {
  return {
    root: "/work/local-api",
    displayName: "local-api",
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

function workspaceFixture() {
  return {
    id: 10,
    slug: "default",
    name: "Default",
    projects: [],
    createdAt: "2026-07-14T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
  };
}

function silentSpinner() {
  return { stop: () => {} };
}

test("init creates a local project binding and stores its ID", async () => {
  const output: string[] = [];
  const requests: Array<{ path: string; body?: unknown }> = [];
  let writtenProjectId: number | null = null;
  const project = projectFixture({ captureMode: "AUTO" });

  await runInit({
    isTTY: true,
    projectPath: "/work/local-api",
    promptIo: scriptedPrompt(["1", "2"]),
    writeOutput: (message) => output.push(message),
    webBaseUrl: "https://openlog.example",
    spinner: silentSpinner,
    git: {
      inspect: async () => gitFixture(),
      writeProjectId: async (_root, id) => {
        writtenProjectId = id;
      },
      clearProjectId: async () => {},
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
  assert.match(output.join("\n"), /settings\/workspaces\/10\/agent/);
});

test("init warns about a stale local project ID and reinitializes", async () => {
  const output: string[] = [];
  const created = projectFixture({ id: 21 });

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["1", "1"]),
    writeOutput: (message) => output.push(message),
    spinner: silentSpinner,
    git: projectGit(gitFixture({ projectId: 999 })),
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

test("init cancels before moving an existing repository binding", async () => {
  let patchCalls = 0;
  const existing = projectFixture({ repositoryFullName: "openlog/local-api" });
  const secondWorkspace = { ...workspaceFixture(), id: 11, slug: "team", name: "Team" };

  await runInit({
    isTTY: true,
    promptIo: scriptedPrompt(["2", "n"]),
    writeOutput: () => {},
    spinner: silentSpinner,
    git: projectGit(
      gitFixture({
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

test("init rolls back a new server binding when git config cannot be written", async () => {
  const deleted: string[] = [];
  const created = projectFixture();
  const git: ProjectGit = {
    inspect: async () => gitFixture(),
    writeProjectId: async () => {
      throw new Error("read-only config");
    },
    clearProjectId: async () => {},
  };

  await assert.rejects(
    () =>
      runInit({
        isTTY: true,
        promptIo: scriptedPrompt(["1", "1"]),
        writeOutput: () => {},
        spinner: silentSpinner,
        git,
        api: {
          get: async <T>() => [workspaceFixture()] as T,
          post: async <T>() => created as T,
          patch: async <T>() => created as T,
          deleteNoContent: async (path) => {
            deleted.push(path);
          },
        },
      }),
    /Could not write openlog\.projectId/,
  );

  assert.deepEqual(deleted, ["/workspace-projects/20"]);
});

function projectGit(project: GitProject): ProjectGit {
  return {
    inspect: async () => project,
    writeProjectId: async () => {},
    clearProjectId: async () => {},
  };
}

type _EnsureInitApiIsCovered = InitDeps["api"];
