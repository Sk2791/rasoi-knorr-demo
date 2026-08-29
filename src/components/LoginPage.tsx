import React, { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onEnter: (name: string, role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onEnter }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Brand Manager, Foods");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onEnter(name.trim(), role.trim() || "Brand Manager");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/40 mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-slate-950 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            KNORR <span className="text-orange-400 font-light">Demand Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2 tracking-[0.15em] uppercase">
            Hindustan Unilever · Project NEXT
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-slate-800/80 rounded-3xl bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl"
        >
          <h2 className="text-sm font-bold text-white mb-1">Sign in to your console</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your name to access AI-detected regional opportunities awaiting your review.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <input
                type="text"
                placeholder="Brand Manager, Foods"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enter Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-5">
          Demo console · no password required
        </p>
      </div>
    </div>
  );
};
