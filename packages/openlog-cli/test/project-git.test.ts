import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { createProjectGit, parseRepositoryFullName } from "../src/project-git.js";

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

test("project git finds the root and stores project ID only in local config", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openlog-project-git-"));
  const nested = path.join(root, "src", "nested");
  await mkdir(nested, { recursive: true });
  await execFileAsync("git", ["init", "--quiet"], { cwd: root });

  try {
    const git = createProjectGit();
    const before = await git.inspect(nested);
    assert.equal(before.root, await realpath(root));
    assert.equal(before.remoteUrl, null);
    assert.equal(before.projectId, null);

    await git.writeProjectId(root, 42);
    const after = await git.inspect(nested);
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
