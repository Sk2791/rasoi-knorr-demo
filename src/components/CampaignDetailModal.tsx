import React, { useState } from "react";
import { X, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { Asset, TriggerRecord } from "../types";
import { deriveEventTheme } from "../lib/theme";
import { AssetGrid } from "./AssetGrid";

interface CampaignDetailModalProps {
  trigger: TriggerRecord | null;
  onClose: () => void;
  onTriggerUpdated?: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ trigger, onClose, onTriggerUpdated }) => {
  const [assets, setAssets] = useState<Asset[]>(trigger?.runResult?.assets || []);

  if (!trigger) return null;

  const eventTheme = deriveEventTheme(`${trigger.name} ${trigger.blurb}`);
  const canEdit = trigger.status === "approved" && !!trigger.runResult;

  const handleAssetsChange = async (updated: Asset[]) => {
    setAssets(updated);
    if (!trigger.runResult) return;
    try {
      await fetch(`/api/triggers/${trigger.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runResult: { ...trigger.runResult, assets: updated } }),
      });
      onTriggerUpdated?.();
    } catch (err) {
      console.warn("Failed to save regenerated banner", err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 rounded-3xl bg-slate-900 p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2.5">
            {trigger.status === "approved" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
            )}
            <div>
              <h3 className="text-base font-extrabold text-white">{trigger.name}</h3>
              <p className="text-[11px] text-slate-400">{trigger.meta}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {trigger.status === "approved" && trigger.expectedBenefit && (
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              {trigger.expectedBenefit.salesLift} sales lift
            </span>
            <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              {trigger.expectedBenefit.turnaround} turnaround
            </span>
            <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              {trigger.expectedBenefit.regionsLaunched} regions launched
            </span>
          </div>
        )}

        {trigger.status === "cancelled" && (
          <div className="mt-3 text-xs text-slate-400 bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            This trigger was cancelled before any campaign assets went live.
          </div>
        )}

        {assets.length > 0 ? (
          <AssetGrid
            assets={assets}
            showAssets
            eventTheme={eventTheme}
            editable={canEdit}
            eventContext={`${trigger.name} — ${trigger.blurb}`}
            onAssetsChange={handleAssetsChange}
          />
        ) : (
          <div className="mt-6 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
            No campaign assets were generated for this trigger.
          </div>
        )}
      </div>
    </div>
  );
};
