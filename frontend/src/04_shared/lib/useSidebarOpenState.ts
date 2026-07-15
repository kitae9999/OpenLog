"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "openlog.sidebar.desktopOpen";
const LG_QUERY = "(min-width: 1024px)";

/** Survives shell remounts during client navigations. */
let desktopOpenMemory: boolean | null = null;
let mobileOpenMemory = false;

function isLgViewport() {
  return window.matchMedia(LG_QUERY).matches;
}

function readDesktopOpen(): boolean {
  if (desktopOpenMemory != null) {
    return desktopOpenMemory;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      desktopOpenMemory = true;
      return true;
    }
    if (stored === "false") {
      desktopOpenMemory = false;
      return false;
    }
  } catch {
    // ignore quota / private mode
  }

  // Desktop default: open
  desktopOpenMemory = true;
  return true;
}

function writeDesktopOpen(open: boolean) {
  desktopOpenMemory = open;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    // ignore quota / private mode
  }
}

function readCurrentOpen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return isLgViewport() ? readDesktopOpen() : mobileOpenMemory;
}

/**
 * Sidebar open state that keeps the user's choice across page navigations.
 * Desktop preference is persisted; mobile overlay stays ephemeral.
 */
export function useSidebarOpenState() {
  const [isSidebarOpen, setIsSidebarOpenState] = useState(readCurrentOpen);

  useEffect(() => {
    // Align after SSR hydrate without forcing open on every remount.
    setIsSidebarOpenState(readCurrentOpen());

    const query = window.matchMedia(LG_QUERY);
    const onViewportChange = () => {
      if (query.matches) {
        setIsSidebarOpenState(readDesktopOpen());
      } else {
        mobileOpenMemory = false;
        setIsSidebarOpenState(false);
      }
    };

    query.addEventListener("change", onViewportChange);
    return () => query.removeEventListener("change", onViewportChange);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen || isLgViewport()) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehaviorY = document.body.style.overscrollBehaviorY;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorY = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehaviorY = previousOverscrollBehaviorY;
    };
  }, [isSidebarOpen]);

  const setIsSidebarOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setIsSidebarOpenState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (isLgViewport()) {
          writeDesktopOpen(value);
        } else {
          mobileOpenMemory = value;
        }
        return value;
      });
    },
    [],
  );

  const closeSidebarIfMobile = useCallback(() => {
    if (!isLgViewport()) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);

  return { isSidebarOpen, setIsSidebarOpen, closeSidebarIfMobile };
}
