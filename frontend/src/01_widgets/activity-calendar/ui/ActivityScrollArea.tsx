"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ActivityScrollArea({
  fromDate,
  toDate,
  children,
}: {
  fromDate: string;
  toDate: string;
  children: ReactNode;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.scrollLeft =
      scrollContainer.scrollWidth - scrollContainer.clientWidth;
  }, [fromDate, toDate]);

  return (
    <div
      ref={scrollContainerRef}
      data-activity-scroll
      className="openlog-scroll min-w-0 flex-1 overflow-x-auto overflow-y-visible pb-8 pt-14"
    >
      {children}
    </div>
  );
}
