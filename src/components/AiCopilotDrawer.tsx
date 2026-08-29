import React, { useState } from "react";
import { X, Send, Bot, Sparkles } from "lucide-react";

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTriggerName: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeTriggerName,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `Hello Chef! I am your RASOI Demand Copilot. Active trigger context: "${activeTriggerName}". Ask me anything about FSSAI regulations, 14 WiMI cluster variations, or Knorr recipe adaptations.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          triggerContext: activeTriggerName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reach RASOI Copilot");
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error connecting to RASOI intelligence core. Please check your network or try asking again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="copilot-drawer-backdrop"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        id="copilot-drawer-panel"
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                RASOI DEMAND COPILOT
              </h3>
              <p className="text-[9.5px] text-slate-400 font-mono">
                Gemini 3.7 · HUL Culinary Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 max-w-[85%] ${
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] ${
                  m.role === "user"
                    ? "bg-slate-800 text-slate-200"
                    : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                }`}
              >
                {m.role === "user" ? "U" : <Sparkles className="w-3 h-3" />}
              </div>
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-orange-600/20 border border-orange-500/30 text-white rounded-tr-none"
                    : "bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto">
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center text-[10px]">
                <Sparkles className="w-3 h-3 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-400 italic">
                RASOI Copilot is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {[
            "Why is Punjab held?",
            "Explain WiMI SWAAD axes",
            "What is FSSAI Reg 4?",
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => setInput(chip)}
              className="text-[9px] bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400 hover:text-orange-400 whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-2 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Ask RASOI Copilot..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:bg-orange-400 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
