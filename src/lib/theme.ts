import { EventTheme } from "../types";

export function deriveEventTheme(text: string): EventTheme {
  const t = text.toLowerCase();
  if (/cold|winter|snow|chill|frost/.test(t)) return "cold";
  if (/rain|monsoon|flood|storm|downpour/.test(t)) return "rain";
  if (/festival|puja|navratri|diwali|fasting|vrat|eid|christmas|holi/.test(t)) return "festival";
  if (/cricket|ipl|match|football|sport|tournament/.test(t)) return "sport";
  return "default";
}
