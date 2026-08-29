import React from "react";
import { Signal } from "../types";

interface KitchenMeshProps {
  signals: Signal[];
  meshMetrics: [string, string, string];
  sparkPoints: number[];
  reachMetrics: [string, string, string, string];
}

export const KitchenMesh: React.FC<KitchenMeshProps> = ({
  signals,
  meshMetrics,
  sparkPoints,
  reachMetrics,
}) => {
  // Generate SVG sparkline path
  const step = 260 / Math.max(1, sparkPoints.length - 1);
  const pathD = sparkPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(46 - p).toFixed(1)}`)
    .join(" ");
  const fillD = pathD
    ? `${pathD} L${((sparkPoints.length - 1) * step).toFixed(1)},46 L0,46 Z`
    : "";

  return (
    <div id="kitchen-mesh-panel" className="panel bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col justify-between shadow-xl col-span-1 lg:col-span-3 h-full w-full overflow-hidden">
      <div>
        <div id="kitchen-mesh-header" className="ph flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Kitchen trigger mesh
          </div>
          <em className="not-italic text-[10px] text-slate-500 font-mono">SCOUT · 19 sources</em>
        </div>

        {/* Signals Feed Container */}
        <div id="signals-feed-container" className="feed flex flex-col gap-2 h-[206px] overflow-hidden">
          {signals.slice(0, 5).map((s, idx) => (
            <div
              key={idx}
              id={`signal-item-${idx}`}
              className={`sig border rounded-2xl p-2.5 bg-slate-800/50 transition-all duration-300 animate-slide ${
                s.hot ? "border-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.12)]" : "border-slate-800"
              }`}
            >
              <div className="r1 flex gap-2 items-center text-[9px] text-slate-400 font-mono">
                <span className="src text-orange-400 font-bold">{s.src}</span>
                <span>· v{s.v}</span>
              </div>
              <div className="tx text-[11px] my-1 leading-snug text-white font-medium">{s.t}</div>
              <div className="bar h-[3px] rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700 rounded-full"
                  style={{ width: `${s.v}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mesh Metrics */}
        <div id="mesh-metrics-grid" className="mesh grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-2 text-center">
            <b id="mesh-signals-min" className="block text-base text-orange-400 font-mono leading-tight">
              {meshMetrics[0]}
            </b>
            <span className="text-[8px] text-slate-500 tracking-wider uppercase">Signals/min</span>
          </div>
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-2 text-center">
            <b id="mesh-clusters-live" className="block text-base text-orange-400 font-mono leading-tight">
              {meshMetrics[1]}
            </b>
            <span className="text-[8px] text-slate-500 tracking-wider uppercase">Clusters live</span>
          </div>
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-2 text-center">
            <b id="mesh-sources-count" className="block text-base text-orange-400 font-mono leading-tight">
              {meshMetrics[2]}
            </b>
            <span className="text-[8px] text-slate-500 tracking-wider uppercase">Sources</span>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div id="sparkline-chart-container" className="mt-3">
          <svg id="sparkline-svg" className="spark h-[46px] w-full" viewBox="0 0 260 46" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path id="sparkline-fill" fill="url(#sg)" d={fillD} />
            <path id="sparkline-line" fill="none" stroke="#f97316" strokeWidth="1.8" d={pathD} />
          </svg>
          <div id="sparkline-label" className="text-[8px] text-slate-500 font-mono mt-0.5">
            MEAL-OCCASION DEMAND · queries/min
          </div>
        </div>
      </div>

      {/* Distribution Reach Activated */}
      <div id="distribution-reach-section" className="reach mt-3 border-t border-slate-800 pt-2.5">
        <h5 className="text-[9px] tracking-[0.15em] text-slate-400 font-bold mb-2 uppercase">
          Distribution reach activated
        </h5>
        <div className="rrow grid grid-cols-[1fr_auto] gap-2 text-[10px] text-slate-400 py-0.5 border-b border-slate-800/50">
          <span>Quick commerce pincodes</span>
          <b className="font-mono text-orange-400">{reachMetrics[0]}</b>
        </div>
        <div className="rrow grid grid-cols-[1fr_auto] gap-2 text-[10px] text-slate-400 py-0.5 border-b border-slate-800/50">
          <span>Kirana outlets in trigger clusters</span>
          <b className="font-mono text-orange-400">{reachMetrics[1]}</b>
        </div>
        <div className="rrow grid grid-cols-[1fr_auto] gap-2 text-[10px] text-slate-400 py-0.5 border-b border-slate-800/50">
          <span>Shakti entrepreneur kits queued</span>
          <b className="font-mono text-orange-400">{reachMetrics[2]}</b>
        </div>
        <div className="rrow grid grid-cols-[1fr_auto] gap-2 text-[10px] text-slate-400 py-0.5">
          <span>Recipe SEO + WhatsApp channels</span>
          <b className="font-mono text-orange-400">{reachMetrics[3]}</b>
        </div>
      </div>
    </div>
  );
};
