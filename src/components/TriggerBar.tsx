import React from "react";
import { Trigger } from "../types";

interface TriggerBarProps {
  triggers: Record<string, Trigger>;
  selectedKey: string;
  onSelectTrigger: (key: string) => void;
}

export const TriggerBar: React.FC<TriggerBarProps> = ({
  triggers,
  selectedKey,
  onSelectTrigger,
}) => {
  return (
    <div id="trigger-selector-bar" className="flex gap-3 items-stretch mt-3 overflow-x-auto pb-1">
      <span id="trigger-selector-label" className="text-[9px] tracking-[0.2em] text-slate-500 font-bold self-center whitespace-nowrap pr-1 uppercase">
        SELECT<br />TRIGGER
      </span>

      {Object.entries(triggers).map(([key, rawT]) => {
        const t = rawT as Trigger;
        const isSelected = key === selectedKey;
        return (
          <button
            key={key}
            id={`trigger-btn-${key}`}
            onClick={() => onSelectTrigger(key)}
            className={`flex-1 min-w-[240px] rounded-2xl p-3 text-left transition-all cursor-pointer border ${
              isSelected
                ? "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <b className="block text-[11px] font-bold text-white tracking-wide">{t.name}</b>
            <i className="block not-italic text-[8.5px] text-orange-400 font-mono my-0.5">{t.meta}</i>
            <span className="block text-[8px] text-slate-400 leading-tight">{t.blurb}</span>
          </button>
        );
      })}
    </div>
  );
};
