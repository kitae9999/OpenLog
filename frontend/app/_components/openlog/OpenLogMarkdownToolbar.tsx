import type { ReactNode } from "react";
import { cn } from "./OpenLogChrome";
import type { ToolbarAction } from "./openLogMarkdownFormatting";

export function OpenLogMarkdownToolbar({
  disabled,
  onAction,
}: {
  disabled: boolean;
  onAction: (action: ToolbarAction) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToolbarButton
        label="Bold"
        disabled={disabled}
        onClick={() => onAction("bold")}
      >
        <span className="text-[15px] font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        disabled={disabled}
        onClick={() => onAction("italic")}
      >
        <span className="text-[15px] italic">I</span>
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Link"
        disabled={disabled}
        onClick={() => onAction("link")}
      >
        <IconLink className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        disabled={disabled}
        onClick={() => onAction("code-block")}
      >
        <span className="text-[12px] font-semibold">&lt;/&gt;</span>
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        disabled={disabled}
        onClick={() => onAction("inline-code")}
      >
        <IconInlineCode className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        disabled={disabled}
        onClick={() => onAction("quote")}
      >
        <IconQuote className="size-4" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Bulleted list"
        disabled={disabled}
        onClick={() => onAction("unordered-list")}
      >
        <IconList className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        disabled={disabled}
        onClick={() => onAction("ordered-list")}
      >
        <IconOrderedList className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-white hover:text-zinc-950",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="h-4 w-px bg-zinc-300" aria-hidden="true" />;
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07L13 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQuote({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 11H6a2 2 0 01-2-2V7a4 4 0 014-4h2v4H8v2h2v2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 11h-4a2 2 0 01-2-2V7a4 4 0 014-4h2v4h-2v2h2v2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInlineCode({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="11"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M10 10l-2 2 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10l2 2-2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 6h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 12h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 18h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconOrderedList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 6h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 18h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 7V5l-1 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5h2v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 13.5a1.5 1.5 0 013 0c0 1-1.5 1.5-3 3h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 19H5a1 1 0 010 2H3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19a1 1 0 010-2H3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
