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
  englishMeaning?: string;
  suggestedEdit?: string;
  suggestedEnglish?: string;
  status?: "live" | "held" | "approved" | "rejected";
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

export type TriggerStatus = "pending" | "saved" | "approved" | "cancelled";

export type Screen = "login" | "home" | "review" | "run" | "summary";

export interface ExpectedBenefit {
  salesLift: string;
  turnaround: string;
  regionsLaunched: number;
  simulatedOrders: number;
}

export interface RunResult {
  verdict: string;
  kpis: Array<[string, string, string]>;
  assets: Asset[];
  provider?: string | null;
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

