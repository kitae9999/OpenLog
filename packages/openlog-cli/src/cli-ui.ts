import type { WriteStream } from "node:tty";

const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";
const FG_CYAN = "\u001b[36m";
const FG_GREEN = "\u001b[32m";
const FG_RED = "\u001b[31m";
const CLEAR_LINE = "\u001b[2K";
const SPINNER_FRAMES = ["·", "o", "O", "o"] as const;

export type CliUiStream = Pick<
  WriteStream,
  "write" | "isTTY" | "columns" | "clearLine" | "cursorTo"
> & {
  clearLine?: (dir: -1 | 0 | 1) => boolean;
  cursorTo?: (x: number, y?: number) => boolean;
};

export type CliSpinner = {
  stop: (finalMessage?: string) => void;
};

export function supportsColor(
  stream: CliUiStream = process.stdout,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NO_COLOR != null && env.NO_COLOR !== "") {
    return false;
  }
  if (env.FORCE_COLOR === "0") {
    return false;
  }
  if (env.FORCE_COLOR != null && env.FORCE_COLOR !== "") {
    return true;
  }
  return Boolean(stream.isTTY);
}

function paint(
  text: string,
  code: string,
  color: boolean,
): string {
  if (!color || text.length === 0) {
    return text;
  }
  return `${code}${text}${RESET}`;
}

export function bold(
  text: string,
  color = supportsColor(),
): string {
  return paint(text, BOLD, color);
}

export function dim(
  text: string,
  color = supportsColor(),
): string {
  return paint(text, DIM, color);
}

export function success(
  text: string,
  color = supportsColor(),
): string {
  return paint(text, FG_GREEN, color);
}

export function errorText(
  text: string,
  color = supportsColor(),
): string {
  return paint(text, FG_RED, color);
}

export function accent(
  text: string,
  color = supportsColor(),
): string {
  return paint(text, FG_CYAN, color);
}

export function heading(
  text: string,
  color = supportsColor(),
): string {
  return bold(text, color);
}

export function hr(
  width = 28,
  color = supportsColor(),
): string {
  const line = "─".repeat(Math.max(8, Math.min(width, 48)));
  return dim(line, color);
}

export function kv(
  key: string,
  value: string,
  color = supportsColor(),
): string {
  // Leave at least one space between label and value (e.g. Capabilities).
  const width = Math.max(12, key.length + 1);
  const label = dim(key.padEnd(width), color);
  return `${label}${value}`;
}

export function box(
  content: string,
  color = supportsColor(),
): string {
  const lines = content.split("\n");
  const innerWidth = Math.max(...lines.map((line) => visibleWidth(line)), 1);
  const top = dim(`┌${"─".repeat(innerWidth + 2)}┐`, color);
  const bottom = dim(`└${"─".repeat(innerWidth + 2)}┘`, color);
  const body = lines
    .map((line) => {
      const padded = `${line}${" ".repeat(innerWidth - visibleWidth(line))}`;
      return `${dim("│ ", color)}${bold(padded, color)}${dim(" │", color)}`;
    })
    .join("\n");

  return [top, body, bottom].join("\n");
}

// Figlet-style block wordmark (ANSI Shadow). Wide terminals only.
const OPENLOG_LOGO = [
  " ██████╗ ██████╗ ███████╗███╗   ██╗██╗      ██████╗  ██████╗ ",
  "██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║     ██╔═══██╗██╔════╝ ",
  "██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ███╗",
  "██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║   ██║",
  "╚██████╔╝██║     ███████╗██║ ╚████║███████╗╚██████╔╝╚██████╔╝",
  " ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ",
] as const;

export function banner(
  options: {
    color?: boolean;
    columns?: number;
    tagline?: string;
  } = {},
): string {
  const color = options.color ?? supportsColor();
  const columns =
    options.columns ??
    (typeof process.stdout.columns === "number" ? process.stdout.columns : 80);
  const tagline = options.tagline ?? "session log · cli";

  // Full block logo needs ~61 cols (Hermes-style startup mark).
  if (columns < 64) {
    return [
      accent("「OL」", color) + " " + bold("openlog", color),
      dim(tagline, color),
      hr(24, color),
    ].join("\n");
  }

  const logo = OPENLOG_LOGO.map((line) => accent(line, color)).join("\n");
  return [logo, dim(tagline, color), hr(48, color)].join("\n");
}

export function formatError(
  message: string,
  color = supportsColor(process.stderr),
): string {
  if (!color) {
    return `error: ${message}`;
  }
  return `${errorText("error", color)} ${message}`;
}

export function createSpinner(
  label: string,
  options: {
    stream?: CliUiStream;
    color?: boolean;
    intervalMs?: number;
  } = {},
): CliSpinner {
  const stream = options.stream ?? process.stdout;
  const color = options.color ?? supportsColor(stream);
  const intervalMs = options.intervalMs ?? 120;
  const interactive = Boolean(stream.isTTY) && color;

  if (!interactive) {
    stream.write(`${dim(label, false)}\n`);
    return {
      stop(finalMessage) {
        if (finalMessage) {
          stream.write(`${finalMessage}\n`);
        }
      },
    };
  }

  let frame = 0;
  let stopped = false;

  const render = () => {
    if (stopped) {
      return;
    }
    const glyph = SPINNER_FRAMES[frame % SPINNER_FRAMES.length]!;
    frame += 1;
    const line = `${accent(glyph, color)} ${dim(label, color)}`;
    if (typeof stream.clearLine === "function" && typeof stream.cursorTo === "function") {
      stream.clearLine(0);
      stream.cursorTo(0);
      stream.write(line);
      return;
    }
    stream.write(`\r${CLEAR_LINE}${line}`);
  };

  render();
  const timer = setInterval(render, intervalMs);
  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return {
    stop(finalMessage) {
      if (stopped) {
        return;
      }
      stopped = true;
      clearInterval(timer);
      if (typeof stream.clearLine === "function" && typeof stream.cursorTo === "function") {
        stream.clearLine(0);
        stream.cursorTo(0);
      } else {
        stream.write(`\r${CLEAR_LINE}`);
      }
      if (finalMessage) {
        stream.write(`${finalMessage}\n`);
      }
    },
  };
}

function visibleWidth(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, "").length;
}
