export interface Signal {
  src: string;
  t: string;
  v: number;
  hot?: number;
}

export interface Asset {
  c: string;
  city: string;
  lang: string;
  fmt: string;
  head: string;
  sub: string;
  bg1: string;
  bg2: string;
  badge: string;
  q: string;
  held?: number;
  tasteNote?: string;
  // Names the specific local cultural reference (festival, idiom, cricket/
  // cinema reference, etc.) woven into head/sub — this app's answer to
  // "cultural authenticity, not just dialect translation."
  culturalNote?: string;
  englishMeaning?: string;
  suggestedEdit?: string;
  suggestedEnglish?: string;
  status?: "live" | "held" | "approved" | "rejected";
  // Lightweight brand-manager rating on the generated creative — a cheap
  // track record of "is the AI's output actually good" ahead of ever wiring
  // up real campaign-performance feedback.
  feedback?: "up" | "down";
  // AI-generated (xAI Grok) banner background, as a data: URI so it's
  // self-contained and never link-rots in History. Generated once at
  // creation time; absent means generation failed or wasn't configured, in
  // which case the card falls back to the bundled stock-photo pool.
  img?: string;
}

// One of several distinct creative directions MAKER proposes for the same
// trigger — the brand manager picks one instead of the pipeline committing
// to a single AI guess.
export interface CreativeVariant {
  angle: string;
  assets: Asset[];
}

export interface Trigger {
  name: string;
  meta: string;
  blurb: string;
  targetMin: number;
  opp: string;
  scores: string[];
  mesh: string[];
  reach: string[];
  signals: Signal[];
  verdict: string;
  kpis: Array<[string, string, string]>;
  assets?: Asset[];
  // Brand Manager Executive Fields
  headlineInsight?: string;
  recommendation?: string;
  urgencyLevel?: "Immediate (Next 3h)" | "High (Next 12h)" | "Moderate";
  affectedRegions?: string[];
  marketLift?: string;
  revenueHeadroom?: string;
  windowDuration?: string;
}

export interface Cluster {
  c: string;
  n: string;
  lang: string;
  note: string;
  t: number[]; // [Sweet, Sour, Heat, Salt, Aroma, Body]
  tasteSummary?: string;
}

export interface AgentInfo {
  id: string;
  n: string;
  d: string;
  t: number;
  log: (t: Trigger) => string;
  details?: {
    role: string;
    dataSources: string[];
    reasoning: string;
    outputArtifact: string;
  };
}

export type GuardStatus = "pass" | "flag";

export interface GuardrailItem {
  label: string;
  status: GuardStatus;
  note: string;
}

export interface FlaggedClaim {
  assetCode: string;
  city: string;
  originalHead: string;
  originalSub: string;
  originalEnglish: string;
  claimQuoted: string;
  regulationCite: string;
  rationale: string;
  suggestedRewrite: {
    head: string;
    sub: string;
    englishMeaning: string;
  };
}

export type EventTheme = "cold" | "rain" | "festival" | "sport" | "default";

// "pending_regional_approval" sits between a brand manager's run completing
// and the campaign actually going live — it needs a second sign-off from a
// Regional Marketing Lead first, mirroring a real two-step approval chain.
export type TriggerStatus = "pending" | "saved" | "pending_regional_approval" | "approved" | "cancelled";

export type UserRole = "Brand Manager" | "Regional Marketing Lead";

export type Screen = "login" | "home" | "review" | "run" | "summary";

export interface ExpectedBenefit {
  salesLift: string;
  turnaround: string;
  regionsLaunched: number;
  simulatedOrders: number;
}

// An AI-simulated approximation of the dimensions a real ad pre-testing
// service (e.g. Kantar Link) measures via live consumer panels — NOT actual
// panel data. Useful as a directional quality signal, not a substitute for
// real pre-testing.
export interface LinkScore {
  branding: number; // 0-100: is the product/brand clearly, correctly represented?
  communication: number; // 0-100: does the copy convey the intended message clearly?
  culturalResonance: number; // 0-100: does it feel locally authentic, not just translated?
  cutThrough: number; // 0-100: distinctive enough to stand out from category clutter?
  persuasion: number; // 0-100: does it plausibly drive intent to try/buy?
  overallPercentile: number; // 0-100: simulated percentile vs a category norm
  rationale: string; // 1-2 sentences explaining the scores
}

export interface RunResult {
  verdict: string;
  kpis: Array<[string, string, string]>;
  assets: Asset[];
  provider?: string | null;
  // The full set of creative directions MAKER generated, kept for audit —
  // assets above is just whichever one the brand manager picked.
  variants?: CreativeVariant[];
  linkScore?: LinkScore;
}

export interface TriggerRecord extends Trigger {
  id: string;
  status: TriggerStatus;
  createdAt: string;
  updatedAt: string;
  runResult?: RunResult;
  expectedBenefit?: ExpectedBenefit;
  approvedBy?: string;
}

export interface BannerRecord {
  triggerId: string;
  triggerName: string;
  approvedAt: string;
  clusterCode: string;
  city: string;
  lang: string;
  fmt: string;
  head: string;
  sub: string;
  englishMeaning?: string;
  badge: string;
  held?: number;
  orderCount: number;
  img?: string;
  culturalNote?: string;
  tasteNote?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  time: string;
}

export interface AppNotification {
  id: string;
  message: string;
  time: string;
}

