import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  declare props: React.PropsWithChildren;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("RASOI encountered an unexpected error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-slate-800 rounded-3xl bg-slate-900/80 p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            RASOI hit an unexpected error. Your simulation state has been reset — reloading the console will get you
            back to a clean start.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-orange-400 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Console
          </button>
        </div>
      </div>
    );
  }
}
