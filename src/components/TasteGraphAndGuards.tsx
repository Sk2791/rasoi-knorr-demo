import React from "react";
import { Cluster, GuardrailItem } from "../types";
import { AlertTriangle } from "lucide-react";
import { TasteRadarChart } from "./TasteRadarChart";

interface TasteGraphAndGuardsProps {
  clusters: Cluster[];
  selectedClusterIndex: number | null;
  clusterStates: Record<number, "on" | "hold">;
  verdictText: string;
  guardrails: GuardrailItem[];
  isGateActive: boolean;
  gateMessage: string;
  onSelectCluster: (index: number) => void;
  onApproveGate: () => void;
  onHoldGate: () => void;
  onOpenClaimModal: () => void;
}

export const TasteGraphAndGuards: React.FC<TasteGraphAndGuardsProps> = ({
  clusters,
  selectedClusterIndex,
  clusterStates,
  verdictText,
  guardrails,
  isGateActive,
  gateMessage,
  onSelectCluster,
  onApproveGate,
  onHoldGate,
  onOpenClaimModal,
}) => {
  const selectedCluster = selectedClusterIndex !== null ? clusters[selectedClusterIndex] : null;

  return (
    <div id="taste-graph-guards-panel" className="panel bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col justify-between shadow-xl col-span-1 lg:col-span-4 h-full w-full overflow-hidden">
      <div>
        <div id="swaad-panel-header" className="ph flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            SWAAD taste graph
          </div>
          <em className="not-italic text-[10px] text-slate-500 font-mono">click a cluster</em>
        </div>

        {/* Cluster Grid */}
        <div id="clusters-grid" className="cgrid grid grid-cols-7 gap-1 mt-0.5">
          {clusters.map((c, i) => {
            const st = clusterStates[i];
            const isSel = selectedClusterIndex === i;

            let clClass = "border-slate-800 bg-slate-800/40";
            let bClass = "text-slate-500";
            let spanClass = "text-transparent";

            if (st === "on") {
              clClass = "border-green-500/40 bg-green-500/10";
              bClass = "text-green-400";
              spanClass = "text-slate-400";
            } else if (st === "hold") {
              clClass = "border-orange-500/40 bg-orange-500/10";
              bClass = "text-orange-400";
              spanClass = "text-orange-400";
            }

            if (isSel) {
              clClass += " outline-2 outline-orange-500 outline-offset-1";
            }

            return (
              <div
                key={c.c}
                id={`cluster-btn-${c.c}`}
                onClick={() => onSelectCluster(i)}
                className={`cl border rounded-xl p-1.5 text-center cursor-pointer transition-all ${clClass}`}
              >
                <b className={`block text-[9.5px] font-extrabold font-mono ${bClass}`}>{c.c}</b>
                <span className={`block text-[6.5px] mt-0.5 leading-tight h-3.5 overflow-hidden ${spanClass}`}>
                  {c.lang.split("-")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Cluster Taste Box */}
        <div id="taste-box-detail" className="tastebox grid grid-cols-[118px_1fr] gap-2.5 mt-3 border border-slate-800 rounded-2xl p-2.5 bg-slate-800/40">
          <TasteRadarChart cluster={selectedCluster} />
          <div>
            <h6 id="cluster-taste-name" className="text-[10px] font-extrabold text-orange-400 mb-1">
              {selectedCluster ? `${selectedCluster.n} · ${selectedCluster.c}` : "Select a cluster"}
            </h6>
            <p id="cluster-taste-desc" className="text-[8px] text-slate-300 leading-snug">
              {selectedCluster
                ? selectedCluster.note
                : "SWAAD resolves one occasion into fourteen regional taste profiles. Run the simulation, then click any cluster to see what it actually asks for."}
            </p>
            <div id="cluster-taste-lang" className="lang font-mono text-[7.5px] text-slate-500 mt-1.5">
              {selectedCluster ? `${selectedCluster.lang}   ·   dashed = national baseline` : ""}
            </div>
          </div>
        </div>

        {/* Verdict Banner */}
        <div
          id="verdict-banner"
          className={`verdict mt-2.5 border border-green-500/30 bg-green-500/10 rounded-2xl p-2.5 text-[9.5px] text-green-400 transition-opacity duration-400 leading-snug ${
            verdictText ? "opacity-100" : "opacity-0"
          }`}
        >
          {verdictText}
        </div>

        {/* SENTINEL Guardrails Header */}
        <div id="sentinel-guards-header" className="ph flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mt-3.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            SENTINEL guardrails
          </div>
          <em className="not-italic text-[10px] text-slate-500 font-mono">policy-as-code</em>
        </div>

        {/* Guardrails List */}
        <div id="guards-list-container" className="flex flex-col gap-1.5">
          {guardrails.map((g, idx) => {
            const isFlag = g.status === "flag";
            return (
              <div
                key={idx}
                id={`guard-item-${idx}`}
                onClick={isFlag ? onOpenClaimModal : undefined}
                className={`gr flex items-center gap-2 text-[9.5px] p-2 rounded-xl bg-slate-800/40 border transition-colors ${
                  isFlag
                    ? "border-orange-500/50 bg-orange-500/10 cursor-pointer hover:bg-orange-500/20"
                    : "border-slate-800"
                }`}
              >
                <div
                  className={`tick w-4 h-4 rounded-lg flex items-center justify-center text-[9px] font-extrabold ${
                    isFlag ? "bg-orange-500 text-slate-950 font-bold" : "bg-green-500 text-slate-950 font-bold"
                  }`}
                >
                  {isFlag ? "!" : "✓"}
                </div>
                <div className="text-slate-200 font-medium">{g.label}</div>
                <small className="ml-auto font-mono text-[8px] text-slate-400">{g.note}</small>
              </div>
            );
          })}
        </div>
      </div>

      {/* Human Decision Gate */}
      <div
        id="human-decision-gate"
        className={`gate border border-dashed rounded-2xl p-3 mt-3.5 transition-all duration-400 ${
          isGateActive
            ? "border-orange-500/80 bg-orange-500/10 opacity-100 shadow-[0_0_26px_rgba(249,115,22,0.15)] pointer-events-auto"
            : "border-slate-800 bg-slate-900/40 opacity-30 pointer-events-none"
        }`}
      >
        <h4 id="gate-title" className="text-[9.5px] tracking-[0.15em] text-orange-400 uppercase font-bold mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Human decision gate · Brand + Regulatory
        </h4>
        <p id="gate-text" className="text-[9.5px] text-slate-300 leading-snug mb-2">
          {gateMessage ||
            "57 of 62 assets clear. Five carry a protein and immunity claim that RASOI is not permitted to publish — every nutrition and health claim is L4: human-approved, always."}
        </p>
        <button
          type="button"
          onClick={onOpenClaimModal}
          className="why text-[8.6px] text-orange-400 underline cursor-pointer mb-2 inline-block hover:text-white"
        >
          Why can't RASOI publish this? →
        </button>
        <div className="row flex gap-2">
          <button
            type="button"
            onClick={onApproveGate}
            className="btn flex-1 py-2 text-[10px] font-extrabold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:bg-orange-400 transition-all uppercase cursor-pointer"
          >
            ✓ Approve cleared set
          </button>
          <button
            type="button"
            onClick={onHoldGate}
            className="btn no flex-1 py-2 text-[10px] font-extrabold rounded-xl bg-slate-800/80 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all uppercase cursor-pointer"
          >
            ✕ Hold all
          </button>
        </div>
      </div>
    </div>
  );
};
