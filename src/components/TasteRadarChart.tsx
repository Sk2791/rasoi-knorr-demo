import React from "react";
import { Cluster } from "../types";
import { AXES } from "../data/mockData";

interface TasteRadarChartProps {
  cluster: Cluster | null;
  className?: string;
}

export const TasteRadarChart: React.FC<TasteRadarChartProps> = ({ cluster, className = "w-[118px] h-[110px]" }) => {
  const cx = 55, cy = 55, R = 40, N = 6;
  const vals = cluster ? cluster.t : null;
  // A cluster's regional taste profile is never itself "flagged" — a claim
  // held for compliance review belongs to a specific run's ad copy, not to
  // the cuisine data, so this always renders in the standard brand color.
  const color = "#22c55e";

  const gridPolygons = [0.33, 0.66, 1].map((f, gIdx) => {
    const pts: string[] = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      pts.push(`${(cx + Math.cos(a) * R * f).toFixed(1)},${(cy + Math.sin(a) * R * f).toFixed(1)}`);
    }
    return (
      <polygon
        key={gIdx}
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(148, 163, 184, 0.2)"
        strokeWidth="0.6"
      />
    );
  });

  const labels = AXES.map((axis, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return (
      <text
        key={i}
        x={(cx + Math.cos(a) * (R + 9)).toFixed(1)}
        y={(cy + Math.sin(a) * (R + 9) + 2).toFixed(1)}
        fontSize="5.2"
        fill="#94a3b8"
        textAnchor="middle"
        fontFamily="Inter,Arial"
      >
        {axis}
      </text>
    );
  });

  const basePts: string[] = [];
  const polyPts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    basePts.push(`${(cx + Math.cos(a) * R * 0.5).toFixed(1)},${(cy + Math.sin(a) * R * 0.5).toFixed(1)}`);
    const v = (vals ? vals[i] : 50) / 100;
    polyPts.push(`${(cx + Math.cos(a) * R * v).toFixed(1)},${(cy + Math.sin(a) * R * v).toFixed(1)}`);
  }

  return (
    <svg viewBox="0 0 110 110" className={className}>
      {gridPolygons}
      {labels}
      <polygon
        points={basePts.join(" ")}
        fill="none"
        stroke="#64748b"
        strokeWidth="0.8"
        strokeDasharray="2,2"
      />
      {vals && (
        <polygon
          points={polyPts.join(" ")}
          fill={color}
          fillOpacity="0.28"
          stroke={color}
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
};
