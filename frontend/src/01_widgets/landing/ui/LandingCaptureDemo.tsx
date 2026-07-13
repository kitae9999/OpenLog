"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LandingBrowserDemo,
  type BrowserLogBlock,
} from "./LandingBrowserDemo";
import {
  LandingTerminalDemo,
  type LandingTerminalStage,
} from "./LandingTerminalDemo";
import { usePrefersReducedMotion } from "./useLandingScroll";

/** Minimum Fetching... visibility so the row does not flash. */
const FETCH_HOLD_MS = 450;

const DEMO_LOG_BLOCK: BrowserLogBlock = {
  id: "demo-log-expiry-utc",
  title: "Expiry checks must compare UTC",
  meta: "share-link · a1b2c3d",
};

type BrowserDemoState = {
  isFetchingLog: boolean;
  logBlocks: BrowserLogBlock[];
};

const INITIAL_STATE: BrowserDemoState = {
  isFetchingLog: false,
  logBlocks: [],
};

/**
 * Pairs terminal playback with a mini browser that shows
 * Fetching... then animated block append (product live-sync shaped).
 */
export function LandingCaptureDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const [browser, setBrowser] = useState<BrowserDemoState>(INITIAL_STATE);
  const fetchStartedAtRef = useRef<number | null>(null);
  const appendTimerRef = useRef<number | null>(null);
  const pendingBlockRef = useRef<BrowserLogBlock | null>(null);

  const clearAppendTimer = useCallback(() => {
    if (appendTimerRef.current !== null) {
      window.clearTimeout(appendTimerRef.current);
      appendTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAppendTimer(), [clearAppendTimer]);

  const appendLog = useCallback((block: BrowserLogBlock) => {
    pendingBlockRef.current = null;
    setBrowser((current) => {
      if (current.logBlocks.some((item) => item.id === block.id)) {
        return { ...current, isFetchingLog: false };
      }
      return {
        isFetchingLog: false,
        logBlocks: [...current.logBlocks, block],
      };
    });
    fetchStartedAtRef.current = null;
  }, []);

  const handleStage = useCallback(
    (stage: LandingTerminalStage) => {
      if (reducedMotion) {
        clearAppendTimer();
        pendingBlockRef.current = null;
        setBrowser({
          isFetchingLog: false,
          logBlocks: [DEMO_LOG_BLOCK],
        });
        return;
      }

      if (stage.type === "idle") {
        // Only clear before the first append; never rewind after a log is shown.
        clearAppendTimer();
        pendingBlockRef.current = null;
        fetchStartedAtRef.current = null;
        setBrowser((current) =>
          current.logBlocks.length > 0
            ? { ...current, isFetchingLog: false }
            : INITIAL_STATE,
        );
        return;
      }

      if (stage.type === "log_fetching") {
        clearAppendTimer();
        pendingBlockRef.current = null;
        fetchStartedAtRef.current = performance.now();
        setBrowser((current) => ({ ...current, isFetchingLog: true }));
        return;
      }

      if (stage.type === "log_appended") {
        const startedAt = fetchStartedAtRef.current;
        const elapsed =
          startedAt === null ? FETCH_HOLD_MS : performance.now() - startedAt;
        const wait = Math.max(0, FETCH_HOLD_MS - elapsed);
        clearAppendTimer();
        pendingBlockRef.current = stage.block;

        if (wait === 0) {
          appendLog(stage.block);
          return;
        }

        setBrowser((current) => ({ ...current, isFetchingLog: true }));
        appendTimerRef.current = window.setTimeout(() => {
          appendLog(stage.block);
        }, wait);
        return;
      }

      // done — never cancel a pending min-hold append; flush if needed
      if (pendingBlockRef.current && appendTimerRef.current !== null) {
        return;
      }
      if (pendingBlockRef.current) {
        appendLog(pendingBlockRef.current);
        return;
      }
      setBrowser((current) => ({ ...current, isFetchingLog: false }));
    },
    [appendLog, clearAppendTimer, reducedMotion],
  );

  return (
    <div className="grid min-h-[28rem] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      {/* Browser first on small screens so Fetching/append stays in view. */}
      <LandingBrowserDemo
        className="order-1 h-full md:order-2"
        isFetchingLog={browser.isFetchingLog}
        logBlocks={browser.logBlocks}
      />
      <LandingTerminalDemo
        className="order-2 h-full md:order-1"
        onStage={handleStage}
      />
    </div>
  );
}
