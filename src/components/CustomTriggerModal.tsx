import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Trigger } from "../types";

interface CustomTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrigger: (key: string, trigger: Trigger) => void;
}

export const CustomTriggerModal: React.FC<CustomTriggerModalProps> = ({
  isOpen,
  onClose,
  onAddTrigger,
}) => {
  const [eventDesc, setEventDesc] = useState("");
  const [region, setRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDesc.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/trigger/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDescription: eventDesc,
          region: region || "India",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate custom trigger.");
      }

      const generatedTrigger: Trigger = data.trigger;
      const isWellFormed =
        generatedTrigger &&
        typeof generatedTrigger.name === "string" &&
        typeof generatedTrigger.blurb === "string" &&
        Array.isArray(generatedTrigger.assets) &&
        generatedTrigger.assets.length > 0 &&
        Array.isArray(generatedTrigger.signals) &&
        Array.isArray(generatedTrigger.kpis);

      if (!isWellFormed) {
        throw new Error("Generation returned incomplete data, please try again.");
      }

      const customKey = `custom_${Date.now()}`;

      onAddTrigger(customKey, generatedTrigger);
      setEventDesc("");
      setRegion("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while calling Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="custom-trigger-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="custom-trigger-modal-box"
        className="max-w-lg w-full border border-slate-800 rounded-3xl bg-slate-900 p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            Generate Custom AI Trigger (Gemini 3.7)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          Type any live market condition, weather anomaly, or cultural festival. Gemini will simulate SCOUT signals, SWAAD taste resolutions, ARBITER scores, and regional asset copy.
        </p>

        <form onSubmit={handleGenerate} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[9px] font-mono text-orange-400 uppercase mb-1">
              Event / Occasion Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sudden unseasonal hail and cold snap in Himachal"
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono text-orange-400 uppercase mb-1">
              Target Cluster / Region (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. North Cluster, Tamil Nadu, or All India"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="flex gap-1.5 flex-wrap my-1">
            <span className="text-[9px] text-slate-500 self-center">Try:</span>
            {[
              "Chhath Puja in Bihar",
              "Unseasonal Rain in Bangalore",
              "IPL Final Night Snack Craving",
              "Heatwave in Rajasthan"
            ].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setEventDesc(preset)}
                className="text-[8.5px] bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400 hover:text-orange-400 hover:border-orange-500/40"
              >
                {preset}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !eventDesc.trim()}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 uppercase flex items-center justify-center gap-1.5 hover:bg-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  SCOUT Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Trigger Mesh
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
