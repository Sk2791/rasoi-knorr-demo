import React from "react";
import { RotateCcw, Code2, LayoutDashboard, Sparkles } from "lucide-react";

interface HeaderProps {
  elapsedTime: string;
  isRunning: boolean;
  isTechnicalView: boolean;
  onToggleTechnicalView: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  elapsedTime,
  isRunning,
  isTechnicalView,
  onToggleTechnicalView,
  onReset,
}) => {
  return (
    <header id="hul-header-container" className="mb-6">
      {/* Slim Brand Attribution Line */}
      <div id="hul-branding-bar" className="flex items-center gap-2.5 mb-3 px-1 text-[10px] tracking-[0.15em] text-slate-500">
        <span className="font-bold">HINDUSTAN UNILEVER</span>
        <span className="text-slate-700">·</span>
        <span>PROJECT NEXT</span>
        <span className="text-slate-700">·</span>
        <span className="text-orange-400/80 font-semibold">KNORR</span>
      </div>

      {/* Main Console Header Bar */}
      <div id="main-top-console-bar" className="flex items-center gap-5 p-4 sm:p-5 border border-slate-800/70 rounded-3xl bg-slate-900/50 backdrop-blur-md flex-wrap shadow-lg shadow-black/10">
        <div id="rasoi-logo-container" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/30 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">
              KNORR <span className="text-orange-400 font-light">Demand Engine</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1">
              Regional campaign launcher · 14 taste clusters
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div id="status-pill-live" className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2 rounded-full border border-slate-800/80 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">Live · Ready</span>
        </div>

        {/* Clock */}
        <div id="elapsed-timer-clock" className="ml-auto text-right font-mono">
          <b className="text-xl md:text-2xl text-orange-400 tracking-wider leading-none block font-extrabold">{elapsedTime}</b>
          <span className="block text-[9px] text-slate-500 tracking-[0.15em] uppercase mt-0.5">Trigger Age</span>
        </div>

        {/* Action Controls & Technical Toggle */}
        <div id="action-buttons-group" className="flex items-center gap-2 flex-wrap">
          <button
            id="toggle-technical-detail-btn"
            onClick={onToggleTechnicalView}
            className={`font-semibold text-xs px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isTechnicalView
                ? "bg-amber-500/15 border-amber-500/60 text-amber-300 hover:bg-amber-500/25"
                : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            {isTechnicalView ? (
              <>
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                Back to Dashboard
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5 text-orange-400" />
                Technical View
              </>
            )}
          </button>

          <button
            id="reset-simulation-btn"
            onClick={onReset}
            disabled={isRunning}
            className="font-semibold text-xs px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
