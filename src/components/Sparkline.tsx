// src/components/Sparkline.tsx
"use client";
import React from "react";

type Point = { ts: number; v: number };

export default function Sparkline({
  points,
  width = 120,
  height = 36,
  strokeWidth = 2,
  className = "",
  positiveColor = "currentColor",
  negativeColor = "currentColor",
}: {
  points: Point[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  positiveColor?: string;
  negativeColor?: string;
}) {
  if (!points || points.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }

  // normalize
  const xs = points.map((p) => p.ts);
  const ys = points.map((p) => p.v);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const dx = Math.max(1, maxX - minX);
  const dy = Math.max(1e-9, maxY - minY);

  const path = points
    .map((p, i) => {
      const x = ((p.ts - minX) / dx) * (width - 2) + 1;
      const y = height - (((p.v - minY) / dy) * (height - 2) + 1);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const rising = points[points.length - 1].v >= points[0].v;
  const stroke = rising ? positiveColor : negativeColor;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
