"use client";

import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";
import { cn } from "@/shared/lib/cn";

type ColorScheme = "light" | "dark";
type RenderState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error" };

let renderQueue = Promise.resolve();

export function MermaidDiagram({
  code,
  variant,
}: {
  code: string;
  variant: "default" | "compact" | "dense";
}) {
  const componentId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const colorScheme = usePreferredColorScheme();
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [renderState, setRenderState] = useState<RenderState>({
    status: "loading",
  });

  useEffect(() => {
    let isCurrent = true;
    const diagramId = `openlog-mermaid-${componentId}-${renderAttempt}`;

    void enqueueRender(async () => {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        mermaid.initialize(createMermaidConfig(colorScheme));
        const { svg } = await mermaid.render(diagramId, code);
        const safeSvg = sanitizeMermaidSvg(svg);

        if (isCurrent) {
          setRenderState({ status: "ready", svg: safeSvg });
        }
      } catch {
        document.getElementById(`d${diagramId}`)?.remove();

        if (isCurrent) {
          setRenderState({ status: "error" });
        }
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [code, colorScheme, componentId, renderAttempt]);

  if (renderState.status === "loading") {
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

  if (renderState.status === "error") {
    return (
      <div
        className={cn("px-4 py-4", variant === "default" && "sm:px-5 sm:py-5")}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              Diagram couldn&apos;t be rendered
            </p>
            <p className="mt-1 text-xs leading-5 opacity-70">
              Check the Mermaid syntax, then try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRenderState({ status: "loading" });
              setRenderAttempt((attempt) => attempt + 1);
            }}
            className="shrink-0 cursor-pointer rounded-md border border-current/20 px-2.5 py-1.5 text-xs font-medium transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20"
          >
            Retry
          </button>
        </div>

        <details className="mt-4 border-t border-current/15 pt-3">
          <summary className="cursor-pointer text-xs font-medium opacity-70">
            View Mermaid source
          </summary>
          <pre className="openlog-scroll mt-3 max-h-72 overflow-auto rounded-md bg-black/5 p-3 font-mono text-xs leading-5">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="openlog-scroll overflow-x-auto">
      <div
        className={cn(
          "mermaid-diagram min-w-max",
          variant === "default" ? "px-5 py-6 sm:px-7" : "px-4 py-5",
        )}
        role="img"
        aria-label="Rendered Mermaid diagram"
        dangerouslySetInnerHTML={{ __html: renderState.svg }}
      />
    </div>
  );
}

function enqueueRender<T>(render: () => Promise<T>) {
  const nextRender = renderQueue.then(render, render);
  renderQueue = nextRender.then(
    () => undefined,
    () => undefined,
  );
  return nextRender;
}

function createMermaidConfig(colorScheme: ColorScheme) {
  const isDark = colorScheme === "dark";

  return {
    startOnLoad: false,
    securityLevel: "strict" as const,
    suppressErrorRendering: true,
    maxTextSize: 50_000,
    maxEdges: 500,
    htmlLabels: false,
    theme: "base" as const,
    fontFamily:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    themeVariables: {
      darkMode: isDark,
      background: isDark ? "#18181b" : "#fafafa",
      primaryColor: isDark ? "#27272a" : "#f4f4f5",
      primaryTextColor: isDark ? "#f4f4f5" : "#18181b",
      primaryBorderColor: isDark ? "#71717a" : "#a1a1aa",
      secondaryColor: isDark ? "#064e3b" : "#ecfdf5",
      secondaryTextColor: isDark ? "#ecfdf5" : "#065f46",
      secondaryBorderColor: isDark ? "#10b981" : "#34d399",
      tertiaryColor: isDark ? "#3f3f46" : "#ffffff",
      tertiaryTextColor: isDark ? "#e4e4e7" : "#3f3f46",
      tertiaryBorderColor: isDark ? "#71717a" : "#d4d4d8",
      lineColor: isDark ? "#a1a1aa" : "#52525b",
      textColor: isDark ? "#f4f4f5" : "#18181b",
      noteBkgColor: isDark ? "#422006" : "#fffbeb",
      noteTextColor: isDark ? "#fef3c7" : "#78350f",
      noteBorderColor: isDark ? "#d97706" : "#f59e0b",
    },
    flowchart: {
      useMaxWidth: false,
    },
  };
}

function sanitizeMermaidSvg(svg: string) {
  const documentNode = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = documentNode.documentElement;

  if (
    root.nodeName.toLowerCase() !== "svg" ||
    documentNode.querySelector("parsererror")
  ) {
    throw new Error("Invalid Mermaid SVG");
  }

  documentNode
    .querySelectorAll("script, foreignObject, iframe, object, embed")
    .forEach((node) => node.remove());

  documentNode.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (
        name.startsWith("on") ||
        ((name === "href" || name === "xlink:href") &&
          value.length > 0 &&
          !value.startsWith("#")) ||
        value.includes("javascript:") ||
        value.includes("data:text/html")
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  root.setAttribute("focusable", "false");
  root.setAttribute("aria-hidden", "true");
  return root.outerHTML;
}

function usePreferredColorScheme(): ColorScheme {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () => {
      setColorScheme(mediaQuery.matches ? "dark" : "light");
    };

    updateColorScheme();
    mediaQuery.addEventListener("change", updateColorScheme);

    return () => {
      mediaQuery.removeEventListener("change", updateColorScheme);
    };
  }, []);

  return colorScheme;
}
