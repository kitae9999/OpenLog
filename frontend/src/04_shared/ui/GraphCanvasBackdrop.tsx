"use client";

import { useId } from "react";

const MINOR_SIZE = 12;
const MAJOR_SIZE = 48;
const SURFACE = "#fcfcfc";
const MINOR_STROKE = "#ececef";
const MAJOR_STROKE = "#e4e4e7";

/** Draw inside the pan/zoom `<g>` so the grid scales with the graph. */
export function GraphCanvasBackdrop({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const reactId = useId().replace(/:/g, "");
  const minorId = `openlog-graph-grid-minor-${reactId}`;
  const majorId = `openlog-graph-grid-major-${reactId}`;
  const padX = width * 2;
  const padY = height * 2;
  const area = {
    x: -padX,
    y: -padY,
    width: width + padX * 2,
    height: height + padY * 2,
  };

  return (
    <g aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern
          id={minorId}
          width={MINOR_SIZE}
          height={MINOR_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${MINOR_SIZE} 0H0V${MINOR_SIZE}`}
            fill="none"
            stroke={MINOR_STROKE}
            strokeWidth="0.75"
          />
        </pattern>
        <pattern
          id={majorId}
          width={MAJOR_SIZE}
          height={MAJOR_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${MAJOR_SIZE} 0H0V${MAJOR_SIZE}`}
            fill="none"
            stroke={MAJOR_STROKE}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect {...area} fill={SURFACE} />
      <rect {...area} fill={`url(#${minorId})`} />
      <rect {...area} fill={`url(#${majorId})`} opacity="0.9" />
    </g>
  );
}

/** Fallback fill behind the SVG (letterbox / empty state). */
export const graphCanvasSurfaceClassName = "bg-[#fcfcfc]";
