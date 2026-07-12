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

/** Stages the mini browser can react to (product live-sync shaped). */
export type LandingTerminalStage =
  | { type: "idle" }
  | { type: "log_fetching" }
  | {
      type: "log_appended";
      block: { id: string; title: string; meta: string };
    }
  | { type: "done" };

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

const OPENLOG_LOG_BLOCK = {
  id: "demo-log-expiry-utc",
  title: "Expiry checks must compare UTC",
  meta: "share-link · a1b2c3d",
} as const;

function stageForVisibleCount(count: number): LandingTerminalStage {
  // openlog tool is index 5 → fetching while that tool line is on screen.
  if (count >= 8) {
    return { type: "done" };
  }
  if (count >= 7) {
    return { type: "log_appended", block: { ...OPENLOG_LOG_BLOCK } };
  }
  if (count >= 6) {
    return { type: "log_fetching" };
  }
  return { type: "idle" };
}

function delayAfterCount(visibleCount: number): number {
  // Hold on the block that was just revealed (visibleCount - 1), not the next one.
  const justRevealed =
    visibleCount > 0 ? blocks[visibleCount - 1] : undefined;

  if (visibleCount === 0) {
    return 500;
  }
  // Keep corner Fetching toast on screen long enough to notice.
  if (justRevealed?.kind === "tool" && justRevealed.name === "openlog") {
    return 2200;
  }
  if (justRevealed?.kind === "result") {
    return 520;
  }
  if (justRevealed?.kind === "prompt") {
    return 700;
  }
  if (justRevealed?.kind === "tool") {
    return 640;
  }
  return 480;
}

function isRevealActive(el: HTMLElement) {
  const reveal = el.closest(".landing-reveal");
  // No reveal wrapper → treat as visible.
  if (!reveal) {
    return true;
  }
  return reveal.classList.contains("is-active");
}

export function LandingTerminalDemo({
  onStage,
  className,
}: {
  onStage?: (stage: LandingTerminalStage) => void;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const onStageRef = useRef(onStage);
  const [visibleCount, setVisibleCount] = useState(
    reducedMotion ? blocks.length : 0,
  );
  const [started, setStarted] = useState(reducedMotion);

  onStageRef.current = onStage;

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

    let cancelled = false;
    let startTimer: number | null = null;

    const begin = () => {
      if (cancelled || startTimer !== null) {
        return;
      }
      // Brief beat after the section fades in so the empty browser is seen first.
      startTimer = window.setTimeout(() => {
        if (!cancelled) {
          setStarted(true);
        }
      }, 450);
    };

    const tryStart = () => {
      if (!isRevealActive(root)) {
        return false;
      }
      const rect = root.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.85 &&
        rect.bottom > window.innerHeight * 0.15;
      if (!inView) {
        return false;
      }
      begin();
      return true;
    };

    if (tryStart()) {
      return () => {
        cancelled = true;
        if (startTimer !== null) {
          window.clearTimeout(startTimer);
        }
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && isRevealActive(root)) {
          begin();
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(root);

    // Section reveal uses a class toggle — watch that too.
    const reveal = root.closest(".landing-reveal");
    const mo =
      reveal &&
      new MutationObserver(() => {
        if (tryStart()) {
          io.disconnect();
          mo?.disconnect();
        }
      });
    if (reveal && mo) {
      mo.observe(reveal, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      cancelled = true;
      if (startTimer !== null) {
        window.clearTimeout(startTimer);
      }
      io.disconnect();
      mo?.disconnect();
    };
  }, [reducedMotion]);

  useEffect(() => {
    onStageRef.current?.(stageForVisibleCount(visibleCount));
  }, [visibleCount]);

  useEffect(() => {
    if (!started || reducedMotion || visibleCount >= blocks.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, delayAfterCount(visibleCount));

    return () => window.clearTimeout(timer);
  }, [started, reducedMotion, visibleCount]);

  const allRevealed = visibleCount >= blocks.length;

  return (
    <div
      ref={rootRef}
      className={cn(
        "landing-mono overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0f] text-[12.5px] leading-6 text-zinc-300 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)]",
        className,
      )}
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

      <div className="min-h-[24rem] space-y-2.5 px-4 py-4">
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
