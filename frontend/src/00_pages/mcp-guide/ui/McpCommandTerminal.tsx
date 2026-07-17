"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/usePrefersReducedMotion";

const MS_PER_CHAR = 28;
const HOLD_AFTER_LINE_MS = 520;
const HOLD_BEFORE_LOOP_MS = 2600;

/** Session-demo style terminal that shows pasting/running a copied command. */
export function McpCommandTerminal({
  command,
  title,
}: {
  command: string;
  title: string;
}) {
  const lines = useMemo(
    () => command.split("\n").filter((line) => line.length > 0),
    [command],
  );
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);

  const activeLine = lines[lineIndex] ?? "";
  const visibleCompletedLines = reducedMotion ? lines : completedLines;
  const isTyping =
    !reducedMotion &&
    started &&
    lineIndex < lines.length &&
    typedChars < activeLine.length;
  const allDone =
    reducedMotion ||
    (completedLines.length >= lines.length && lineIndex >= lines.length);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const node = rootRef.current;
    if (!node) {
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
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, lines]);

  useEffect(() => {
    if (!started || reducedMotion) {
      return;
    }

    if (lineIndex >= lines.length) {
      const timer = window.setTimeout(() => {
        setCompletedLines([]);
        setLineIndex(0);
        setTypedChars(0);
      }, HOLD_BEFORE_LOOP_MS);
      return () => window.clearTimeout(timer);
    }

    const current = lines[lineIndex] ?? "";
    if (typedChars < current.length) {
      const timer = window.setTimeout(() => {
        setTypedChars((count) => count + 1);
      }, MS_PER_CHAR);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCompletedLines((prev) => [...prev, current]);
      setLineIndex((index) => index + 1);
      setTypedChars(0);
    }, HOLD_AFTER_LINE_MS);
    return () => window.clearTimeout(timer);
  }, [started, reducedMotion, lineIndex, typedChars, lines]);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-xl border border-zinc-800 bg-[#1c1c1e] shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-[#2a2a2c] px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400">
          {title}
        </span>
      </div>

      <div
        className="min-h-[7.5rem] space-y-1.5 px-3.5 py-3.5 font-mono text-[12.5px] leading-5 text-zinc-300"
        aria-live="polite"
      >
        {visibleCompletedLines.map((line, index) => (
          <ShellPrompt key={`done-${index}`}>
            <span className="break-all text-zinc-100">{line}</span>
          </ShellPrompt>
        ))}

        {!allDone ? (
          <ShellPrompt>
            <span className="break-all text-zinc-100">
              {activeLine.slice(0, typedChars)}
            </span>
            {isTyping || typedChars === 0 ? (
              <span className="preview-agent-cursor ml-0.5 inline-block h-3.5 w-1.5 align-middle bg-zinc-300" />
            ) : null}
          </ShellPrompt>
        ) : (
          <ShellPrompt>
            <span className="preview-agent-cursor inline-block h-3.5 w-1.5 align-middle bg-zinc-300" />
          </ShellPrompt>
        )}
      </div>
    </div>
  );
}

function ShellPrompt({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="text-emerald-400/90">dev@mac</span>
      <span className="text-zinc-500">:</span>
      <span className="text-sky-400/90">~</span>
      <span className="text-zinc-500"> %</span>{" "}
      {children}
    </p>
  );
}
