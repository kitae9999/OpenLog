"use client";

import dynamic from "next/dynamic";
import { cn } from "@/shared/lib/cn";

const MermaidDiagram = dynamic(
  () => import("./MermaidDiagram").then((module) => module.MermaidDiagram),
  {
    ssr: false,
    loading: () => <MermaidLoadingState />,
  },
);

export function MarkdownMermaidBlock({
  code,
  variant,
}: {
  code: string;
  variant: "default" | "compact" | "dense";
}) {
  return (
    <section
      className={cn(
        "markdown-mermaid overflow-hidden rounded-lg border",
        variant === "dense" ? "my-1" : "my-2",
      )}
      aria-label="Mermaid diagram"
    >
      <MermaidDiagram key={code} code={code} variant={variant} />
    </section>
  );
}

function MermaidLoadingState() {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-2 px-5 py-10 text-xs font-medium"
      role="status"
    >
      <span
        className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent opacity-60"
        aria-hidden="true"
      />
      Rendering diagram…
    </div>
  );
}
