"use client";

import { cn } from "@/shared/lib/cn";
import {
  MCP_SETUP_STEP_ORDER,
  MCP_SETUP_STEP_SNAPSHOTS,
  OPENLOG_BANNER_LOGO,
  type McpSetupDemoLine,
  type McpSetupStepId,
} from "@/pages/mcp-guide/model/mcpSetupTerminalScript";

/** Match packages/openlog-cli/src/cli-ui.ts ANSI colors on a dark TTY. */
const CLI = {
  accent: "#22d3ee",
  success: "#4ade80",
  dim: "#71717a",
  fg: "#e4e4e7",
  bold: "#fafafa",
} as const;

export type McpSetupStepCopy = {
  title: string;
  body: string;
  bullets?: readonly string[];
};

export function McpSetupSteps({
  steps,
  className,
}: {
  steps: Record<McpSetupStepId, McpSetupStepCopy>;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0 divide-y divide-zinc-200/80", className)}>
      {MCP_SETUP_STEP_ORDER.map((id, index) => {
        const step = steps[id];
        const lines = MCP_SETUP_STEP_SNAPSHOTS[id];
        return (
          <li key={id} className="grid gap-4 py-8 first:pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight text-zinc-950">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                {step.body}
              </p>
              {step.bullets && step.bullets.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-zinc-400">
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <CliSnapshot lines={lines} />
          </li>
        );
      })}
    </ol>
  );
}

function CliSnapshot({ lines }: { lines: McpSetupDemoLine[] }) {
  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-700/80 bg-black text-[11.5px] leading-[1.45]"
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#2b2b2b] px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="min-w-0 flex-1 truncate text-center text-[10.5px] text-zinc-400">
          notes-app — -zsh — 80×24
        </span>
        <span className="w-[36px]" aria-hidden="true" />
      </div>
      <div
        className="openlog-scroll max-h-[18rem] overflow-y-auto px-3 py-2.5"
        style={{ color: CLI.fg }}
      >
        {lines.map((line, index) => (
          <DemoLine key={index} line={line} />
        ))}
      </div>
    </div>
  );
}

function DemoLine({ line }: { line: McpSetupDemoLine }) {
  if (line.kind === "blank") {
    return <div className="h-[1.45em]" />;
  }

  if (line.kind === "shell") {
    return (
      <p className="whitespace-pre-wrap break-all">
        <span style={{ color: CLI.success }}>you@mac notes-app %</span>{" "}
        <span>{line.text}</span>
      </p>
    );
  }

  if (line.kind === "banner") {
    return (
      <div className="whitespace-pre overflow-x-auto">
        {OPENLOG_BANNER_LOGO.map((row) => (
          <p key={row} style={{ color: CLI.accent }}>
            {row}
          </p>
        ))}
        <p style={{ color: CLI.dim }}>{line.tagline}</p>
        <p style={{ color: CLI.dim }}>{"─".repeat(48)}</p>
      </div>
    );
  }

  if (line.kind === "heading") {
    return (
      <p className="font-bold" style={{ color: CLI.bold }}>
        {line.text}
      </p>
    );
  }

  if (line.kind === "dim") {
    return <p style={{ color: CLI.dim }}>{line.text}</p>;
  }

  if (line.kind === "success") {
    return <p style={{ color: CLI.success }}>{line.text}</p>;
  }

  if (line.kind === "kv") {
    const width = Math.max(12, line.key.length + 1);
    return (
      <p className="break-all">
        <span style={{ color: CLI.dim }}>{line.key.padEnd(width)}</span>
        <span style={{ color: CLI.fg }}>{line.value}</span>
      </p>
    );
  }

  if (line.kind === "choice") {
    return (
      <p>
        <span style={{ color: CLI.fg }}>
          {"  "}
          {line.text}
        </span>
        {line.default ? (
          <span style={{ color: CLI.dim }}> (default)</span>
        ) : null}
      </p>
    );
  }

  if (line.kind === "prompt") {
    const isChoiceCaret = line.text.trimStart().startsWith(">");
    return (
      <p>
        <span style={{ color: isChoiceCaret ? CLI.dim : CLI.fg }}>
          {line.text}
        </span>
      </p>
    );
  }

  if (line.kind === "box") {
    const inner = Math.max(line.text.length, 1);
    return (
      <div className="whitespace-pre">
        <p style={{ color: CLI.dim }}>{`┌${"─".repeat(inner + 2)}┐`}</p>
        <p>
          <span style={{ color: CLI.dim }}>│ </span>
          <span className="font-bold" style={{ color: CLI.bold }}>
            {line.text.padEnd(inner)}
          </span>
          <span style={{ color: CLI.dim }}> │</span>
        </p>
        <p style={{ color: CLI.dim }}>{`└${"─".repeat(inner + 2)}┘`}</p>
      </div>
    );
  }

  return <p style={{ color: CLI.fg }}>{line.text}</p>;
}
