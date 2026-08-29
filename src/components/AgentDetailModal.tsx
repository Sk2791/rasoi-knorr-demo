import React from "react";
import { X, Database, Cpu, FileCheck } from "lucide-react";
import { AgentInfo } from "../types";

interface AgentDetailModalProps {
  agent: AgentInfo | null;
  onClose: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
}) => {
  if (!agent) return null;

  const details = agent.details || {
    role: agent.d,
    dataSources: ["Internal HUL Data Mesh"],
    reasoning: "Executes LangGraph decision chain node.",
    outputArtifact: "Standard agent payload.",
  };

  return (
    <div
      id="agent-detail-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="agent-detail-modal-box"
        className="max-w-lg w-full border border-slate-800 rounded-3xl bg-slate-900 p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center text-xs font-extrabold font-mono">
              {agent.id}
            </span>
            <div>
              <h3 className="text-sm text-orange-400 font-bold tracking-wider uppercase">
                AGENT {agent.n}
              </h3>
              <div className="text-[10px] text-slate-400">{details.role}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="border border-slate-800 rounded-2xl p-3.5 bg-slate-800/40">
            <h5 className="text-[9.5px] font-mono text-orange-400 uppercase font-bold mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-orange-400" />
              Data Sources & Ingestion
            </h5>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
              {details.dataSources.map((ds, idx) => (
                <li key={idx}>{ds}</li>
              ))}
            </ul>
          </div>

          <div className="border border-slate-800 rounded-2xl p-3.5 bg-slate-800/40">
            <h5 className="text-[9.5px] font-mono text-orange-400 uppercase font-bold mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              Agent Reasoning & Logic
            </h5>
            <p className="text-slate-300 leading-relaxed text-[11px]">{details.reasoning}</p>
          </div>

          <div className="border border-slate-800 rounded-2xl p-3.5 bg-slate-800/40">
            <h5 className="text-[9.5px] font-mono text-orange-400 uppercase font-bold mb-1 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-orange-400" />
              Output Artifact
            </h5>
            <p className="text-slate-300 leading-relaxed text-[11px]">{details.outputArtifact}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn text-xs font-bold tracking-wider w-full py-2.5 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 uppercase cursor-pointer"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
};
