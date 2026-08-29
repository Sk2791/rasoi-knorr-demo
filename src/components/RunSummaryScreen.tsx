import React from "react";
import { CheckCircle2, TrendingUp, MapPin, ShoppingCart, Clock, ArrowLeft } from "lucide-react";
import { TriggerRecord } from "../types";

interface RunSummaryScreenProps {
  trigger: TriggerRecord;
  onBackToHome: () => void;
}

export const RunSummaryScreen: React.FC<RunSummaryScreenProps> = ({ trigger, onBackToHome }) => {
  const benefit = trigger.expectedBenefit;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {trigger.name} is live
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Here's the expected benefit from this campaign launch.
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
