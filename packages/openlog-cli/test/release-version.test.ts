import assert from "node:assert/strict";
import test from "node:test";
import { resolveReleaseVersion } from "../scripts/resolve-release-version.mjs";

test("uses an explicit minor or major version ahead of npm latest", () => {
  assert.equal(resolveReleaseVersion("1.3.0", "1.2.1"), "1.3.0");
  assert.equal(resolveReleaseVersion("2.0.0", "1.9.9"), "2.0.0");
});

test("automatically increments the npm latest patch for unchanged source versions", () => {
  assert.equal(resolveReleaseVersion("1.3.0", "1.3.0"), "1.3.1");
  assert.equal(resolveReleaseVersion("1.2.1", "1.3.4"), "1.3.5");
});

test("uses the requested version when the package has not been published", () => {
  assert.equal(resolveReleaseVersion("1.0.0", undefined), "1.0.0");
});

test("rejects versions that are not stable semantic versions", () => {
  assert.throws(() => resolveReleaseVersion("1.3", "1.2.1"));
  assert.throws(() => resolveReleaseVersion("1.3.0", "latest"));
});
