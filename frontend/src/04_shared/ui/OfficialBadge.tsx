import { cn } from "@/shared/lib/cn";

export function OfficialBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      role="img"
      aria-label="Official OpenLog account"
      title="Official OpenLog account"
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-blue-500",
        size === "sm" ? "size-3.5" : "size-4",
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path
          d="m4.9 8.1 2 2 4.2-4.3"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
