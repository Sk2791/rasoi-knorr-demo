import React from "react";
import { X, Flame, MapPin, TrendingUp, Bookmark, XCircle, ArrowRight } from "lucide-react";
import { TriggerRecord } from "../types";

interface TriggerReviewModalProps {
  trigger: TriggerRecord | null;
  onClose: () => void;
  onProceed: () => void;
  onSaveForLater: () => void;
  onCancel: () => void;
}

export const TriggerReviewModal: React.FC<TriggerReviewModalProps> = ({
  trigger,
  onClose,
  onProceed,
  onSaveForLater,
  onCancel,
}) => {
  if (!trigger) return null;

  const topSignals = (trigger.signals || []).slice(0, 4);

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full border border-slate-800 rounded-3xl bg-slate-900 p-6 md:p-8 shadow-2xl my-8 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight">{trigger.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{trigger.meta}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Why this was detected */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2">
            Why this was detected
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed mb-3">{trigger.blurb}</p>
          {topSignals.length > 0 && (
            <div className="space-y-1.5">
              {topSignals.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-orange-400 font-mono font-bold shrink-0">{s.src}</span>
                  <span className="truncate">{s.t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Impacted regions */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Regions that will be impacted
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(trigger.affectedRegions || []).map((r) => (
              <span
                key={r}
                className="text-xs font-medium text-slate-200 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full"
              >
                {r}
              </span>
            ))}
            {(!trigger.affectedRegions || trigger.affectedRegions.length === 0) && (
              <span className="text-xs text-slate-500">Determined live when the pipeline runs.</span>
            )}
          </div>
        </div>

        {/* Commercial framing */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              Predicted Lift
            </div>
            <div className="text-lg font-extrabold text-orange-400">{trigger.marketLift || "—"}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Revenue Headroom
            </div>
            <div className="text-lg font-extrabold text-emerald-400">{trigger.revenueHeadroom || "—"}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onProceed}
            className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
          >
            Proceed
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSaveForLater}
            className="py-3.5 px-5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 font-bold text-xs uppercase hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Save for Later
          </button>
          <button
            onClick={onCancel}
            className="py-3.5 px-5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-xs uppercase hover:bg-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
