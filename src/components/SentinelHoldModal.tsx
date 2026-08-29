import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Scale, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { FlaggedClaim } from "../types";

interface SentinelHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproveWithEdit: () => void;
  onApproveOriginalOverride: () => void;
  onRejectAd: () => void;
  flaggedClaim?: FlaggedClaim | null;
}

export const SentinelHoldModal: React.FC<SentinelHoldModalProps> = ({
  isOpen,
  onClose,
  onApproveWithEdit,
  onApproveOriginalOverride,
  onRejectAd,
  flaggedClaim,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<"suggested" | "original">("suggested");
  const [showFullDetail, setShowFullDetail] = useState(false);

  if (!isOpen || !flaggedClaim) return null;

  return (
    <div
      id="sentinel-hold-modal-backdrop"
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="sentinel-hold-modal-box"
        className="max-w-2xl w-full border border-amber-500/50 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl my-8 text-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                {flaggedClaim.city} ad held — claim needs your review
              </h3>
              <p className="text-xs text-amber-400 font-medium mt-0.5">
                Knorr Regional Campaign · {flaggedClaim.city} Cluster ({flaggedClaim.assetCode}) · FSSAI Policy Review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly Plain-English Explanation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4 text-xs md:text-sm text-slate-300 leading-relaxed">
          <p>
            <b className="text-white font-semibold">What happened:</b> SENTINEL automatically flagged the {flaggedClaim.city} creative because it references <b className="text-amber-300">"{flaggedClaim.claimQuoted}"</b>.{" "}
            {flaggedClaim.rationale || "Under Indian food laws, this type of claim requires clinical laboratory approval before going public."}
          </p>
        </div>

        {/* Side-by-Side Review Choices */}
        <div className="space-y-3 mb-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Choose how you'd like to proceed:
          </div>

          {/* Option 1: Suggested Compliant Rewrite (Recommended) */}
          <div
            onClick={() => setSelectedChoice("suggested")}
            className={`border rounded-2xl p-4 transition-all cursor-pointer ${
              selectedChoice === "suggested"
                ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500 text-slate-950 flex items-center justify-center text-xs font-extrabold">
                  ✓
                </span>
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                  Option 1: Use Suggested Compliant Rewrite (Recommended)
                </span>
              </div>
              <span className="text-[10px] bg-green-500/20 text-green-300 font-semibold px-2.5 py-0.5 rounded-full border border-green-500/30">
                100% Safe & Live Instantly
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 my-2">
              <div className="text-base font-extrabold text-white">
                "{flaggedClaim.suggestedRewrite.head}"
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Meaning: <i className="text-amber-200">"{flaggedClaim.suggestedRewrite.englishMeaning}"</i>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Replaces the flagged claim with authentic regional comfort food taste imagery. Complies with all FSSAI rules and goes live immediately.
            </p>
          </div>

          {/* Option 2: Original Headline (Escalate to Legal) */}
          <div
            onClick={() => setSelectedChoice("original")}
            className={`border rounded-2xl p-4 transition-all cursor-pointer ${
              selectedChoice === "original"
                ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-extrabold">
                  !
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Option 2: Keep Original Copy & Submit to Regulatory Team
                </span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                36h Legal Review
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 my-2">
              <div className="text-base font-extrabold text-slate-200">
                "{flaggedClaim.originalHead}"
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Meaning: <i className="text-amber-300">"{flaggedClaim.originalEnglish}"</i>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Keeps the {flaggedClaim.city} ad on hold while routing lab reports to HUL Legal & Regulatory. The other regional versions will deploy immediately.
            </p>
          </div>
        </div>

        {/* Exact Plain-English Regulation Box */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            The Exact Rule Quoted Plainly
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {flaggedClaim.regulationCite}
          </p>

          <button
            type="button"
            onClick={() => setShowFullDetail((v) => !v)}
            className="mt-3 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            {showFullDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showFullDetail ? "Hide full regulatory explanation" : "See full regulatory explanation"}
          </button>

          {showFullDetail && (
            <div className="mt-3 space-y-2.5 border-t border-slate-800 pt-3">
              <div>
                <h5 className="text-[10px] tracking-wider text-orange-400 uppercase font-bold mb-1">
                  What the regulation actually requires
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Under the Food Safety and Standards (Advertising and Claims) Regulations, 2018, every claim must be truthful, unambiguous, meaningful, not misleading, and scientifically substantiated by validated methods of quantifying the substance the claim rests on. A nutrient content claim is only permitted on the conditions set out in Schedule I, measured against that specific SKU's tested values. A health claim is narrower still: under Regulation 4 it may only be made if it's on the list notified by the Food Authority, or backed by scientific evidence submitted to FSSAI.
                </p>
              </div>
              <div>
                <h5 className="text-[10px] tracking-wider text-orange-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  Why this is a hard rule, not a confidence threshold
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Under Section 53 of the FSS Act, 2006, a misleading advertisement carries a penalty of up to ₹10 lakh per offence — so nutrition and health claims sit at autonomy tier L4: never automated, regardless of how confident the generating model is. The asset is quarantined and routed to Nutrition & Regulatory with the claim text attached; nothing else is blocked, one thing is escalated.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {selectedChoice === "suggested" ? (
            <button
              onClick={() => {
                onApproveWithEdit();
                onClose();
              }}
              className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-slate-950 font-extrabold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-400 transition-all cursor-pointer shadow-lg shadow-green-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve with suggested edit (Launch all regions live)
            </button>
          ) : (
            <button
              onClick={() => {
                onApproveOriginalOverride();
                onClose();
              }}
              className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <FileText className="w-4 h-4" />
              Submit original to Legal & launch remaining regions live
            </button>
          )}

          <button
            onClick={() => {
              onRejectAd();
              onClose();
            }}
            className="py-3 px-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-xs uppercase hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            Reject ad (others live)
          </button>
        </div>
      </div>
    </div>
  );
};
