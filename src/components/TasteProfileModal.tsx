import React from "react";
import { X } from "lucide-react";
import { Cluster } from "../types";
import { AXES } from "../data/mockData";
import { TasteRadarChart } from "./TasteRadarChart";

interface TasteProfileModalProps {
  cluster: Cluster | null;
  onClose: () => void;
}

export const TasteProfileModal: React.FC<TasteProfileModalProps> = ({ cluster, onClose }) => {
  if (!cluster) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full border border-slate-800 rounded-3xl bg-slate-900 p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white">{cluster.n}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{cluster.lang}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <TasteRadarChart cluster={cluster} className="w-56 h-56" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {AXES.map((axis, i) => (
            <div key={axis} className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{axis}</div>
              <div className="text-lg font-extrabold text-emerald-400">{cluster.t[i]}</div>
            </div>
          ))}
        </div>

        {cluster.tasteSummary && (
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Taste Adaptation
            </div>
            <p className="text-sm text-slate-100 font-medium leading-snug">{cluster.tasteSummary}</p>
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Regional Notes</div>
          <p className="text-xs text-slate-400 leading-relaxed">{cluster.note}</p>
        </div>
      </div>
    </div>
  );
};
