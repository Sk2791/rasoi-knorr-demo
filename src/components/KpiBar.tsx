import React from "react";

interface KpiBarProps {
  kpiValues: string[];
  kpiLabels: string[];
  subLabels?: string[];
}

export const KpiBar: React.FC<KpiBarProps> = ({
  kpiValues,
  kpiLabels,
  subLabels = [
    "Turnaround vs 6-week agency",
    "Tailored WiMI taste clusters",
    "Visual twin ad assets rendered",
    "Mandatory FSSAI claim check",
    "Compute cost vs ₹12L studio",
    "Incremental seasonal growth",
  ],
}) => {
  return (
    <div id="kpis-bar-container" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-7">
      {kpiValues.map((val, i) => (
        <div
          key={i}
          id={`kpi-card-${i}`}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-slate-700 hover:bg-slate-900/80 transition-all"
        >
          <div>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mb-1.5">
              {kpiLabels[i]}
            </span>
            <b className="block text-2xl font-extrabold text-orange-400 tracking-tight leading-none">
              {val || "—"}
            </b>
          </div>
          <span className="text-[10.5px] text-slate-500 leading-snug block mt-2.5 font-medium">
            {subLabels[i] || ""}
          </span>
        </div>
      ))}
    </div>
  );
};
