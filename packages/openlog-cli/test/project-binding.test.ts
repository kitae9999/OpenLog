import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  createProjectBinding,
  parseRepositoryFullName,
} from "../src/project-binding.js";

const execFileAsync = promisify(execFile);

test("parseRepositoryFullName supports HTTPS and SSH remotes", () => {
  assert.equal(
    parseRepositoryFullName("https://github.com/OpenLogHQ/openlog.git"),
    "OpenLogHQ/openlog",
  );
  assert.equal(
    parseRepositoryFullName("git@github.com:OpenLogHQ/openlog.git"),
    "OpenLogHQ/openlog",
  );
  assert.equal(
    parseRepositoryFullName("ssh://git@github.com/OpenLogHQ/openlog.git"),
    "OpenLogHQ/openlog",
  );
});

test("parseRepositoryFullName returns null for an unusable remote", () => {
  assert.equal(parseRepositoryFullName("not-a-remote"), null);
});

test("Git projects store project ID only in local config", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openlog-project-git-"));
  const nested = path.join(root, "src", "nested");
  await mkdir(nested, { recursive: true });
  await execFileAsync("git", ["init", "--quiet"], { cwd: root });

  try {
    const binding = createProjectBinding();
    const before = await binding.inspect(nested);
    assert.equal(before.root, await realpath(root));
    assert.equal(before.kind, "git");
    assert.equal(before.remoteUrl, null);
    assert.equal(before.projectId, null);

    await binding.writeProjectId(before, 42);
    const after = await binding.inspect(nested);
    assert.equal(after.projectId, 42);

    const localValue = await execFileAsync(
      "git",
      ["config", "--local", "--get", "openlog.projectId"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(localValue.stdout.trim(), "42");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("general folders store a versioned binding file and resolve it from descendants", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openlog-project-directory-"));
  const nested = path.join(root, "notes", "drafts");
  await mkdir(nested, { recursive: true });

  try {
    const binding = createProjectBinding();
    const before = await binding.inspect(root);
    assert.equal(before.kind, "directory");
    assert.equal(before.root, await realpath(root));
    assert.equal(before.projectId, null);
    assert.equal(before.bindingPath, path.join(await realpath(root), ".openlog", "project.json"));

    await binding.writeProjectId(before, 73);
    assert.deepEqual(
      JSON.parse(await readFile(before.bindingPath, "utf8")),
      { version: 1, projectId: 73 },
    );
    assert.equal((await stat(before.bindingPath)).mode & 0o777, 0o600);

    const fromNested = await binding.inspect(nested);
    assert.equal(fromNested.kind, "directory");
    assert.equal(fromNested.root, await realpath(root));
    assert.equal(fromNested.projectId, 73);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid general-folder bindings fail instead of being overwritten", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openlog-invalid-binding-"));
  const markerDirectory = path.join(root, ".openlog");
  await mkdir(markerDirectory);
  await writeFile(path.join(markerDirectory, "project.json"), "{ invalid", "utf8");

  try {
    await assert.rejects(
      () => createProjectBinding().inspect(root),
      /Invalid OpenLog project binding JSON/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("project inspection rejects missing folders and file paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openlog-project-path-"));
  const filePath = path.join(root, "file.txt");
  await writeFile(filePath, "content", "utf8");

  try {
    const binding = createProjectBinding();
    await assert.rejects(
      () => binding.inspect(path.join(root, "missing")),
      /does not exist/,
    );
    await assert.rejects(() => binding.inspect(filePath), /not a directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
