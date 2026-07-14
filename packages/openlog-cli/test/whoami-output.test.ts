import assert from "node:assert/strict";
import test from "node:test";
import { formatWhoamiOutput } from "../src/whoami-output.js";

const USER = {
  id: 42,
  nickname: "Kitae",
  username: "kitae",
  email: "kitae@example.com",
};

test("uses human-readable whoami output in an interactive terminal", () => {
  const output = formatWhoamiOutput(USER, { isTTY: true });

  assert.match(output, /Signed in/);
  assert.match(output, /Kitae/);
  assert.match(output, /@kitae/);
  assert.match(output, /42/);
});

test("keeps JSON whoami output for pipes and scripts", () => {
  const output = formatWhoamiOutput(USER, { isTTY: false });

  assert.deepEqual(JSON.parse(output), USER);
});

test("supports explicit JSON and human output overrides", () => {
  assert.deepEqual(
    JSON.parse(formatWhoamiOutput(USER, { asJson: true, isTTY: true })),
    USER,
  );
  assert.match(
    formatWhoamiOutput(USER, { forceHuman: true, isTTY: false }),
    /Signed in/,
  );
});
