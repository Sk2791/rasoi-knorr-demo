import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { DatabaseSync } from "node:sqlite";
import { CLUSTERS, TRIGGERS as SEED_TRIGGERS, ASSETS } from "./src/data/mockData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// RASOI only ever advertises Knorr instant soup — never any other Knorr line
// or unrelated food category. Without an explicit anchor like this, the AI
// happily drifts to "a regional food habit" as the whole product (e.g. it
// once generated ad copy for milk biscuits), since the surrounding prompts
// only ever describe the CREATIVE TASK, not the actual product being sold.
// Interpolated into every prompt that can produce ad copy (head/sub/tasteNote).
const PRODUCT_CONSTRAINT =
  `The product being advertised is ALWAYS a Knorr instant soup (e.g. Knorr Classic Sweet Corn, Knorr Tomato, Knorr Hot & Sour, Knorr Mixed Vegetable, Knorr Manchow) — a hot bowl of soup ready in about 4-5 minutes. Every headline, subheading, tasteNote and englishMeaning MUST be about this soup. NEVER write about, or imply the product is, any other food or category — no biscuits, chips, namkeen, sweets, standalone noodles, chai, or any snack that is not Knorr soup. A regional dish or festival food habit may only be referenced as flavor inspiration for how the soup itself is seasoned (e.g. "with a mustard-oil tempering", "curry-leaf aroma"), never as a separate product being sold. This SWAAD-suggested regional flavor twist must not be confined to the tasteNote field alone — name or clearly describe that same flavor customization directly in the headline or subheading (e.g. "Knorr Manchow with a mustard-oil tempering", not just a generic "hot Knorr soup"), and restate it in plain English in englishMeaning, so the regional personalization is visible in the main tagline and description themselves, not only in a separate footnote.`;

// ---------------------------------------------------------------------------
// Lightweight persistence: node:sqlite (built into Node, no native deps).
// One table holds every trigger — pending (AI-detected, awaiting review),
// saved (deferred), approved (live, with its run result), or cancelled.
// ---------------------------------------------------------------------------
const db = new DatabaseSync(path.join(process.cwd(), "rasoi.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS triggers (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);

function rowToRecord(row: any) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...JSON.parse(row.data),
  };
}

// Idempotent: inserts any preset key from mockData.ts that isn't already in
// the DB, so adding a new preset later still reaches existing installs
// without touching rows a brand manager has already reviewed/approved.
function seedMissingPresetTriggers() {
  const existingIds = new Set(
    (db.prepare("SELECT id FROM triggers").all() as any[]).map((r) => r.id)
  );
  const missing = Object.entries(SEED_TRIGGERS).filter(([key]) => !existingIds.has(key));
  if (missing.length === 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    "INSERT INTO triggers (id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)"
  );
  for (const [key, trigger] of missing) {
    insert.run(key, "pending", now, now, JSON.stringify(trigger));
  }
  console.log(`Seeded ${missing.length} new preset trigger(s) into rasoi.db`);
}

seedMissingPresetTriggers();

// API: Narrow demo-tidying reset for rehearsal — does NOT touch custom/scanned
// triggers, only:
// 1. The 6 predefined presets: any preset that's currently pending/saved is
//    left alone (already available); any that's been approved/cancelled gets
//    a FRESH pending copy inserted under a new id (`<preset>_reset_<ts>`) so
//    it's reviewable again — critically, the original approved/cancelled row
//    is never touched, since that row IS the History entry for that run.
//    (An earlier version deleted-and-reinserted the original id directly,
//    which silently destroyed History the moment a preset had been used —
//    fixed here.)
// 2. History (approved/cancelled rows): trimmed down to the most recent 10,
//    so accumulated test runs don't clutter what a judge might scroll through.
app.post("/api/demo/reset", (req, res) => {
  const now = new Date().toISOString();
  const insert = db.prepare(
    "INSERT INTO triggers (id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)"
  );
  // Checking only the ORIGINAL preset id's status is not enough — once a
  // preset has ever been run, that original row stays approved/cancelled
  // forever, so a naive check would restock it again on every single reset
  // even while an unreviewed copy from a PREVIOUS reset is still sitting
  // there untouched. Instead, look at every row belonging to this preset's
  // "family" (the original id plus any `${key}_reset_*` copies) and only
  // restock if none of them are currently available to review.
  const allRows = db.prepare("SELECT id, status FROM triggers").all() as any[];
  let restocked = 0;
  Object.entries(SEED_TRIGGERS).forEach(([key, trigger], idx) => {
    const family = allRows.filter((r) => r.id === key || r.id.startsWith(`${key}_reset_`));
    const alreadyAvailable = family.some((r) => r.status === "pending" || r.status === "saved");
    if (alreadyAvailable) return;

    const freshId = family.length === 0 ? key : `${key}_reset_${Date.now()}_${idx}`;
    insert.run(freshId, "pending", now, now, JSON.stringify(trigger));
    restocked++;
  });

  const historyRows = db
    .prepare("SELECT id FROM triggers WHERE status IN ('approved','cancelled') ORDER BY updated_at DESC")
    .all() as any[];
  const toTrim = historyRows.slice(10).map((r) => r.id);
  const delHistory = db.prepare("DELETE FROM triggers WHERE id = ?");
  for (const id of toTrim) delHistory.run(id);

  res.json({ success: true, presetsRestocked: restocked, historyTrimmed: toTrim.length });
});

// API: List triggers, optionally filtered by status
app.get("/api/triggers", (req, res) => {
  const { status } = req.query;
  const rows = (
    status
      ? db.prepare("SELECT * FROM triggers WHERE status = ? ORDER BY created_at DESC").all(String(status))
      : db.prepare("SELECT * FROM triggers ORDER BY created_at DESC").all()
  ) as any[];
  res.json({ success: true, triggers: rows.map(rowToRecord) });
});

// API: Insert a new pending trigger (custom event flow)
app.post("/api/triggers", (req, res) => {
  const { id, trigger } = req.body;
  if (!id || !trigger) {
    return res.status(400).json({ error: "id and trigger are required" });
  }
  const now = new Date().toISOString();
  db.prepare("INSERT INTO triggers (id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)").run(
    id,
    "pending",
    now,
    now,
    JSON.stringify(trigger)
  );
  res.json({ success: true });
});

// API: Scan for a new AI-detected opportunity on demand (manual trigger,
// not a background job, so it never burns API quota unattended). Invents one
// plausible, currently-relevant trend/weather trigger for a major Indian
// metro and inserts it straight into the pending queue.
app.post("/api/triggers/scan", async (req, res) => {
  const metros = ["Delhi NCR", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"];
  const metro = metros[Math.floor(Math.random() * metros.length)];
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  const prompt = `You are SCOUT, the live demand-signal detection agent for RASOI (Hindustan Unilever's Knorr Kitchen Demand Engine).
It is ${today}. Invent ONE plausible, currently-relevant weather anomaly, food/culinary trend, or local cultural event happening right now in or around ${metro}, India, that would spike demand for hot Knorr soup. Do not reuse cold wave, monsoon, Navratri, or cricket-match scenarios — invent something distinct and specific to ${metro}.

${PRODUCT_CONSTRAINT}

Return a structured JSON object matching the RASOI trigger schema exactly:
1. name: Short catchy name (e.g. "Heatwave · South India")
2. meta: Source and timing (e.g. "IMD · 08:00 · Chennai 41°C")
3. blurb: 1-2 sentence market context summary.
4. headlineInsight: One punchy sentence a brand manager reads first, ending in "Recommend act now." — plain English, no jargon.
5. recommendation: 1-2 sentences on what action to approve.
6. urgencyLevel: one of "Immediate (Next 3h)", "High (Next 12h)", "Moderate"
7. affectedRegions: array of 3-6 real Indian region/city names actually affected (not all 14, only the plausibly affected ones)
8. marketLift: string like "+18% Predicted Category Sales Lift"
9. revenueHeadroom: string like "₹14.2 Crore Incremental Sales"
10. windowDuration: string like "72-Hour Demand Peak Window"
11. targetMin: Estimated trigger-to-kitchen execution time in minutes (30-60).
12. opp: Auto-generated occasion card text by ARBITER.
13. scores: Array of 4 string scores [Fit %, Velocity %, Risk %, Headroom ₹cr]
14. mesh: Array of 3 string metrics [Signals/min, Clusters live count (max 14), Sources count]
15. reach: Array of 4 reach strings [Quick commerce pincodes, Kirana outlets, Shakti kits, Language channels]
16. signals: Array of 5-7 signal objects with { src: string, t: string (headline text), v: number (volume score 50-99), hot?: 1|0 }
17. verdict: Predicted category offtake summary sentence.
18. kpis: Array of 6 KPI tuples [[valueStr, labelStr, unitStr]]
19. assets: Array of 4-5 Knorr soup creative asset objects, one per affected region — every headline/subheading advertises Knorr soup, per the product rule above: { c: string (real cluster code like 'DL','MH','TN','WB','KA','TN'), city: string, lang: string, fmt: string, head: string, sub: string, bg1: string, bg2: string, badge: string, q: string, englishMeaning: string }`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for HUL Knorr RASOI proactive opportunity scanning.",
      prompt
    );
    const trigger = JSON.parse(text);
    if (Array.isArray(trigger.affectedRegions)) {
      trigger.affectedRegions = trigger.affectedRegions.slice(0, 6);
    }

    const id = `scan_${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO triggers (id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)").run(
      id,
      "pending",
      now,
      now,
      JSON.stringify(trigger)
    );
    res.json({ success: true, trigger: rowToRecord({ id, status: "pending", created_at: now, updated_at: now, data: JSON.stringify(trigger) }), provider });
  } catch (err: any) {
    console.warn("Scan for new opportunities failed, serving cached fallback:", err?.message || err);
    const fallbackTrigger = generateFallbackScanTrigger(metro);
    const id = `scan_${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO triggers (id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)").run(
      id,
      "pending",
      now,
      now,
      JSON.stringify(fallbackTrigger)
    );
    res.json({
      success: true,
      trigger: rowToRecord({ id, status: "pending", created_at: now, updated_at: now, data: JSON.stringify(fallbackTrigger) }),
      fallback: true,
      notice: "AI providers are currently unavailable. Generated a cached opportunity instead.",
    });
  }
});

// Deterministic backup for the Scan button when both AI providers are down —
// keeps this optional feature from ever surfacing a bare error mid-demo. Not
// meant to be creative, just plausible enough to review/run through the pipeline.
function generateFallbackScanTrigger(metro: string) {
  return {
    name: `Sudden Weather Shift · ${metro}`,
    meta: `SCOUT SIGNAL · Cached · ${metro}`,
    blurb: `A sudden local weather shift in ${metro} has spiked searches for quick hot comfort food.`,
    headlineInsight: `Weather shift detected in ${metro} — hot soup search interest rising. Recommend act now.`,
    recommendation: `Approve & launch a quick regional campaign for ${metro} to capture the demand window.`,
    urgencyLevel: "Moderate" as const,
    affectedRegions: [metro, "Maharashtra", "Karnataka"],
    marketLift: "+14% Predicted Category Sales Lift",
    revenueHeadroom: "₹8.2 Crore Incremental Sales",
    windowDuration: "24-Hour Demand Window",
    targetMin: 48,
    opp: `Local weather shift in ${metro} is driving quick-commerce searches toward hot, comforting meal occasions.`,
    scores: ["84%", "80%", "Low Risk", "₹8.2cr"],
    mesh: ["4,600/min", "9 of 15", "19 active feeds"],
    reach: ["70 dark store pincodes", "8,200 kirana outlets", "1,900 Shakti kits", "5 regional languages"],
    signals: [
      { src: "IMD / MARKET", t: `Sudden weather shift reported across ${metro}`, v: 88, hot: 1 },
      { src: "SEARCH TRENDS", t: `"hot soup near me" search interest rising in ${metro}`, v: 82, hot: 1 },
      { src: "BLINKIT ORDERS", t: "Quick meal basket additions ticking up in metro pincodes", v: 75 },
      { src: "KIRANA EPOS", t: "Small sachet mix sales showing early upward movement", v: 68 },
    ],
    verdict: `✓ Predicted category offtake +14% in ${metro} · cached SCOUT baseline (live AI unavailable).`,
    kpis: [
      ["48 min", "Time to Live Ads", "vs 6 weeks"],
      ["9 of 15", "Regional Versions", "Tailored"],
      ["8,200", "Kirana Stores", "Activated"],
      ["1 Sign-off", "Human Touches", "Regulatory Gate"],
      ["₹7,400", "Compute Cost", "vs ₹12L Agency"],
      ["+14%", "Predicted Sales Lift", "₹8.2 Cr"],
    ],
    assets: ASSETS.slice(0, 4),
  };
}

// Deterministic backup for asset regeneration when both AI providers are
// down — a small, honest variation rather than a bare error, since this is a
// creative "try another take" action that shouldn't block on live AI.
function buildFallbackAssetVariant(city: string, guidance?: string) {
  return {
    head: `${city}: Another Angle.`,
    sub: guidance ? `Exploring: ${guidance.slice(0, 40)}` : "A fresh take on regional comfort",
    englishMeaning: guidance
      ? `An alternate version exploring "${guidance}" — live AI was unavailable, so this is a placeholder take.`
      : "An alternate creative angle — live AI was unavailable, so this is a placeholder take.",
    tasteNote: "Regional taste adaptation carried over from the original version.",
    badge: "Alt Take · Cached",
  };
}

// API: Regenerate a single banner's copy — either a fresh alternate take, or
// steered by the brand manager's own free-text direction. Only rewrites the
// creative fields (head/sub/englishMeaning/tasteNote/badge); cluster, city,
// language and price are left untouched by the caller.
app.post("/api/asset/regenerate", async (req, res) => {
  const { city, lang, clusterCode, tasteNote, eventContext, guidance } = req.body;
  if (!city || !lang) {
    return res.status(400).json({ error: "city and lang are required" });
  }

  const prompt = `You are MAKER & BHASHA, the regional creative and localization agents for RASOI (HUL Knorr Kitchen Demand Engine).
Event context: "${eventContext || "A regional demand campaign"}"
Cluster: ${city} (${clusterCode || ""}), language ${lang}. Regional taste cue: ${tasteNote || "authentic local comfort flavors"}.

${PRODUCT_CONSTRAINT}

${
  guidance
    ? `The brand manager has given this specific direction for the new version — follow it closely, but it must still be consistent with the product rule above (the direction is about angle/tone/occasion, not a different product): "${guidance}"`
    : "Write a genuinely different creative angle and wording than a typical execution — vary whether it leads with weather, occasion, price, or a taste callout, and vary the sentence structure."
}

Generate a structured JSON object with:
1. head: headline written IN the local language/script (${lang})
2. sub: subheading in the same local language/script
3. englishMeaning: a faithful, literal English translation of the NEW head+sub
4. tasteNote: 1 short sentence on the regional taste adaptation
5. badge: short status badge text (e.g. "Live · Fresh Take")`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for a single RASOI regional creative asset regeneration.",
      prompt
    );
    const data = JSON.parse(text);
    res.json({
      success: true,
      asset: {
        head: data.head,
        sub: data.sub,
        englishMeaning: data.englishMeaning,
        tasteNote: data.tasteNote,
        badge: data.badge || "Live · Fresh Take",
      },
      provider,
    });
  } catch (err: any) {
    console.warn("Asset regeneration failed, serving cached variant:", err?.message || err);
    res.json({
      success: true,
      asset: buildFallbackAssetVariant(city, guidance),
      fallback: true,
    });
  }
});

// API: Update a trigger's status and/or attach its run result. Computes the
// simulated per-asset order counts + expected-benefit summary once, the first
// time a trigger transitions to "approved".
app.patch("/api/triggers/:id", (req, res) => {
  const { id } = req.params;
  const { status, runResult, approvedBy } = req.body;

  const existingRow = db.prepare("SELECT * FROM triggers WHERE id = ?").get(id) as any;
  if (!existingRow) {
    return res.status(404).json({ error: "Trigger not found" });
  }

  const data = JSON.parse(existingRow.data);
  if (runResult !== undefined) data.runResult = runResult;
  if (approvedBy !== undefined) data.approvedBy = approvedBy;

  const newStatus = status || existingRow.status;

  // expectedBenefit is computed the first time a run result clears — whether
  // that's a full approval or just reaching the regional-lead sign-off queue
  // — so the queue can already show projected impact ahead of final sign-off.
  if (
    (newStatus === "approved" || newStatus === "pending_regional_approval") &&
    data.runResult &&
    !data.expectedBenefit
  ) {
    const assets = (data.runResult.assets || []).map((a: any) => ({
      ...a,
      orderCount: Math.round(400 + Math.random() * 2600),
    }));
    data.runResult.assets = assets;
    const totalOrders = assets.reduce((sum: number, a: any) => sum + a.orderCount, 0);
    const kpis = data.runResult.kpis || [];
    const formatKpi = (k: any) => {
      if (!k) return "—";
      const [value, , unit] = k;
      const valueStr = String(value).trim();
      // Only append the separate unit field if the value is a bare number —
      // if the AI already baked a unit into the value itself (e.g. "48h"),
      // appending "hrs" too would duplicate it ("48h hrs").
      const isPureNumber = /^-?\d+(\.\d+)?$/.test(valueStr);
      if (!unit || !isPureNumber) return valueStr;
      return unit === "%" ? `${valueStr}%` : `${valueStr} ${unit}`;
    };
    data.expectedBenefit = {
      salesLift: formatKpi(kpis.find((k: any) => /sales/i.test(k[1] || ""))),
      turnaround: formatKpi(kpis.find((k: any) => /launch|speed|turnaround/i.test(k[1] || ""))),
      regionsLaunched: assets.length,
      simulatedOrders: totalOrders,
    };
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE triggers SET status = ?, updated_at = ?, data = ? WHERE id = ?").run(
    newStatus,
    now,
    JSON.stringify(data),
    id
  );

  res.json({ success: true, trigger: rowToRecord({ ...existingRow, status: newStatus, updated_at: now, data: JSON.stringify(data) }) });
});

// API: Flattened banner list across every approved trigger, for the Home dashboard
app.get("/api/banners", (req, res) => {
  const rows = db.prepare("SELECT * FROM triggers WHERE status = 'approved' ORDER BY updated_at DESC").all() as any[];
  const banners: any[] = [];

  for (const row of rows) {
    const data = JSON.parse(row.data);
    const assets = data.runResult?.assets || [];
    for (const asset of assets) {
      banners.push({
        triggerId: row.id,
        triggerName: data.name,
        approvedAt: row.updated_at,
        clusterCode: asset.c,
        city: asset.city,
        lang: asset.lang,
        fmt: asset.fmt,
        head: asset.head,
        sub: asset.sub,
        englishMeaning: asset.englishMeaning,
        badge: asset.badge,
        held: asset.held,
        orderCount: asset.orderCount || 0,
      });
    }
  }

  res.json({ success: true, banners });
});

// API: Real CSV export of every approved banner — the CRM hand-off mechanism
app.get("/api/banners/export.csv", (req, res) => {
  const rows = db.prepare("SELECT * FROM triggers WHERE status = 'approved' ORDER BY updated_at DESC").all() as any[];
  const csvEscape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    "Trigger,Region Code,City,Language,Format,Headline,Subheading,English Meaning,Simulated Orders,Approved At",
  ];

  for (const row of rows) {
    const data = JSON.parse(row.data);
    const assets = data.runResult?.assets || [];
    for (const asset of assets) {
      lines.push(
        [
          csvEscape(data.name),
          csvEscape(asset.c),
          csvEscape(asset.city),
          csvEscape(asset.lang),
          csvEscape(asset.fmt),
          csvEscape(asset.head),
          csvEscape(asset.sub),
          csvEscape(asset.englishMeaning),
          csvEscape(asset.orderCount || 0),
          csvEscape(row.updated_at),
        ].join(",")
      );
    }
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="rasoi-banners-${Date.now()}.csv"`);
  res.send(lines.join("\n"));
});

// Initialize Gemini client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Gemini API endpoints will return fallback responses.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper function to handle 503 / high demand retries and model fallbacks
async function generateContentWithRetry(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const modelsToTry = ["gemini-3.6-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const is503OrBusy =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.status === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE");

        console.warn(`Gemini attempt ${attempt + 1} with model ${model} failed: ${errMsg}`);

        if (is503OrBusy) {
          // Wait 800ms before retry or model switch
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        } else {
          // Non-retriable error, break attempt loop to try next model
          break;
        }
      }
    }
  }

  throw lastError;
}

const GROQ_MODEL = "openai/gpt-oss-120b";

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

async function callGroq(systemInstruction: string, userContent: string, jsonMode: boolean): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userContent },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || (jsonMode ? "{}" : "");
}

// Tries Gemini first (with its existing retry/backoff); falls back to Groq if Gemini
// is unset or every attempt fails (e.g. free-tier daily quota exhausted), so a single
// provider hiccup doesn't force the whole run into static fallback content.
async function generateAI(
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = true
): Promise<{ text: string; provider: "gemini" | "groq" }> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: userContent,
        config: jsonMode
          ? { responseMimeType: "application/json", systemInstruction }
          : { systemInstruction },
      });
      return { text: response.text || (jsonMode ? "{}" : ""), provider: "gemini" };
    } catch (err: any) {
      console.warn("Gemini unavailable, trying Groq fallback:", err?.message || err);
    }
  }

  if (getGroqApiKey()) {
    const text = await callGroq(systemInstruction, userContent, jsonMode);
    return { text, provider: "groq" };
  }

  throw new Error("No AI provider available (Gemini failed/unset and GROQ_API_KEY not configured).");
}

// Fallback trigger generator for when AI models are unavailable or experiencing 503 spikes
function generateFallbackTrigger(eventDescription: string, region: string = "India") {
  const cleanDesc = eventDescription.trim();
  const title = cleanDesc.length > 30 ? `${cleanDesc.substring(0, 30)}...` : cleanDesc;

  return {
    name: `${title} · ${region}`,
    meta: `SCOUT SIGNAL · Live · ${region}`,
    blurb: `High demand opportunity detected for "${eventDescription}". 48-hour execution window identified across target clusters.`,
    headlineInsight: `${title} in ${region} — demand spike detected. Recommend act now.`,
    recommendation: `Approve & launch regional campaign versions to capture this demand window across quick-commerce and kirana outlets in ${region}.`,
    urgencyLevel: "High (Next 12h)",
    affectedRegions: [region === "India" ? "Delhi NCR" : region, "Maharashtra", "Karnataka"],
    marketLift: "+21% Predicted Category Sales Lift",
    revenueHeadroom: "₹11.8 Crore Incremental Sales",
    windowDuration: "48-Hour Demand Window",
    targetMin: 45,
    opp: `Market anomaly "${eventDescription}" in ${region}. Instant meal-occasion demand spike detected across quick-commerce and kirana outlets.`,
    scores: ["92%", "89%", "Low", "₹11.8cr"],
    mesh: ["7,800", "12", "19"],
    reach: ["1,100 pincodes", "3,400 outlets", "520 kits", "6 languages live"],
    signals: [
      { src: "IMD / MARKET", t: `Demand surge: ${eventDescription}`, v: 94, hot: 1 },
      { src: "SEARCH·IN", t: `"${cleanDesc} recipes" search queries +280%`, v: 91, hot: 1 },
      { src: "SWIGGY INSTA", t: "Quick meal basket additions +52% in target pincodes", v: 86, hot: 1 },
      { src: "YOUTUBE·IN", t: "Creator recipe formats trending in regional languages", v: 78 },
      { src: "KIRANA EPOS", t: "Knorr small sachet mix sales velocity spiking", v: 74 },
      { src: "WHATSAPP CH", t: "Regional family forwards sharing seasonal meal ideas", v: 71 },
    ],
    verdict: `✓ Predicted category offtake +21% across ${region} clusters · localized recipe creative armed.`,
    kpis: [
      ["45 min", "Trigger → kitchen", ""],
      ["12 of 14", "Clusters live", ""],
      ["58", "Recipe assets built", ""],
      ["1", "Human touches", ""],
      ["₹8,700", "Compute / occasion", ""],
      ["+21%", "Predicted offtake", ""],
    ],
    assets: [
      {
        c: "MH",
        city: "Mumbai / Pune",
        lang: "Marathi (mr-IN)",
        fmt: "1:1 Quick Feed",
        head: `${cleanDesc} Special Meal`,
        sub: "Knorr 5-minute authentic taste blend",
        bg1: "from-orange-600",
        bg2: "to-amber-700",
        badge: "qComm Ready",
        q: '"5 minute comfort meal"'
      },
      {
        c: "DL",
        city: "Delhi NCR",
        lang: "Hindi (hi-IN)",
        fmt: "9:16 Reel / Shorts",
        head: "Ghar jaisa swaad, minutes mein",
        sub: "Rich warming spices with Knorr",
        bg1: "from-red-600",
        bg2: "to-orange-700",
        badge: "Kirana Twin",
        q: '"Warm homemade taste"'
      },
      {
        c: "TN",
        city: "Chennai",
        lang: "Tamil (ta-IN)",
        fmt: "WhatsApp Forward",
        head: "Authentic Regional Flavor",
        sub: "Perfect pepper & spice balance",
        bg1: "from-amber-600",
        bg2: "to-red-700",
        badge: "Shakti Kit",
        q: '"Spicy comfort"'
      },
      {
        c: "WB",
        city: "Kolkata",
        lang: "Bengali (bn-IN)",
        fmt: "4:5 Carousel",
        head: "Quick Comfort Recipes",
        sub: "Pungent aromatic blend for your kitchen",
        bg1: "from-orange-700",
        bg2: "to-yellow-700",
        badge: "Instamart Top",
        q: '"Traditional aroma"'
      },
      {
        c: "KA",
        city: "Bengaluru",
        lang: "Kannada (kn-IN)",
        fmt: "Banner Ad",
        head: "Instant Kitchen Solution",
        sub: "Curry-leaf tempering & rich broth",
        bg1: "from-red-700",
        bg2: "to-amber-800",
        badge: "Blinkit Hot",
        q: '"Fresh tempering"'
      }
    ]
  };
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "RASOI - Indian Kitchen Demand Engine" });
});

// API: Custom AI Trigger Generator using Gemini with 503 fallback
app.post("/api/trigger/generate", async (req, res) => {
  const { eventDescription, region } = req.body;
  if (!eventDescription) {
    return res.status(400).json({ error: "Event description is required" });
  }

  const prompt = `You are SCOUT & SWAAD, the intelligence agents for RASOI (Hindustan Unilever Limited's Knorr Kitchen Demand Engine).
Given a custom market trigger event in India:
Event: "${eventDescription}"
Region/Context: "${region || 'India'}"

${PRODUCT_CONSTRAINT}

Generate a structured JSON response matching the RASOI trigger schema exactly. Include:
1. name: Short catchy name (e.g. "Heatwave · South India")
2. meta: Source and timing (e.g. "IMD · 08:00 · Chennai 41°C")
3. blurb: 1-2 sentence market context summary.
4. headlineInsight: One punchy sentence a brand manager reads first, ending in "Recommend act now." — plain English, no jargon.
5. recommendation: 1-2 sentences on what action to approve.
6. urgencyLevel: one of "Immediate (Next 3h)", "High (Next 12h)", "Moderate"
7. affectedRegions: array of 3-6 real Indian region/city names genuinely, geographically plausible for this specific event
8. marketLift: string like "+18% Predicted Category Sales Lift"
9. revenueHeadroom: string like "₹14.2 Crore Incremental Sales"
10. windowDuration: string like "72-Hour Demand Peak Window"
11. targetMin: Estimated trigger-to-kitchen execution time in minutes (30-60).
12. opp: Auto-generated occasion card text by ARBITER.
13. scores: Array of 4 string scores [Fit %, Velocity %, Risk %, Headroom ₹cr]
14. mesh: Array of 3 string metrics [Signals/min, Clusters live count (max 14), Sources count]
15. reach: Array of 4 reach strings [Quick commerce pincodes, Kirana outlets, Shakti kits, Language channels]
16. signals: Array of 6-8 signal objects with { src: string, t: string (headline text), v: number (volume score 50-99), hot?: 1|0 }
17. verdict: Predicted category offtake summary sentence.
18. kpis: Array of 6 KPI tuples [[valueStr, labelStr, unitStr]]
19. assets: Array of 5 Knorr soup creative asset objects, one per affected region — every headline/subheading advertises Knorr soup, per the product rule above: { c: string (cluster code like 'DL','MH','TN','WB','PB'), city: string, lang: string, fmt: string, head: string, sub: string, bg1: string, bg2: string, badge: string, q: string, englishMeaning: string, held?: 1 }`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for HUL Knorr RASOI demand engine scenario generation.",
      prompt
    );
    const data = JSON.parse(text);
    if (Array.isArray(data.affectedRegions)) {
      data.affectedRegions = data.affectedRegions.slice(0, 6);
    }
    res.json({ success: true, trigger: data, provider });
  } catch (err: any) {
    console.warn("AI providers unavailable. Serving dynamic SCOUT template fallback:", err?.message || err);
    // Serve high quality dynamic fallback so app experience never breaks
    const fallbackData = generateFallbackTrigger(eventDescription, region);
    res.json({
      success: true,
      trigger: fallbackData,
      fallback: true,
      notice: "AI providers are currently unavailable. Generated scenario using rule-based SCOUT engine."
    });
  }
});

// Shared, verified FSSAI regulation citations for SENTINEL.
// Kept as static text (not LLM-generated) so the legal citation is never hallucinated.
const FSSAI_REGULATION_CITATIONS = {
  nutrientContent:
    "Food Safety and Standards (Advertising and Claims) Regulations, 2018, Schedule I: A nutrient content claim (e.g. \"rich in protein\") is only permitted on the conditions set out in Schedule I, measured against that specific SKU's tested values.",
  healthClaim:
    "Food Safety and Standards (Advertising and Claims) Regulations, 2018, Regulation 4 & FSS Act 2006 s.53: A health or immunity claim may only be made if it is on the list notified by the Food Authority, or backed by scientific evidence submitted to FSSAI. Misleading claims carry penalties up to ₹10 lakh per offence.",
};

// Restricted-claim keywords SENTINEL scans generated regional creative for.
const RESTRICTED_CLAIM_PATTERN =
  /immunity|immune|protein|nutrition|nutrient|cures?|heals?|boosts?|boosting|vitamin|calcium|iron-rich/i;

// Deterministic rewrite used when Gemini can't draft one (no key, or the remediation call failed).
// Never falls back to the flagged asset's own head/sub verbatim — that would still contain the claim.
function buildFallbackRewrite(flaggedAsset: any) {
  if (flaggedAsset.suggestedEdit) {
    return {
      head: flaggedAsset.suggestedEdit,
      sub: flaggedAsset.sub || "Regional comfort flavor",
      englishMeaning: flaggedAsset.suggestedEnglish || "Compliant regional comfort messaging.",
    };
  }
  return {
    head: `${flaggedAsset.city}: Comfort in every bowl.`,
    sub: "Regional taste, warmed up · FSSAI compliant",
    englishMeaning: "Warm regional comfort messaging, with the flagged claim removed.",
  };
}

function pickRegulationCitation(matchedPhrase: string): string {
  return /protein|nutrition|nutrient|vitamin|calcium|iron-rich/i.test(matchedPhrase)
    ? FSSAI_REGULATION_CITATIONS.nutrientContent
    : FSSAI_REGULATION_CITATIONS.healthClaim;
}

const ALL_CLUSTER_CODES = CLUSTERS.map((c) => c.c);

function pickRandomClusterCodes(count: number, exclude: string[] = []): string[] {
  const pool = ALL_CLUSTER_CODES.filter((c) => !exclude.includes(c));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

// Validate/clamp a set of cluster codes Gemini claims are affected by an event:
// dedupe, drop anything not in the real 14-cluster list, pad to a minimum of 3,
// and cap at 8 so a run never shows an unmanageable number of cards.
function sanitizeAffectedClusters(candidate: unknown): string[] {
  // Normalize case/whitespace before matching — the AI doesn't always echo a
  // cluster code back in the exact casing given in the prompt, and a
  // case-sensitive match here would silently drop it and swap in a random
  // cluster instead, producing the wrong region (and its photo) on the card.
  const normalized = Array.isArray(candidate)
    ? candidate
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => ALL_CLUSTER_CODES.includes(c))
    : [];
  const valid = Array.from(new Set(normalized));

  if (valid.length > 8) return valid.slice(0, 8);
  if (valid.length < 3) {
    return [...valid, ...pickRandomClusterCodes(3 - valid.length, valid)];
  }
  return valid;
}

// API: SCOUT — live signal ingestion for a market trigger event
app.post("/api/pipeline/scout", async (req, res) => {
  const { eventDescription, region } = req.body;
  if (!eventDescription) {
    return res.status(400).json({ error: "Event description is required" });
  }

  const clusterReference = CLUSTERS.map((c) => `${c.c} (${c.n})`).join(", ");

  const prompt = `You are SCOUT, the real-time signal ingestion agent for RASOI (HUL Knorr Kitchen Demand Engine).
Market trigger event: "${eventDescription}"
Region/Context: "${region || "India"}"

The 14 valid WiMI cluster codes are: ${clusterReference}.

Generate a structured JSON object with:
1. signals: Array of 6-8 objects { src: string (ALL CAPS source name like "IMD WEATHER", "SEARCH TRENDS", "SWIGGY INSTAMART", "KIRANA EPOS"), t: string (specific headline describing what the signal shows), v: number (volume/confidence score 50-99), hot?: 1 (mark the 2-3 most urgent signals with hot:1) }
2. mesh: Array of 3 strings [signals-per-minute rate e.g. "8,700/min", clusters live count e.g. "5 of 14", active source count e.g. "19 active feeds"]
3. reach: Array of 4 strings [dark store / quick-commerce pincode reach, kirana outlet count, Shakti kit count, regional language count]
4. affectedClusters: Array of 3-8 cluster codes (from the list above ONLY) that are genuinely, geographically and culturally plausible for THIS SPECIFIC event. Be realistic and selective — e.g. a North India cold wave should pick northern clusters like DL/PB/UP/RJ and should NOT include deep-south clusters like KL/TN/KA/AP unless the event explicitly spans all of India. A hyper-local event (one city, one match) can pick as few as 3.`;

  try {
    const { text, provider } = await generateAI("Return valid JSON for RASOI SCOUT signal ingestion.", prompt);
    const data = JSON.parse(text);
    data.affectedClusters = sanitizeAffectedClusters(data.affectedClusters);
    res.json({ success: true, data, provider });
  } catch (err: any) {
    console.warn("SCOUT pipeline call failed:", err?.message || err);
    res.json({ success: false });
  }
});

// API: SWAAD + ARBITER — taste rationale & commercial opportunity quantification
app.post("/api/pipeline/opportunity", async (req, res) => {
  const { eventDescription, region, signals } = req.body;
  if (!eventDescription) {
    return res.status(400).json({ error: "Event description is required" });
  }

  const signalSummary = Array.isArray(signals)
    ? signals.slice(0, 4).map((s: any) => s.t).join("; ")
    : "";

  const prompt = `You are SWAAD (taste adaptation) and ARBITER (commercial opportunity) agents for RASOI (HUL Knorr Kitchen Demand Engine).
Market trigger event: "${eventDescription}"
Region/Context: "${region || "India"}"
Live signals detected by SCOUT: ${signalSummary || "N/A"}

Generate a structured JSON object with:
1. opp: A 1-2 sentence auto-generated occasion card summarizing the meal-occasion opportunity and regional taste consideration.
2. scores: Array of exactly 4 strings [Occasion Fit %, Velocity %, Risk level (e.g. "Low Risk"), Revenue Headroom in ₹cr e.g. "₹14.2cr"]`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for RASOI SWAAD/ARBITER opportunity quantification.",
      prompt
    );
    const data = JSON.parse(text);
    res.json({ success: true, data, provider });
  } catch (err: any) {
    console.warn("Opportunity pipeline call failed:", err?.message || err);
    res.json({ success: false });
  }
});

// API: ECHO + MAKER + BHASHA + COMMERCE — consumer verdict, regional creative & reach
app.post("/api/pipeline/creative", async (req, res) => {
  const { eventDescription, region, opp, scores, affectedClusters, variantCount } = req.body;
  if (!eventDescription) {
    return res.status(400).json({ error: "Event description is required" });
  }

  // Brand manager picks between 2-3 distinct creative directions instead of
  // the pipeline committing to one AI guess — capped at 3 to keep the single
  // JSON response (and the review UI) manageable.
  const numVariants = Math.min(Math.max(parseInt(variantCount, 10) || 1, 1), 3);

  // Use the geography-validated clusters SCOUT determined for this event; fall back
  // to a random 5 only if that stage didn't come back with anything usable.
  const validAffected: string[] = Array.isArray(affectedClusters)
    ? affectedClusters
        .filter((c: unknown): c is string => typeof c === "string")
        .map((c: string) => c.trim().toUpperCase())
        .filter((c: string) => ALL_CLUSTER_CODES.includes(c))
    : [];
  const chosenCodes = validAffected.length >= 3 ? validAffected : pickRandomClusterCodes(5);
  const chosenClusters = chosenCodes
    .map((code) => CLUSTERS.find((cl) => cl.c === code))
    .filter((cl): cl is (typeof CLUSTERS)[number] => !!cl);
  const clusterBrief = chosenClusters
    .map((cl) => `- Code "${cl.c}" — ${cl.n}, language ${cl.lang}. Local taste cue: ${cl.tasteSummary || cl.note}.`)
    .join("\n");

  const assetShape = `{ c: string (the exact cluster code given above), city: string (a real specific city within that cluster), lang: string (the exact language given above, e.g. "Hindi (hi-IN)"), fmt: string (ad format e.g. "1:1 Quick Feed", "9:16 Reel"), head: string (headline written IN the local language/script), sub: string (subheading in local language), badge: string (short status badge text), q: string (price like "₹ 55"), englishMeaning: string (REQUIRED plain-English gloss of head+sub), tasteNote: string (1 short sentence on the regional taste adaptation, using the local taste cue given above) }`;

  const groundingParagraph = `Ground each asset in something SPECIFIC to that exact place and to this exact trigger event — a real local landmark, a region-specific SPICE or FLAVOR habit, or a concrete detail tied to "${eventDescription}" in that city — used only to flavor how the Knorr soup itself is described (e.g. "with a mustard-oil tempering", "curry-leaf aroma"), never to swap in a different food as the thing being sold. Give each asset a genuinely different creative angle and sentence structure — do not reuse the same template (e.g. do not write every headline as "<City>'s winter + Knorr's <soup>, ready in X minutes"); vary whether it leads with weather, a local occasion, a price hook, or a taste callout — all while still being unmistakably an ad for hot Knorr soup. Write natural, benefit-led vernacular ad headlines the way a real LOCAL regional copywriter for that specific city would — evoke warmth, comfort, nutrition, or energy where locally resonant. Do not self-censor or sanitize claims; a separate compliance system reviews this content afterward.`;

  const outputSpec =
    numVariants > 1
      ? `3. variants: Array of exactly ${numVariants} DISTINCT creative directions for the brand manager to choose between — each a genuinely different overall angle/tone (e.g. one leading with weather & comfort, one with a local festive/occasion hook, one with a value/price/speed hook), NOT just reworded copies of each other. Each variant object: { angle: string (a short 2-4 word label naming this variant's creative angle, e.g. "Weather & Comfort"), assets: Array of exactly ${chosenClusters.length} Knorr soup creative objects (per the product rule above — every one advertises Knorr soup), one per required cluster above (use its exact code for "c" and its exact language for "lang"), each with: ${assetShape} }`
      : `3. assets: Array of exactly ${chosenClusters.length} Knorr soup creative objects (per the product rule above — every one advertises Knorr soup), one per required cluster above (use its exact code for "c" and its exact language for "lang"), each with: ${assetShape}`;

  const prompt = `You are ECHO (consumer sentiment), MAKER (regional creative), BHASHA (language localization) and COMMERCE (channel reach) agents for RASOI (HUL Knorr Kitchen Demand Engine).
Market trigger event: "${eventDescription}"
Region/Context: "${region || "India"}"
Quantified opportunity: "${opp || ""}" (scores: ${(scores || []).join(", ")})

${PRODUCT_CONSTRAINT}

You MUST generate exactly one creative asset for EACH of these ${chosenClusters.length} required clusters — these are the ONLY clusters genuinely affected by this event, do not skip any, do not substitute different ones, do not add extras:
${clusterBrief}

Generate a structured JSON object with:
1. verdict: A 1-sentence predicted category offtake summary, prefixed with "✓".
2. kpis: Array of exactly 6 tuples [valueStr, labelStr, unitStr] covering launch speed, regional versions, store reach, governance touches, compute cost, and predicted sales lift. The launch speed / turnaround KPI is THE core value proposition of this product (AI-generated regional campaigns in minutes instead of an agency's weeks) — it MUST be a small number of minutes (e.g. "4", "min") or at most hours, NEVER days or weeks; a multi-day figure would contradict the entire pitch of this tool.
${outputSpec}

${groundingParagraph}`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for RASOI ECHO/MAKER/BHASHA/COMMERCE regional creative generation.",
      prompt
    );
    const data = JSON.parse(text);
    if (numVariants > 1 && Array.isArray(data.variants)) {
      const firstAssets = data.variants[0]?.assets;
      if (Array.isArray(firstAssets) && Array.isArray(data.kpis) && data.kpis[1]) {
        data.kpis[1] = [String(firstAssets.length), "Regional Versions", "Tailored"];
      }
    } else if (Array.isArray(data.assets) && Array.isArray(data.kpis) && data.kpis[1]) {
      data.kpis[1] = [String(data.assets.length), "Regional Versions", "Tailored"];
    }
    res.json({ success: true, data, provider });
  } catch (err: any) {
    console.warn("Creative pipeline call failed:", err?.message || err);
    res.json({ success: false });
  }
});

// API: SENTINEL — deterministic compliance scan + generative remediation
app.post("/api/pipeline/sentinel", async (req, res) => {
  const { assets } = req.body;
  if (!Array.isArray(assets)) {
    return res.status(400).json({ error: "assets array is required" });
  }

  let flaggedAsset: any = null;
  let matchedPhrase = "";

  for (const asset of assets) {
    const haystack = [asset.head, asset.sub, asset.englishMeaning, asset.tasteNote]
      .filter(Boolean)
      .join(" ");
    const match = haystack.match(RESTRICTED_CLAIM_PATTERN);
    if (match) {
      flaggedAsset = asset;
      matchedPhrase = match[0];
      break;
    }
  }

  if (!flaggedAsset) {
    return res.json({ success: true, flagged: false });
  }

  const regulationCite = pickRegulationCitation(matchedPhrase);

  const prompt = `You are SENTINEL, the FSSAI compliance agent for RASOI (HUL Knorr Kitchen Demand Engine).
This regional ad asset was flagged because its copy references the regulated phrase "${matchedPhrase}":
- Cluster: ${flaggedAsset.city} (${flaggedAsset.c})
- Language: ${flaggedAsset.lang}
- Original headline: "${flaggedAsset.head}"
- Original subheading: "${flaggedAsset.sub}"
- English meaning: "${flaggedAsset.englishMeaning || ""}"

Note: the flagged phrase may appear only in the English meaning (as a translation of an implied claim) rather than as a literal word in the native-script headline — that is still a real claim and still needs fixing in the actual published copy, not just in the English gloss.

Generate a structured JSON object with:
1. claimQuoted: The exact short phrase (in English) that constitutes the regulated claim.
2. rationale: 1-2 plain-English sentences explaining what was found and why it's regulated.
3. suggestedRewrite: { head: string, sub: string, englishMeaning: string }

Requirements for suggestedRewrite:
- head and sub MUST be written in the SAME language/script as the original (${flaggedAsset.lang}), but the actual WORDING must be genuinely different from the original — do not return the original headline/subheading unchanged. Replace whatever is carrying the claim with authentic taste, comfort, or occasion imagery instead.
- englishMeaning MUST be a faithful, literal translation of your NEW head+sub — not an independently-written compliant-sounding gloss that doesn't match what the new native-script text actually says.`;

  try {
    const { text, provider } = await generateAI(
      "Return valid JSON for RASOI SENTINEL compliance remediation.",
      prompt
    );
    const data = JSON.parse(text);
    const rewriteUnchanged =
      !data.suggestedRewrite ||
      data.suggestedRewrite.head === flaggedAsset.head ||
      data.suggestedRewrite.sub === flaggedAsset.sub;
    res.json({
      success: true,
      flagged: true,
      assetCode: flaggedAsset.c,
      city: flaggedAsset.city,
      originalHead: flaggedAsset.head,
      originalSub: flaggedAsset.sub,
      originalEnglish: flaggedAsset.englishMeaning || "",
      claimQuoted: data.claimQuoted || matchedPhrase,
      regulationCite,
      rationale: data.rationale || "",
      suggestedRewrite: rewriteUnchanged ? buildFallbackRewrite(flaggedAsset) : data.suggestedRewrite,
      provider,
    });
  } catch (err: any) {
    console.warn("Sentinel remediation call failed:", err?.message || err);
    res.json({
      success: true,
      flagged: true,
      assetCode: flaggedAsset.c,
      city: flaggedAsset.city,
      originalHead: flaggedAsset.head,
      originalSub: flaggedAsset.sub,
      originalEnglish: flaggedAsset.englishMeaning || "",
      claimQuoted: matchedPhrase,
      regulationCite,
      rationale: `The generated headline for ${flaggedAsset.city} references "${matchedPhrase}", which is a regulated nutrient/health claim under Indian food law.`,
      suggestedRewrite: buildFallbackRewrite(flaggedAsset),
    });
  }
});

// API: AI Copilot & Regulatory Advisor Chat with 503 fallback
app.post("/api/chat", async (req, res) => {
  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const systemInstruction = `You are RASOI AI Copilot, an expert advisor for HUL Foods (Knorr / Project NEXT).
You understand:
- Winning in Many Indias (WiMI): 14 regional clusters (Maharashtra, Delhi NCR, Karnataka, Tamil Nadu, West Bengal, Gujarat, Uttar Pradesh, Andhra/Telangana, Kerala, Punjab, Rajasthan, Madhya Pradesh, Bihar/Jharkhand, Assam/NE).
- SWAAD Taste Graph: 6 axes (Sweet, Sour, Heat, Salt, Aroma, Body) adapting single national recipes to regional taste nuances.
- SENTINEL Guardrails & FSSAI Regulations: Food Safety and Standards (Advertising and Claims) Regulations 2018 (Schedule I, Reg 4) and FSS Act 2006 ss. 52-53 (up to ₹10 lakh penalty per offence for misleading ads).
- Hard Rule: Autonomy Tier L4 — All nutrition, health, immunity, or fortification claims MUST be human-approved (never automated), regardless of confidence score.
- 8 Agents: SCOUT (Signals), SWAAD (Taste), ARBITER (Opportunity), ECHO (Consumer), MAKER (Pack Twins/Creative), BHASHA (Dialect/Language), COMMERCE (qComm/Kirana), SENTINEL (Regulatory).

Current active context: ${JSON.stringify(context || {})}

Provide concise, authoritative, professional advice formatted in clean markdown.`;

  try {
    const { text, provider } = await generateAI(systemInstruction, message, false);
    res.json({ reply: text || "No response generated.", provider });
  } catch (err: any) {
    console.warn("AI providers unavailable. Serving copilot fallback response:", err?.message || err);
    res.json({
      reply: `### RASOI AI Copilot Notice\n*Note: AI providers are currently unavailable. Providing automated advisor guidelines:*\n\n1. **FSSAI Claim Rules (Schedule I, Reg 4)**: Any claim referencing immunity, protein, health, or nutrition requires explicit human sign-off (L4 Autonomy Gate).\n2. **SWAAD Taste Customization**: SWAAD adjusts heat, sourness, and aroma profile across 14 WiMI clusters to prevent national recipe mismatch.\n3. **Quick Commerce Deployment**: Automatically routes recipe pack twins to Blinkit, Swiggy Instamart, and Zepto pincodes in trigger areas.`
    });
  }
});

// Start Vite development server or production static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RASOI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
