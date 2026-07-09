"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { usePrefersReducedMotion } from "./useLandingScroll";

/** Claude Code brand accent (coral). */
const CLAUDE_ACCENT = "#d97757";

type Block =
  | { kind: "welcome" }
  | { kind: "prompt"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "tool"; name: string; arg: string }
  | { kind: "result"; lines: string[] };

const blocks: Block[] = [
  { kind: "welcome" },
  {
    kind: "prompt",
    text: "commit the share-link fix and log the decision to openlog",
  },
  {
    kind: "bullet",
    text: "I'll commit the fix, then capture the decision in OpenLog.",
  },
  {
    kind: "tool",
    name: "Bash",
    arg: 'git commit -m "fix: share link expiry uses UTC"',
  },
  {
    kind: "result",
    lines: [
      "[main a1b2c3d] fix: share link expiry uses UTC",
      "1 file changed, 12 insertions(+), 4 deletions(-)",
    ],
  },
  {
    kind: "tool",
    name: "openlog",
    arg: 'log "Expiry checks must compare UTC" --task share-link',
  },
  {
    kind: "result",
    lines: ["Logged to task share-link · linked commit a1b2c3d"],
  },
  {
    kind: "bullet",
    text: "Done — linked to share-link in your workspace graph.",
  },
];

export function LandingTerminalDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    reducedMotion ? blocks.length : 0,
  );
  const [started, setStarted] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(blocks.length);
      setStarted(true);
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!started || reducedMotion || visibleCount >= blocks.length) {
      return;
    }

    const nextBlock = blocks[visibleCount];
    // Results snap in right after their tool call; prompts pause a beat longer.
    const delay =
      visibleCount === 0
        ? 260
        : nextBlock?.kind === "result"
          ? 260
          : nextBlock?.kind === "prompt"
            ? 620
            : 460;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [started, reducedMotion, visibleCount]);

  const allRevealed = visibleCount >= blocks.length;

  return (
    <div
      ref={rootRef}
      className="landing-mono overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0f] text-[12.5px] leading-6 text-zinc-300 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span style={{ color: CLAUDE_ACCENT }}>✻</span>
          claude — notes-app
        </span>
      </div>

      <div className="min-h-[21rem] space-y-2.5 px-4 py-4">
        {blocks.slice(0, visibleCount).map((block, index) => (
          <div key={index} className="landing-terminal-line">
            <TerminalBlock block={block} />
          </div>
        ))}

        {allRevealed ? (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-zinc-600">
            <span style={{ color: CLAUDE_ACCENT }}>&gt;</span>
            <span
              className="landing-terminal-cursor inline-block h-4 w-[7px] align-middle"
              style={{ backgroundColor: CLAUDE_ACCENT }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TerminalBlock({ block }: { block: Block }) {
  if (block.kind === "welcome") {
    return (
      <div className="space-y-2 rounded-lg border border-zinc-800 px-4 py-3">
        <p>
          <span style={{ color: CLAUDE_ACCENT }}>✻</span>{" "}
          <span className="text-zinc-200">Welcome to Claude Code</span>
        </p>
        <p className="pl-[1.1rem] text-zinc-500">
          /help for help, /status for your current setup
        </p>
        <p className="pl-[1.1rem] text-zinc-600">cwd: ~/notes-app</p>
      </div>
    );
  }

  if (block.kind === "prompt") {
    return (
      <div className="flex gap-2 rounded-lg border border-zinc-800 px-3 py-2">
        <span style={{ color: CLAUDE_ACCENT }} className="shrink-0">
          &gt;
        </span>
        <span className="text-zinc-100">{block.text}</span>
      </div>
    );
  }

  if (block.kind === "bullet") {
    return (
      <p className="flex gap-2">
        <span style={{ color: CLAUDE_ACCENT }} className="shrink-0">
          ⏺
        </span>
        <span className="text-zinc-200">{block.text}</span>
      </p>
    );
  }

  if (block.kind === "tool") {
    return (
      <p className="flex gap-2">
        <span style={{ color: CLAUDE_ACCENT }} className="shrink-0">
          ⏺
        </span>
        <span className="min-w-0">
          <span className="font-medium text-zinc-200">{block.name}</span>
          <span className="text-zinc-600">(</span>
          <span className="break-all text-zinc-400">{block.arg}</span>
          <span className="text-zinc-600">)</span>
        </span>
      </p>
    );
  }

  return (
    <div className="flex gap-2 pl-[1.1rem]">
      <span className="shrink-0 select-none text-zinc-700">⎿</span>
      <div className="min-w-0 space-y-0.5 text-zinc-500">
        {block.lines.map((line, index) => (
          <p key={index} className="break-all">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
