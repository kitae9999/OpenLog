"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "openlog.sidebar.desktopOpen";
const LG_QUERY = "(min-width: 1024px)";

/** Survives shell remounts during client navigations. */
let desktopOpenMemory: boolean | null = null;
let mobileOpenMemory = false;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

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

function getSnapshot(): boolean {
  return isLgViewport() ? readDesktopOpen() : mobileOpenMemory;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  const query = window.matchMedia(LG_QUERY);
  const onViewportChange = () => {
    if (!query.matches) {
      mobileOpenMemory = false;
    }
    emitChange();
  };
  query.addEventListener("change", onViewportChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    desktopOpenMemory = null;
    emitChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onStoreChange);
    query.removeEventListener("change", onViewportChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Sidebar open state that keeps the user's choice across page navigations.
 * Desktop preference is persisted; mobile overlay stays ephemeral.
 */
export function useSidebarOpenState() {
  const isSidebarOpen = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

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
      const prev = getSnapshot();
      const value = typeof next === "function" ? next(prev) : next;
      if (isLgViewport()) {
        writeDesktopOpen(value);
      } else {
        mobileOpenMemory = value;
      }
      emitChange();
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
