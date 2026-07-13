"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { FetchingIndicator } from "./FetchingIndicator";

export type BrowserLogBlock = {
  id: string;
  title: string;
  meta: string;
};

export type LandingBrowserDemoProps = {
  isFetchingLog: boolean;
  logBlocks: BrowserLogBlock[];
  className?: string;
};

const TOAST_EXIT_MS = 380;

/** Mini OpenLog browser surface — fetching then animated block append. */
export function LandingBrowserDemo({
  isFetchingLog,
  logBlocks,
  className,
}: LandingBrowserDemoProps) {
  const isEmpty = logBlocks.length === 0 && !isFetchingLog;
  const [toastMounted, setToastMounted] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const wasFetchingRef = useRef(false);

  // Keep toast mounted through fade-out so it does not vanish instantly.
  useEffect(() => {
    let frame = 0;

    if (isFetchingLog) {
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
    }, TOAST_EXIT_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isFetchingLog, toastMounted]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_20px_50px_-28px_rgba(24,24,27,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <div className="landing-mono ml-2 min-w-0 flex-1 truncate rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 text-[11px] text-zinc-500">
          openlog.app/workspace
        </div>
      </div>

      <div className="relative flex min-h-[24rem] flex-col space-y-4 px-4 py-4">
        <section aria-label="Logs" className="min-h-0 flex-1">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h3 className="landing-mono text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
              Log
            </h3>
            {logBlocks.length > 0 ? (
              <span className="landing-mono text-[10px] tracking-wider text-zinc-400">
                {logBlocks.length} item{logBlocks.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            {isEmpty ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-[13px] text-zinc-400">
                Logs appear here when your tools sync…
              </p>
            ) : null}

            {logBlocks.map((block) => (
              <article
                key={block.id}
                className="landing-block-enter rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2.5"
              >
                <p className="text-[13px] font-medium leading-snug text-zinc-900">
                  {block.title}
                </p>
                <p className="landing-mono mt-1 text-[11px] tracking-wide text-zinc-500">
                  {block.meta}
                </p>
              </article>
            ))}
          </div>
        </section>

        {logBlocks.length > 0 ? (
          <section aria-label="Linked task" className="landing-block-enter">
            <h3 className="landing-mono mb-2 text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
              Linked
            </h3>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
              <span className="landing-mono text-[11px] font-medium text-zinc-700">
                share-link
              </span>
            </div>
          </section>
        ) : null}

        {toastMounted ? (
          <FetchingIndicator
            exiting={toastExiting}
            className="absolute right-7 bottom-3 z-20"
          />
        ) : null}
      </div>
    </div>
  );
}
