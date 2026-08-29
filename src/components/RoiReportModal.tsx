import React from "react";
import { X, Download, Printer, PiggyBank } from "lucide-react";
import { TriggerRecord } from "../types";

interface RoiReportModalProps {
  triggers: TriggerRecord[];
  onClose: () => void;
}

// Mirrors the ₹12L agency-cost baseline quoted throughout the app's KPIs.
const AGENCY_BASELINE_PER_CAMPAIGN = 1_200_000;

function parseRupees(str: string): number {
  const cleaned = str.replace(/[₹,\s]/g, "");
  const crMatch = cleaned.match(/^([\d.]+)cr$/i);
  if (crMatch) return parseFloat(crMatch[1]) * 1e7;
  const lMatch = cleaned.match(/^([\d.]+)l$/i);
  if (lMatch) return parseFloat(lMatch[1]) * 1e5;
  return parseFloat(cleaned) || 0;
}

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function csvEscape(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export const RoiReportModal: React.FC<RoiReportModalProps> = ({ triggers, onClose }) => {
  const approved = triggers
    .filter((t) => t.status === "approved")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const rows = approved.map((t) => {
    const kpis = t.runResult?.kpis || t.kpis || [];
    const computeCostKpi = kpis.find((k) => /compute cost/i.test(k[1] || ""));
    const computeCost = computeCostKpi ? parseRupees(computeCostKpi[0]) : 0;
    const avoided = Math.max(0, AGENCY_BASELINE_PER_CAMPAIGN - computeCost);
    return {
      name: t.name,
      approvedAt: t.updatedAt,
      regions: t.expectedBenefit?.regionsLaunched ?? (t.runResult?.assets.length || 0),
      salesLift: t.expectedBenefit?.salesLift || "—",
      computeCost,
      avoided,
    };
  });

  const totalAvoided = rows.reduce((sum, r) => sum + r.avoided, 0);
  const totalBaseline = rows.length * AGENCY_BASELINE_PER_CAMPAIGN;

  // Thumbs feedback across every generated asset — a proxy "is the AI's
  // output actually good" track record, independent of whether a campaign
  // ultimately shipped.
  const { up, down } = triggers.reduce(
    (acc, t) => {
      for (const a of t.runResult?.assets || []) {
        if (a.feedback === "up") acc.up++;
        if (a.feedback === "down") acc.down++;
      }
      return acc;
    },
    { up: 0, down: 0 }
  );
  const totalVotes = up + down;

  const handleDownloadCsv = () => {
    const lines = [
      "Campaign,Approved At,Regions Launched,Sales Lift,Agency Baseline (INR),Compute Cost (INR),Cost Avoided (INR)",
      ...rows.map((r) =>
        [
          r.name,
          r.approvedAt,
          r.regions,
          r.salesLift,
          AGENCY_BASELINE_PER_CAMPAIGN,
          Math.round(r.computeCost),
          Math.round(r.avoided),
        ]
          .map(csvEscape)
          .join(",")
      ),
      ["TOTAL", "", "", "", totalBaseline, "", Math.round(totalAvoided)].map(csvEscape).join(","),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rasoi-roi-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="roi-print-area"
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 rounded-3xl bg-slate-900 p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1 roi-print-hide">
          <div className="flex items-center gap-2.5">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-extrabold text-white">ROI Report — Agency Cost Avoided</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Only shown in the printed/PDF output, since the header above gets hidden then */}
        <div className="hidden roi-print-only mb-4">
          <h1 className="text-xl font-extrabold text-white">RASOI — Knorr Kitchen Demand Engine</h1>
          <p className="text-sm text-slate-400">ROI Report — Agency Cost Avoided</p>
          <p className="text-xs text-slate-500">Generated {new Date().toLocaleString("en-IN")}</p>
        </div>

        <p className="text-xs text-slate-400 mb-4 roi-print-hide">
          Every approved campaign's simulated compute cost vs. the ₹12L agency baseline used throughout the app.
        </p>

        {rows.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
            No approved campaigns yet — sign off a campaign to see it here.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Campaigns</div>
                <b className="text-lg font-extrabold text-white">{rows.length}</b>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Total Cost Avoided
                </div>
                <b className="text-lg font-extrabold text-emerald-400">{formatInr(totalAvoided)}</b>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  AI Creative Quality
                </div>
                <b className="text-lg font-extrabold text-orange-400">
                  {totalVotes > 0 ? `${Math.round((up / totalVotes) * 100)}% positive` : "No ratings yet"}
                </b>
                {totalVotes > 0 && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{totalVotes} brand manager ratings</div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-2 pr-2">Campaign</th>
                    <th className="py-2 pr-2">Regions</th>
                    <th className="py-2 pr-2">Sales Lift</th>
                    <th className="py-2 pr-2 text-right">Compute Cost</th>
                    <th className="py-2 pr-0 text-right">Cost Avoided</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td className="py-2 pr-2 font-medium text-slate-200">{r.name}</td>
                      <td className="py-2 pr-2 text-slate-400">{r.regions}</td>
                      <td className="py-2 pr-2 text-slate-400">{r.salesLift}</td>
                      <td className="py-2 pr-2 text-right text-slate-400">{formatInr(r.computeCost)}</td>
                      <td className="py-2 pr-0 text-right font-semibold text-emerald-400">
                        {formatInr(r.avoided)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-2 pr-2 font-extrabold text-white" colSpan={4}>
                      Total avoided vs. ₹12L-per-campaign agency baseline
                    </td>
                    <td className="py-2 pr-0 text-right font-extrabold text-emerald-400">
                      {formatInr(totalAvoided)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center gap-2.5 mt-5 roi-print-hide">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 rounded-xl hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl hover:border-slate-600 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
