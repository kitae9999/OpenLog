"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import { usePrefersReducedMotion } from "@/shared/lib/usePrefersReducedMotion";
import {
  getEventHoldMs,
  getPreviewReplaySnapshot,
  getPreviewStageStartEventIndex,
  PREVIEW_DEMO_EVENTS,
  PREVIEW_REPLAY_FINAL_EVENT_INDEX,
  type PreviewDemoPlaybackState,
  type PreviewReplaySnapshot,
  type PreviewStageId,
} from "./previewSessionReplay";

export type PreviewSessionReplayControls = {
  snapshot: PreviewReplaySnapshot;
  eventIndex: number;
  eventCount: number;
  stepIndex: number;
  stepCount: number;
  isPlaying: boolean;
  isComplete: boolean;
  reducedMotion: boolean;
  play: () => void;
  pause: () => void;
  seekToStage: (stageId: PreviewStageId) => void;
};

/**
 * Guest preview — terminal (claude) + browser (openlog.kr) live demo.
 * Loops forever unless reduced-motion is on (then holds the final frame).
 */
export function usePreviewSessionReplay(
  enabled: boolean,
  rootRef?: RefObject<HTMLElement | null>,
): PreviewSessionReplayControls {
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(!rootRef);
  const [eventIndex, setEventIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled || !rootRef?.current) {
      setInView(true);
      return;
    }

    const node = rootRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  useEffect(() => {
    if (!enabled || !mounted || !inView || hasStarted) {
      return;
    }

    if (reducedMotion) {
      setEventIndex(PREVIEW_REPLAY_FINAL_EVENT_INDEX);
      setTypedChars(Number.POSITIVE_INFINITY);
      setIsPlaying(false);
      setHasStarted(true);
      return;
    }

    setEventIndex(0);
    setTypedChars(0);
    setIsPlaying(true);
    setHasStarted(true);
  }, [enabled, mounted, inView, hasStarted, reducedMotion]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setIsPlaying(false);
      } else if (hasStarted && !reducedMotion) {
        setIsPlaying(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, hasStarted, reducedMotion]);

  const currentEvent = PREVIEW_DEMO_EVENTS[eventIndex];
  const isTypingEvent =
    currentEvent?.type === "type_shell" ||
    currentEvent?.type === "type_prompt";

  useEffect(() => {
    if (
      !enabled ||
      !hasStarted ||
      !isPlaying ||
      reducedMotion ||
      !currentEvent ||
      !isTypingEvent
    ) {
      return;
    }

    const text =
      currentEvent.type === "type_shell" || currentEvent.type === "type_prompt"
        ? currentEvent.text
        : "";

    if (typedChars >= text.length) {
      const timer = window.setTimeout(() => {
        setEventIndex((current) =>
          Math.min(current + 1, PREVIEW_REPLAY_FINAL_EVENT_INDEX),
        );
        setTypedChars(0);
      }, 550);
      return () => window.clearTimeout(timer);
    }

    const msPerChar =
      currentEvent.type === "type_shell" || currentEvent.type === "type_prompt"
        ? currentEvent.msPerChar
        : 40;

    const timer = window.setTimeout(() => {
      setTypedChars((count) => count + 1);
    }, msPerChar);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    hasStarted,
    isPlaying,
    reducedMotion,
    currentEvent,
    isTypingEvent,
    typedChars,
    eventIndex,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !hasStarted ||
      !isPlaying ||
      reducedMotion ||
      !currentEvent ||
      isTypingEvent
    ) {
      return;
    }

    const holdMs = getEventHoldMs(eventIndex);
    const delay = Math.max(holdMs, 400);

    const timer = window.setTimeout(() => {
      setEventIndex((current) => {
        if (current >= PREVIEW_REPLAY_FINAL_EVENT_INDEX) {
          setTypedChars(0);
          return 0;
        }
        return current + 1;
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    hasStarted,
    isPlaying,
    reducedMotion,
    currentEvent,
    isTypingEvent,
    eventIndex,
  ]);

  const playback: PreviewDemoPlaybackState = useMemo(
    () => ({
      eventIndex,
      typedChars: isTypingEvent ? typedChars : Number.POSITIVE_INFINITY,
    }),
    [eventIndex, typedChars, isTypingEvent],
  );

  const snapshot = useMemo(
    () => getPreviewReplaySnapshot(playback),
    [playback],
  );

  const play = useCallback(() => {
    if (reducedMotion) {
      return;
    }
    setHasStarted(true);
    setIsPlaying(true);
  }, [reducedMotion]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const seekToStage = useCallback(
    (stageId: PreviewStageId) => {
      const nextIndex = getPreviewStageStartEventIndex(stageId);
      setHasStarted(true);
      setEventIndex(nextIndex);
      setTypedChars(0);
      setIsPlaying(!reducedMotion);
    },
    [reducedMotion],
  );

  return {
    snapshot,
    eventIndex,
    eventCount: PREVIEW_DEMO_EVENTS.length,
    stepIndex: eventIndex,
    stepCount: PREVIEW_DEMO_EVENTS.length,
    isPlaying,
    isComplete: false,
    reducedMotion,
    play,
    pause,
    seekToStage,
  };
}
