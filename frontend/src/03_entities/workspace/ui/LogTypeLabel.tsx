import type { ReactNode } from "react";

export function LogTypeLabel({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.04em] text-zinc-400">
      {children}
    </span>
  );
}
