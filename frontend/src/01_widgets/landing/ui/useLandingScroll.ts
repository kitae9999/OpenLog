"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

export function useScrolledPast(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > threshold);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}

export function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    // Scroll-position spy (document order) — more stable than max
    // intersectionRatio when section heights change during demos.
    function update() {
      const marker = window.scrollY + window.innerHeight * 0.32;
      let next = ids[0] ?? "";

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) {
          continue;
        }
        if (el.offsetTop <= marker) {
          next = id;
        } else {
          break;
        }
      }

      setActiveId((current) => (current === next ? current : next));
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return activeId;
}

export function useRevealOnce(rootRef: { current: HTMLElement | null }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const targets = root.querySelectorAll(".landing-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
            observer.unobserve(entry.target);
          }
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}
