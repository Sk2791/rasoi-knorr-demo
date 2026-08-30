import React from "react";
import { CheckCircle2, ShieldCheck, TrendingUp, MapPin, ShoppingCart, Clock, ArrowLeft, Gauge } from "lucide-react";
import { TriggerRecord } from "../types";

const LINK_DIMENSIONS: Array<{ key: "branding" | "communication" | "culturalResonance" | "cutThrough" | "persuasion"; label: string }> = [
  { key: "branding", label: "Branding" },
  { key: "communication", label: "Communication" },
  { key: "culturalResonance", label: "Cultural Resonance" },
  { key: "cutThrough", label: "Cut-Through" },
  { key: "persuasion", label: "Persuasion" },
];

const scoreColor = (n: number) => (n >= 70 ? "text-emerald-400" : n >= 45 ? "text-amber-400" : "text-red-400");
const barColor = (n: number) => (n >= 70 ? "bg-emerald-500" : n >= 45 ? "bg-amber-500" : "bg-red-500");

interface RunSummaryScreenProps {
  trigger: TriggerRecord;
  onBackToHome: () => void;
}

export const RunSummaryScreen: React.FC<RunSummaryScreenProps> = ({ trigger, onBackToHome }) => {
  const benefit = trigger.expectedBenefit;
  // A run finishing means the Brand Manager cleared it — but it isn't fully
  // live until a Regional Marketing Lead signs off, so say so honestly here.
  const awaitingSignOff = trigger.status === "pending_regional_approval";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              awaitingSignOff
                ? "bg-amber-500/15 border border-amber-500/40 text-amber-400"
                : "bg-green-500/15 border border-green-500/40 text-green-400"
            }`}
          >
            {awaitingSignOff ? <ShieldCheck className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {awaitingSignOff ? `${trigger.name} awaiting regional sign-off` : `${trigger.name} is live`}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            {awaitingSignOff
              ? "A Regional Marketing Lead needs to sign this off from the Home dashboard before it goes fully live."
              : "Here's the expected benefit from this campaign launch."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              Predicted Sales Lift
            </div>
            <b className="text-2xl font-extrabold text-orange-400">{benefit?.salesLift || "—"}</b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Turnaround
            </div>
            <b className="text-2xl font-extrabold text-emerald-400">{benefit?.turnaround || "—"}</b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Regions Launched
            </div>
            <b className="text-2xl font-extrabold text-white">{benefit?.regionsLaunched ?? "—"}</b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              Simulated Order Lift
            </div>
            <b className="text-2xl font-extrabold text-amber-400">
              {benefit?.simulatedOrders ? benefit.simulatedOrders.toLocaleString("en-IN") : "—"}
            </b>
          </div>
        </div>

        {trigger.runResult?.verdict && (
          <div className="bg-slate-900/40 border border-green-500/20 rounded-2xl p-4 mb-6 text-sm text-green-300 leading-relaxed">
            {trigger.runResult.verdict}
          </div>
        )}

        {trigger.runResult?.linkScore && (
          <div className="bg-slate-900/60 border border-sky-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 uppercase tracking-wider">
                <Gauge className="w-3.5 h-3.5" />
                Link-Inspired Ad Effectiveness Score
              </div>
              <div className={`text-lg font-extrabold ${scoreColor(trigger.runResult.linkScore.overallPercentile)}`}>
                {trigger.runResult.linkScore.overallPercentile}
                <span className="text-xs text-slate-500 font-semibold">/100</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">
              AI-simulated approximation of the dimensions industry ad pre-testing frameworks (e.g. Kantar Link) measure via live consumer panels — this is a directional estimate, not real panel data.
            </p>
            <div className="space-y-2 mb-3">
              {LINK_DIMENSIONS.map((d) => {
                const val = trigger.runResult!.linkScore![d.key];
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400 font-medium">{d.label}</span>
                      <span className={`font-bold ${scoreColor(val)}`}>{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(val)}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {trigger.runResult.linkScore.rationale && (
              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2.5">
                {trigger.runResult.linkScore.rationale}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onBackToHome}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home Dashboard
        </button>
      </div>
    </div>
  );
};
