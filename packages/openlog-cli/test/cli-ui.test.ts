import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  banner,
  box,
  createSpinner,
  dim,
  formatError,
  kv,
  supportsColor,
} from "../src/cli-ui.js";

test("supportsColor respects NO_COLOR and FORCE_COLOR", () => {
  assert.equal(
    supportsColor({ isTTY: true, write() { return true; }, columns: 80 } as never, {
      NO_COLOR: "1",
    }),
    false,
  );
  assert.equal(
    supportsColor({ isTTY: false, write() { return true; }, columns: 80 } as never, {
      FORCE_COLOR: "1",
    }),
    true,
  );
  assert.equal(
    supportsColor({ isTTY: true, write() { return true; }, columns: 80 } as never, {}),
    true,
  );
});

test("banner and helpers stay plain when color is off", () => {
  const output = banner({ color: false, columns: 80 });
  assert.match(output, /██████/);
  assert.match(output, /session log/);
  assert.equal(output.includes("\u001b["), false);

  assert.equal(dim("waiting", false), "waiting");
  assert.equal(kv("Profile", "safe-write", false), "Profile     safe-write");
  assert.equal(kv("Capabilities", "read", false), "Capabilities read");
  assert.match(box("ABCD-2345", false), /ABCD-2345/);
  assert.equal(box("ABCD-2345", false).includes("\u001b["), false);
  assert.equal(formatError("boom", false), "error: boom");
});

test("narrow banner uses monogram form", () => {
  const output = banner({ color: false, columns: 40 });
  assert.match(output, /「OL」/);
  assert.doesNotMatch(output, /██████/);
});

test("spinner writes a plain line on non-TTY and replaces on stop", async () => {
  const chunks: string[] = [];
  const stream = Object.assign(new EventEmitter(), {
    isTTY: false,
    columns: 80,
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  });

  const spinner = createSpinner("Waiting for approval...", {
    stream: stream as never,
    color: false,
  });
  assert.deepEqual(chunks, ["Waiting for approval...\n"]);

  spinner.stop("Login successful.");
  assert.deepEqual(chunks, [
    "Waiting for approval...\n",
    "Login successful.\n",
  ]);
});

test("spinner clears the live line on TTY stop", async () => {
  const chunks: string[] = [];
  let cleared = 0;
  let cursorMoves = 0;
  const stream = Object.assign(new EventEmitter(), {
    isTTY: true,
    columns: 80,
    clearLine() {
      cleared += 1;
      return true;
    },
    cursorTo() {
      cursorMoves += 1;
      return true;
    },
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  });

  const spinner = createSpinner("Waiting", {
    stream: stream as never,
    color: true,
    intervalMs: 10_000,
  });
  assert.ok(chunks.length >= 1);
  assert.ok(cleared >= 1);
  assert.ok(cursorMoves >= 1);

  spinner.stop("done");
  assert.ok(chunks.at(-1)?.includes("done"));
});
