import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { CreativeVariant, EventTheme } from "../types";
import { AssetGrid } from "./AssetGrid";

interface VariantPickerProps {
  variants: CreativeVariant[];
  eventTheme: EventTheme;
  onSelect: (variant: CreativeVariant) => void;
}

export const VariantPicker: React.FC<VariantPickerProps> = ({ variants, eventTheme, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = variants[activeIndex];

  return (
    <div className="border border-orange-500/40 rounded-3xl bg-slate-900/40 p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
          Choose a Creative Direction
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        MAKER generated {variants.length} distinct regional creative directions for this trigger — review each
        and pick the one to take forward, instead of committing to a single AI guess.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {variants.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border ${
              i === activeIndex
                ? "bg-orange-500 text-slate-950 border-orange-400 shadow-sm"
                : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Option {i + 1}: {v.angle}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] overflow-y-auto pr-1">
        <AssetGrid assets={active.assets} showAssets eventTheme={eventTheme} />
      </div>

      <button
        onClick={() => onSelect(active)}
        className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
      >
        <CheckCircle2 className="w-4 h-4" />
        Use "{active.angle}" — Run Compliance Scan
      </button>
    </div>
  );
};
