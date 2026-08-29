import React from "react";
import { Trigger, FlaggedClaim } from "../types";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Flame, Radio, Database } from "lucide-react";

interface BigTriggerCardProps {
  activeTrigger: Trigger;
  isRunning: boolean;
  isCompleted: boolean;
  isGateActive: boolean;
  onApproveAndGenerate: () => void;
  onContinueToSummary: () => void;
  onOpenGateModal: () => void;
  simProgressStep: number; // 0 = idle, 1 = signals, 2 = taste, 3 = bhasha, 4 = maker, 5 = sentinel gate
  flaggedClaim?: FlaggedClaim | null;
  liveModeStatus?: "live" | "fallback" | null;
  providerLabel?: string | null;
}

export const BigTriggerCard: React.FC<BigTriggerCardProps> = ({
  activeTrigger,
  isRunning,
  isCompleted,
  isGateActive,
  onApproveAndGenerate,
  onContinueToSummary,
  onOpenGateModal,
  simProgressStep,
  flaggedClaim,
  liveModeStatus,
  providerLabel,
}) => {
  const headline = activeTrigger.headlineInsight || activeTrigger.opp || "Cold wave in North India — soup demand up 310% in 3 hours. Recommend act now.";
  const recommendation = activeTrigger.recommendation || "Approve & launch regional campaign versions to capture demand peak across quick-commerce dark stores and kirana outlets.";

  return (
    <div
      id="big-trigger-detected-card"
      className="border border-orange-500/40 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 md:p-8 shadow-2xl relative overflow-hidden mb-6 backdrop-blur-xl"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg shadow-orange-500/20 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            <Flame className="w-3.5 h-3.5" />
            Trigger Detected
          </div>

          <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            {activeTrigger.meta}
          </span>
        </div>
      </div>

      {/* Main Plain-English Insight Headline */}
      <div className="mb-4 relative z-10">
        <h2
          id="trigger-headline-insight"
          className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight"
        >
          {headline}
        </h2>
        <p className="text-sm md:text-base text-slate-300 mt-2.5 leading-relaxed max-w-4xl font-normal">
          {recommendation}
        </p>
      </div>

      {/* Primary Action Button & Live Progress Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 border-t border-slate-800/80 relative z-10">
        {!isRunning && !isCompleted && !isGateActive && (
          <button
            id="approve-generate-14-btn"
            onClick={onApproveAndGenerate}
            className="flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm md:text-base tracking-wide uppercase flex items-center justify-center gap-2.5 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] group shadow-xl"
          >
            <Sparkles className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
            <span>Approve & generate regional versions</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {isRunning && (
          <div className="flex-1 bg-orange-500/10 border border-orange-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-orange-400 animate-spin flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Generating Regional Campaign Versions...
                </div>
                <div className="text-[11px] text-orange-300">
                  {simProgressStep === 1 && "Reading live weather, search & quick-commerce signals"}
                  {simProgressStep === 2 && "Adapting recipe taste profiles for the affected regions"}
                  {simProgressStep === 3 && "Writing vernacular ad copy in local languages"}
                  {simProgressStep === 4 && "Rendering campaign creative & checking FSSAI compliance"}
                </div>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-orange-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {simProgressStep}/4 Complete
            </div>
          </div>
        )}

        {isGateActive && (
          <div className="flex-1 bg-amber-500/15 border border-amber-500/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Action Needed: {flaggedClaim?.city || "Regional"} Ad Held for Claim Review
                </div>
                <div className="text-[11px] text-amber-200">
                  Other regional versions cleared. 1 ad requires your brand manager sign-off on FSSAI rules
                  {flaggedClaim?.claimQuoted ? ` ("${flaggedClaim.claimQuoted}")` : ""}.
                </div>
              </div>
            </div>
            <button
              onClick={onOpenGateModal}
              className="py-2 px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all cursor-pointer shrink-0 shadow-md"
            >
              Review {flaggedClaim?.city || "Flagged"} Claim →
            </button>
          </div>
        )}

        {isCompleted && !isGateActive && (
          <div className="flex-1 bg-green-500/15 border border-green-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-green-500/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  All Regional Campaigns Live & Approved!
                  {liveModeStatus === "live" && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full normal-case">
                      <Radio className="w-2.5 h-2.5" /> Live · {providerLabel || "Gemini"}
                    </span>
                  )}
                  {liveModeStatus === "fallback" && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full normal-case">
                      <Database className="w-2.5 h-2.5" /> Cached Baseline
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-green-200">
                  Review the banners below — tweak any one before moving on, or continue to the results summary.
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onApproveAndGenerate}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Re-run Simulation
              </button>
              <button
                onClick={onContinueToSummary}
                className="py-2 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-xs uppercase rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
              >
                Continue to Summary
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
