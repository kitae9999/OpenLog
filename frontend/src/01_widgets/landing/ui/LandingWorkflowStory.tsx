"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";

const steps = [
  {
    step: "01",
    title: "Log",
    body: "Capture logs from your tools in one step, or write them yourself.",
    exampleLabel: "Example",
    example: [
      { tone: "muted", text: "$ git commit -m \"fix: share link expiry\"" },
      { tone: "ok", text: "→ logged to task share-link" },
      { tone: "muted", text: "$ openlog note \"Use UTC for expiry checks\"" },
      { tone: "ok", text: "→ decision saved" },
    ],
  },
  {
    step: "02",
    title: "Connect",
    body: "AI links related tasks and logs so the story stays connected.",
    exampleLabel: "Linked",
    example: [
      { tone: "strong", text: "share-link" },
      { tone: "muted", text: "├─ fix: expiry uses UTC" },
      { tone: "muted", text: "├─ decision: read-only shares" },
      { tone: "muted", text: "└─ issue: preview missing title" },
    ],
  },
  {
    step: "03",
    title: "Publish",
    body: "Share your work as a public post anyone can read and learn from.",
    exampleLabel: "Draft",
    example: [
      { tone: "strong", text: "How we built read-only share links" },
      { tone: "muted", text: "from 3 logs · ready to publish" },
      { tone: "ok", text: "→ open for edit suggestions" },
    ],
  },
] as const;

export function LandingWorkflowStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-20">
      <ol className="space-y-8">
        {steps.map((step, index) => {
          const selected = index === activeIndex;
          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className="w-full text-left"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      "landing-mono text-[11px] tracking-widest transition-colors",
                      selected ? "text-black" : "text-zinc-400",
                    )}
                  >
                    {step.step}
                  </span>
                  <h3
                    className={cn(
                      "landing-display text-2xl font-bold transition-colors",
                      selected ? "text-black" : "text-zinc-400",
                    )}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  className={cn(
                    "mt-2 max-w-md text-[15px] leading-relaxed font-light transition-colors",
                    selected ? "text-zinc-500" : "text-zinc-400",
                  )}
                >
                  {step.body}
                </p>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="landing-mono border-l border-zinc-200 pl-6 text-[13px] leading-7 sm:pl-8">
        <p className="text-[11px] tracking-widest text-zinc-400 uppercase">
          {active.exampleLabel} · {active.step} {active.title}
        </p>
        <div className="mt-4 space-y-1">
          {active.example.map((line) => (
            <p
              key={`${active.step}-${line.text}`}
              className={cn(
                line.tone === "strong" && "font-medium text-zinc-900",
                line.tone === "ok" && "text-zinc-600",
                line.tone === "muted" && "text-zinc-500",
              )}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
