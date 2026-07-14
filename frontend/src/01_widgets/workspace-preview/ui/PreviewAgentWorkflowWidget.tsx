"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import { OpenLogLogo } from "@/shared/ui/brand";
import { FetchingIndicator } from "@/shared/ui/sync";
import type {
  PreviewAgentLine,
  PreviewReplaySnapshot,
  PreviewStageId,
} from "@/widgets/workspace-preview/model/previewSessionReplay";
import { PREVIEW_STAGE_PILLS } from "@/widgets/workspace-preview/model/previewSessionReplay";
import type { PreviewSessionReplayControls } from "@/widgets/workspace-preview/model/usePreviewSessionReplay";

const FETCH_TOAST_EXIT_MS = 380;

export function PreviewAgentWorkflowWidget({
  replay,
  workspace,
}: {
  replay: PreviewSessionReplayControls;
  workspace: ReactNode;
}) {
  const snapshot = replay.snapshot;

  return (
    <div data-testid="guest-preview-demo" className="space-y-3">
      <PreviewStageBar
        activeStageId={snapshot.stageId}
        onSelectStage={replay.seekToStage}
      />

      <div className="relative grid gap-3 lg:h-[min(680px,78dvh)] lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.55fr)] lg:items-stretch">
        <TerminalWindow
          snapshot={snapshot}
          isPlaying={replay.isPlaying}
          isComplete={replay.isComplete}
          reducedMotion={replay.reducedMotion}
        />
        <BrowserWindow snapshot={snapshot} reducedMotion={replay.reducedMotion}>
          {workspace}
        </BrowserWindow>
      </div>
    </div>
  );
}

function PreviewStageBar({
  activeStageId,
  onSelectStage,
}: {
  activeStageId: PreviewStageId;
  onSelectStage: (stageId: PreviewStageId) => void;
}) {
  return (
    <div
      data-testid="guest-preview-stage-bar"
      className="flex flex-wrap items-center justify-center gap-2"
      role="list"
      aria-label="Demo stages"
    >
      {PREVIEW_STAGE_PILLS.map((pill) => {
        const active = pill.id === activeStageId;
        return (
          <button
            key={pill.id}
            type="button"
            role="listitem"
            data-testid={`guest-preview-stage-${pill.id}`}
            data-active={active ? "true" : "false"}
            aria-current={active ? "step" : undefined}
            aria-label={`Play from ${pill.label}`}
            onClick={() => onSelectStage(pill.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors duration-300",
              active
                ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_0_0_1px_rgba(24,24,27,0.08),0_8px_24px_-12px_rgba(24,24,27,0.45)]"
                : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600",
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

function TerminalWindow({
  snapshot,
  isPlaying,
  isComplete,
  reducedMotion,
}: {
  snapshot: PreviewReplaySnapshot;
  isPlaying: boolean;
  isComplete: boolean;
  reducedMotion: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const showClaudeSession = snapshot.shellComplete;

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    // Keep the latest transcript line in view without growing the window.
    const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
    const frame = window.requestAnimationFrame(() => {
      node.scrollTo({ top: node.scrollHeight, behavior });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    snapshot.agentLines.length,
    snapshot.shellText,
    snapshot.promptTyping,
    snapshot.stepId,
    isPlaying,
    isComplete,
    reducedMotion,
  ]);

  const lastLine = snapshot.agentLines[snapshot.agentLines.length - 1];
  const showThinking =
    !isComplete &&
    isPlaying &&
    !snapshot.promptTyping &&
    snapshot.shellComplete &&
    lastLine?.kind !== "banner";

  return (
    <div
      data-testid="guest-preview-terminal"
      className="flex h-[min(380px,48dvh)] min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#1c1c1e] shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] lg:h-full"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-[#2a2a2c] px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-mono text-[11px] text-zinc-400">
          zsh — ~/myproject
        </span>
      </div>

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3.5 font-mono text-[12.5px] leading-5 text-zinc-300"
        aria-live="polite"
      >
        <p>
          <span className="text-emerald-400/90">dev@mac</span>
          <span className="text-zinc-500">:</span>
          <span className="text-sky-400/90">~/myproject</span>
          <span className="text-zinc-500"> %</span>{" "}
          <span className="text-zinc-100">{snapshot.shellText}</span>
          {!snapshot.shellComplete && !reducedMotion ? (
            <span className="preview-agent-cursor ml-0.5 inline-block h-3.5 w-1.5 align-middle bg-zinc-300" />
          ) : null}
        </p>

        {showClaudeSession ? (
          <>
            {snapshot.agentLines.map((line, index, list) => (
              <AgentTranscriptLine
                key={line.id}
                line={line}
                isLatest={index === list.length - 1}
                showTypingCursor={
                  line.kind === "user" &&
                  snapshot.promptTyping &&
                  index === list.length - 1 &&
                  !reducedMotion
                }
              />
            ))}

            {showThinking ? (
              <p className="flex items-center gap-2 pt-0.5 text-zinc-400">
                <span className="preview-agent-sparkle text-[13px] text-[#d97757]">
                  ✻
                </span>
                Thinking…
                <span className="text-zinc-600">(esc to interrupt)</span>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Full desktop workspace width used as the design canvas before scale-to-fit. */
const PREVIEW_BROWSER_FULL_WIDTH = 1100;

function BrowserWindow({
  children,
  snapshot,
  reducedMotion,
}: {
  children: ReactNode;
  snapshot: PreviewReplaySnapshot;
  reducedMotion: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const canvasHeightRef = useRef(0);
  const lastScrollKeyRef = useRef("");
  const [scale, setScale] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const isFetching = snapshot.syncFill.status === "fetching";
  const [toastMounted, setToastMounted] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const wasFetchingRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    if (reducedMotion) {
      wasFetchingRef.current = false;
      frame = window.requestAnimationFrame(() => {
        setToastMounted(false);
        setToastExiting(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (isFetching) {
      wasFetchingRef.current = true;
      frame = window.requestAnimationFrame(() => {
        setToastMounted(true);
        setToastExiting(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!wasFetchingRef.current || !toastMounted) {
      return;
    }

    frame = window.requestAnimationFrame(() => setToastExiting(true));
    const timer = window.setTimeout(() => {
      setToastMounted(false);
      setToastExiting(false);
      wasFetchingRef.current = false;
    }, FETCH_TOAST_EXIT_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isFetching, toastMounted, reducedMotion]);

  // Measure scale from the non-scrolling shell so scrollbar appearance
  // cannot change clientWidth and re-trigger scale ↔ height oscillation.
  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    function measureScale() {
      const width = shellRef.current?.clientWidth ?? 0;
      if (width <= 0) {
        return;
      }
      const next = Math.min(1, width / PREVIEW_BROWSER_FULL_WIDTH);
      if (Math.abs(next - scaleRef.current) < 0.001) {
        return;
      }
      scaleRef.current = next;
      setScale(next);
    }

    measureScale();
    const observer = new ResizeObserver(measureScale);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    function measureHeight() {
      const next = canvasRef.current?.scrollHeight ?? 0;
      // Ignore sub-pixel churn from fonts/borders during capture updates.
      if (Math.abs(next - canvasHeightRef.current) < 2) {
        return;
      }
      canvasHeightRef.current = next;
      setCanvasHeight(next);
    }

    measureHeight();
    const observer = new ResizeObserver(measureHeight);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [
    snapshot.stepId,
    snapshot.tasks.length,
    snapshot.logs.length,
    snapshot.outputs.length,
    snapshot.todos.length,
    snapshot.memories.length,
  ]);

  // Scroll only when the demo focus target changes — not on every
  // height/scale remeasure (that loop is what made Capture vibrate).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const target = snapshot.cursorTarget;
    const scrollKey = `${snapshot.stepId}:${target}:${snapshot.logs.length}:${snapshot.outputs.length}`;
    if (scrollKey === lastScrollKeyRef.current) {
      return;
    }
    lastScrollKeyRef.current = scrollKey;

    const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

    const frame = window.requestAnimationFrame(() => {
      if (target === "none" || target === "prompt") {
        return;
      }

      const el = stage.querySelector(`[data-preview-anchor="${target}"]`);
      if (el instanceof HTMLElement) {
        const stageRect = stage.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const nextTop =
          stage.scrollTop +
          (elRect.top - stageRect.top) -
          stage.clientHeight * 0.22;
        stage.scrollTo({ top: Math.max(0, nextTop), behavior });
        return;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    snapshot.cursorTarget,
    snapshot.stepId,
    snapshot.logs.length,
    snapshot.outputs.length,
    reducedMotion,
  ]);

  return (
    <div
      data-testid="guest-preview-browser"
      className="flex h-[min(520px,62dvh)] min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-[0_18px_50px_-28px_rgba(24,24,27,0.35)] lg:h-full"
    >
      {/* Chrome-style title / tab strip */}
      <div className="flex shrink-0 items-end gap-0 border-b border-zinc-200 bg-[#dee1e6] px-2 pt-2">
        <div className="mb-0 flex items-center gap-1.5 pb-2 pl-1 pr-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="relative flex min-w-0 max-w-[240px] flex-1 items-center gap-2 rounded-t-lg border border-b-0 border-zinc-300 bg-white px-3 py-2">
          <OpenLogFavicon className="size-3 shrink-0" />
          <span className="truncate text-[11px] font-medium text-zinc-700">
            OpenLog
          </span>
          <span className="ml-auto text-[10px] leading-none text-zinc-400">
            ×
          </span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Chrome toolbar + omnibox */}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
        <div className="flex shrink-0 items-center gap-1 text-zinc-400">
          <ChromeNavIcon kind="back" />
          <ChromeNavIcon kind="forward" />
          <ChromeNavIcon kind="reload" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1.5">
          <ChromeLockIcon />
          <span className="truncate text-[12px] text-zinc-700">openlog.kr</span>
        </div>
      </div>

      <div ref={shellRef} className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          inert
          data-testid="guest-preview-browser-stage"
          className="preview-workspace-stage h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--app-canvas)] [scrollbar-gutter:stable]"
        >
          <div
            className="relative w-full overflow-hidden"
            style={{ height: Math.max(canvasHeight * scale, 1) }}
          >
            <div
              ref={canvasRef}
              data-testid="guest-preview-fullsize-canvas"
              data-preview-scale={scale.toFixed(3)}
              className="origin-top-left"
              style={{
                width: PREVIEW_BROWSER_FULL_WIDTH,
                transform: `scale(${scale})`,
              }}
            >
              <div className="p-4">{children}</div>
            </div>
          </div>
        </div>

        {toastMounted ? (
          <FetchingIndicator
            exiting={toastExiting}
            // Clear stable scrollbar gutter (~15px) + padding so the chip
            // does not sit on top of the track.
            className="absolute right-7 bottom-3 z-20"
          />
        ) : null}
      </div>
    </div>
  );
}

function ChromeNavIcon({ kind }: { kind: "back" | "forward" | "reload" }) {
  if (kind === "reload") {
    return (
      <span
        className="grid size-6 place-items-center rounded-full text-[13px] leading-none"
        aria-hidden="true"
      >
        ↻
      </span>
    );
  }

  return (
    <span
      className="grid size-6 place-items-center rounded-full text-[14px] leading-none"
      aria-hidden="true"
    >
      {kind === "back" ? "‹" : "›"}
    </span>
  );
}

/** Header-style OpenLog mark (black tile + O). */
function OpenLogFavicon({ className }: { className?: string }) {
  return (
    <OpenLogLogo
      variant="mark"
      className={className}
      decorative
      sizes="12px"
    />
  );
}

function ChromeLockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-zinc-500"
    >
      <rect
        x="2.5"
        y="5.5"
        width="7"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isMcpTool(toolText: string) {
  return toolText.startsWith("mcp__");
}

/** Claude Code prettifies `mcp__server__tool` → `server - tool` in the UI. */
function formatToolName(toolText: string) {
  if (!isMcpTool(toolText)) {
    return toolText;
  }

  return toolText.replace(/^mcp__/, "").replace(/__/g, " - ");
}

function AgentTranscriptLine({
  line,
  isLatest,
  showTypingCursor = false,
}: {
  line: PreviewAgentLine;
  isLatest: boolean;
  showTypingCursor?: boolean;
}) {
  if (line.kind === "banner") {
    // Actual Claude Code welcome UI: a rounded box with the orange ✻ sparkle.
    // Rendered with CSS borders (no ASCII box-drawing) so it stays aligned in
    // any browser font.
    return (
      <div className="preview-replay-enter pt-1">
        <div
          data-testid="claude-icon"
          aria-label="Claude Code"
          className="rounded-lg border border-zinc-700/70 px-3.5 py-2.5"
        >
          <p className="text-[12.5px] leading-[1.5]">
            <span className="text-[#d97757]">✻</span>{" "}
            <span className="font-medium text-zinc-100">
              Welcome to {line.text}
            </span>
          </p>
          {line.detail ? (
            <p className="mt-1.5 pl-[1.15rem] text-[11.5px] leading-[1.5] text-zinc-500">
              {line.detail}
            </p>
          ) : null}
          <p className="pl-[1.15rem] text-[11.5px] leading-[1.5] text-zinc-600">
            cwd: ~/myproject
          </p>
        </div>
      </div>
    );
  }

  if (line.kind === "user") {
    // Submitted prompt sits in the input box, exactly like Claude Code's prompt.
    return (
      <div
        data-preview-cursor="prompt"
        className={cn(
          "preview-replay-enter flex gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-3 py-2.5",
          isLatest && "preview-agent-line-latest",
        )}
      >
        <span className="shrink-0 text-[#d97757]">&gt;</span>
        <p className="min-w-0 whitespace-pre-wrap text-[12.5px] leading-5 text-zinc-100">
          {line.text}
          {showTypingCursor ? (
            <span className="preview-agent-cursor ml-0.5 inline-block h-3.5 w-1.5 align-middle bg-zinc-300" />
          ) : null}
        </p>
      </div>
    );
  }

  // Tool results (and the final draft) hang under the ⏺ bullet with a ⎿ branch.
  if (line.kind === "result" || line.kind === "ok") {
    return (
      <div
        className={cn(
          "preview-replay-enter flex gap-2 pl-[1.15rem] text-[11.5px] leading-5",
          isLatest && "preview-agent-line-latest",
        )}
      >
        <span className="shrink-0 select-none text-zinc-700">⎿</span>
        <p
          className={cn(
            "min-w-0 break-words",
            line.kind === "ok" ? "text-zinc-200" : "text-zinc-400",
          )}
        >
          {line.text}
        </p>
      </div>
    );
  }

  // Everything else — tool calls and assistant text — leads with the ⏺ bullet.
  return (
    <div
      className={cn(
        "preview-replay-enter flex gap-2 text-[12.5px] leading-5",
        isLatest && "preview-agent-line-latest",
      )}
    >
      <span className="shrink-0 text-[#d97757]">⏺</span>
      {line.kind === "tool" ? (
        <p className="min-w-0 break-words text-zinc-200">
          <span className="font-medium">{formatToolName(line.text)}</span>
          {line.detail ? (
            <>
              <span className="text-zinc-600">(</span>
              <span className="text-zinc-400">{line.detail}</span>
              <span className="text-zinc-600">)</span>
            </>
          ) : null}
          {isMcpTool(line.text) ? (
            <span className="text-zinc-500"> (MCP)</span>
          ) : null}
        </p>
      ) : (
        <p
          className={cn(
            "min-w-0 break-words",
            line.kind === "thought" ? "text-zinc-300" : "text-zinc-100",
          )}
        >
          {line.text}
        </p>
      )}
    </div>
  );
}
