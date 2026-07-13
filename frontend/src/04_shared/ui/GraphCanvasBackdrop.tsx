"use client";

import { useId } from "react";

const MINOR_SIZE = 12;
const MAJOR_SIZE = 48;
const SURFACE = "#fcfcfc";
const MINOR_STROKE = "#ececef";
const MAJOR_STROKE = "#e4e4e7";
/** Extra world padding around the base canvas, as a multiple of width/height. */
export const GRAPH_BACKDROP_PAD_FACTOR = 2;

export function getGraphBackdropBounds(width: number, height: number) {
  const padX = width * GRAPH_BACKDROP_PAD_FACTOR;
  const padY = height * GRAPH_BACKDROP_PAD_FACTOR;
  return {
    minX: -padX,
    minY: -padY,
    maxX: width + padX,
    maxY: height + padY,
  };
}

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
  const bounds = getGraphBackdropBounds(width, height);
  const area = {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
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
