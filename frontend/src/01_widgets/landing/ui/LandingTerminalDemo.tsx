"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { usePrefersReducedMotion } from "./useLandingScroll";

const lines = [
  {
    kind: "cmd",
    text: "npx -y @kitae9999/openlog-cli login",
  },
  { kind: "out", text: "Opened browser for auth…" },
  { kind: "ok", text: "Logged in as kitae@openlog.dev" },
  {
    kind: "cmd",
    text: 'git commit -m "fix: share link expiry uses UTC"',
  },
  { kind: "out", text: "[main a1b2c3d] fix: share link expiry uses UTC" },
  { kind: "out", text: "1 file changed, 12 insertions(+), 4 deletions(-)" },
  {
    kind: "cmd",
    text: 'openlog log "Expiry checks must compare UTC timestamps" --task share-link',
  },
  { kind: "ok", text: "Logged to task share-link · linked commit a1b2c3d" },
] as const;

export function LandingTerminalDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    reducedMotion ? lines.length : 0,
  );
  const [started, setStarted] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(lines.length);
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
    if (!started || reducedMotion || visibleCount >= lines.length) {
      return;
    }

    const delay = visibleCount === 0 ? 200 : 420;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [started, reducedMotion, visibleCount]);

  return (
    <div
      ref={rootRef}
      className="landing-mono overflow-hidden rounded-lg border border-zinc-800 bg-[#111113] text-[13px] leading-6 text-zinc-300 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-2 text-[11px] text-zinc-600">zsh — notes-app</span>
      </div>
      <div className="min-h-[18rem] space-y-1 px-4 py-4">
        {lines.slice(0, visibleCount).map((line, index) => (
          <p
            key={`${line.kind}-${index}`}
            className={cn(
              "landing-terminal-line",
              line.kind === "cmd" && "pt-2 first:pt-0",
            )}
          >
            {line.kind === "cmd" ? (
              <>
                <span className="text-zinc-500">$</span>{" "}
                <span className="text-zinc-100">{line.text}</span>
              </>
            ) : (
              <span
                className={
                  line.kind === "ok" ? "text-zinc-400" : "text-zinc-500"
                }
              >
                {line.text}
              </span>
            )}
          </p>
        ))}
        {visibleCount >= lines.length ? (
          <p className="pt-2">
            <span className="text-zinc-500">$</span>{" "}
            <span className="landing-terminal-cursor ml-1 inline-block h-4 w-2 align-middle bg-zinc-400" />
          </p>
        ) : null}
      </div>
    </div>
  );
}
