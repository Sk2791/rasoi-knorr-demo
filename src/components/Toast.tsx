import React from "react";
import { Info } from "lucide-react";

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] animate-slide">
      <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-4 py-3 text-xs text-slate-200 max-w-md">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};
