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
        <ToolbarAssetIcon src="/button.svg" className="size-5" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        disabled={disabled}
        onClick={() => onAction("italic")}
      >
        <ToolbarAssetIcon src="/button-1.svg" className="size-5" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Link"
        disabled={disabled}
        onClick={() => onAction("link")}
      >
        <ToolbarAssetIcon src="/button-2.svg" className="size-5" />
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
        <ToolbarAssetIcon src="/button-3.svg" className="size-5" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Bulleted list"
        disabled={disabled}
        onClick={() => onAction("unordered-list")}
      >
        <ToolbarAssetIcon src="/button-4.svg" className="size-5" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        disabled={disabled}
        onClick={() => onAction("ordered-list")}
      >
        <ToolbarAssetIcon src="/button-5.svg" className="size-5" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarAssetIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current align-middle", className)}
      style={{
        WebkitMask: `url('${src}') center / contain no-repeat`,
        mask: `url('${src}') center / contain no-repeat`,
      }}
    />
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
