import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { BigTriggerCard } from "./components/BigTriggerCard";
import { AssetGrid } from "./components/AssetGrid";
import { KpiBar } from "./components/KpiBar";
import { KitchenMesh } from "./components/KitchenMesh";
import { AgentOrchestration } from "./components/AgentOrchestration";
import { TasteGraphAndGuards } from "./components/TasteGraphAndGuards";
import { SentinelHoldModal } from "./components/SentinelHoldModal";
import { AgentDetailModal } from "./components/AgentDetailModal";
import { CustomTriggerModal } from "./components/CustomTriggerModal";
import { Toast } from "./components/Toast";
import { LoginPage } from "./components/LoginPage";
import { HomeDashboard } from "./components/HomeDashboard";
import { TriggerReviewModal } from "./components/TriggerReviewModal";
import { RunSummaryScreen } from "./components/RunSummaryScreen";
import { VariantPicker } from "./components/VariantPicker";

import {
  Trigger,
  AgentInfo,
  GuardrailItem,
  Asset,
  Signal,
  FlaggedClaim,
  Screen,
  TriggerRecord,
  BannerRecord,
  AppNotification,
  CreativeVariant,
  UserRole,
} from "./types";
import { CLUSTERS, AGENTS, GUARDS, ASSETS } from "./data/mockData";
import { deriveEventTheme } from "./lib/theme";
import { Code2, RefreshCw } from "lucide-react";

const SESSION_NAME_KEY = "rasoi_user_name";
const SESSION_ROLE_KEY = "rasoi_user_role";
const SESSION_ACTIVE_ROLE_KEY = "rasoi_active_role";

async function postJSON(url: string, body: unknown): Promise<any> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

const EMPTY_TRIGGER: TriggerRecord = {
  id: "",
  status: "pending",
  createdAt: "",
  updatedAt: "",
  name: "",
  meta: "",
  blurb: "",
  targetMin: 45,
  opp: "",
  scores: [],
  mesh: [],
  reach: [],
  signals: [],
  verdict: "",
  kpis: [],
  assets: ASSETS,
};

export default function App() {
  // -------------------------------------------------------------------
  // Session / navigation
  // -------------------------------------------------------------------
  const [screen, setScreen] = useState<Screen>("login");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  // Which persona the signed-in person is currently acting as — a lightweight
  // stand-in for real multi-user RBAC so the same demo user can play both
  // sides of the Brand Manager -> Regional Marketing Lead approval chain.
  const [activeRole, setActiveRole] = useState<UserRole>(
    () => (sessionStorage.getItem(SESSION_ACTIVE_ROLE_KEY) as UserRole) || "Brand Manager"
  );
  const handleSwitchRole = (role: UserRole) => {
    sessionStorage.setItem(SESSION_ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  };

  // -------------------------------------------------------------------
  // Persisted trigger queue + banners (from the SQLite-backed API)
  // -------------------------------------------------------------------
  const [triggerRecords, setTriggerRecords] = useState<TriggerRecord[]>([]);
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [currentTriggerId, setCurrentTriggerId] = useState<string | null>(null);
  const [reviewingTriggerId, setReviewingTriggerId] = useState<string | null>(null);
  const [summaryTrigger, setSummaryTrigger] = useState<TriggerRecord | null>(null);

  // Simple in-memory notification feed — new AI triggers, approvals, exports.
  // Not persisted; it's a session-scoped activity feed, not an audit log.
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const pushNotification = (message: string) => {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setNotifications((prev) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, time }, ...prev].slice(0, 20));
  };

  const refreshTriggers = async () => {
    try {
      const res = await fetch("/api/triggers");
      const data = await res.json();
      if (data.success) setTriggerRecords(data.triggers);
    } catch (err) {
      console.warn("Failed to load triggers", err);
    }
  };

  const refreshBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      if (data.success) setBanners(data.banners);
    } catch (err) {
      console.warn("Failed to load banners", err);
    }
  };

  useEffect(() => {
    const savedName = sessionStorage.getItem(SESSION_NAME_KEY);
    const savedRole = sessionStorage.getItem(SESSION_ROLE_KEY);
    if (savedName) {
      setUserName(savedName);
      setUserRole(savedRole || "Brand Manager");
      setScreen("home");
    }
    refreshTriggers();
    refreshBanners();
  }, []);

  const handleLogin = (name: string, role: string) => {
    sessionStorage.setItem(SESSION_NAME_KEY, name);
    sessionStorage.setItem(SESSION_ROLE_KEY, role);
    setUserName(name);
    setUserRole(role);
    setScreen("home");
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(SESSION_NAME_KEY);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    setUserName("");
    setScreen("login");
  };

  const handleExportCsv = () => {
    pushNotification("Banners exported to CRM (CSV)");
    window.location.href = "/api/banners/export.csv";
  };

  // -------------------------------------------------------------------
  // Run-screen state (the existing agent pipeline — unchanged mechanics,
  // now scoped to whichever trigger is currently under execution)
  // -------------------------------------------------------------------
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<string>("T+00:00");
  const [isTechnicalView, setIsTechnicalView] = useState<boolean>(false);
  const [simProgressStep, setSimProgressStep] = useState<number>(0);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [meshMetrics, setMeshMetrics] = useState<[string, string, string]>(["0", "0", "0"]);
  const [sparkPoints, setSparkPoints] = useState<number[]>([]);
  const [reachMetrics, setReachMetrics] = useState<[string, string, string, string]>(["—", "—", "—", "—"]);

  const [agentStates, setAgentStates] = useState<Record<string, "queued" | "running" | "done" | "gate">>({});
  const [agentTimes, setAgentTimes] = useState<Record<string, string>>({});
  const [occasionQuote, setOccasionQuote] = useState<string>("—");
  const [occasionScores, setOccasionScores] = useState<string[]>(["—", "—", "—"]);
  const [logs, setLogs] = useState<string[]>([]);

  const [selectedClusterIndex, setSelectedClusterIndex] = useState<number | null>(null);
  const [clusterStates, setClusterStates] = useState<Record<number, "on" | "hold">>({});
  const [verdictText, setVerdictText] = useState<string>("");
  const [guardrails, setGuardrails] = useState<GuardrailItem[]>(
    GUARDS.map((g) => ({ label: g[0], status: g[1], note: g[2] }))
  );

  const [isGateActive, setIsGateActive] = useState<boolean>(false);
  const [gateMessage, setGateMessage] = useState<string>("");
  const [flaggedClaim, setFlaggedClaim] = useState<FlaggedClaim | null>(null);
  const [liveModeStatus, setLiveModeStatus] = useState<"live" | "fallback" | null>(null);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [assetQuotes, setAssetQuotes] = useState<Record<number, string>>({});
  const [currentAssets, setCurrentAssets] = useState<Asset[]>(ASSETS);
  const [kpiTriples, setKpiTriples] = useState<Array<[string, string, string]>>([]);

  // Populated once MAKER returns multiple creative directions — the run
  // pipeline pauses here (compliance scan hasn't run yet) until the brand
  // manager picks one via handleSelectVariant.
  const [variantOptions, setVariantOptions] = useState<CreativeVariant[] | null>(null);
  const [pendingCreativeContext, setPendingCreativeContext] = useState<{
    verdict: string;
    kpis: Array<[string, string, string]>;
    providers: string[];
    anyFallback: boolean;
  } | null>(null);

  const activeTrigger: TriggerRecord =
    triggerRecords.find((t) => t.id === currentTriggerId) || EMPTY_TRIGGER;
  const targetMinutes = activeTrigger.targetMin || 47;
  const eventTheme = deriveEventTheme(`${activeTrigger.name} ${activeTrigger.blurb}`);

  const [kpiValues, setKpiValues] = useState<string[]>([
    `${targetMinutes} min`,
    "— of 14",
    "18,400+",
    "1 Sign-off",
    "₹9,400",
    "+18%",
  ]);
  const kpiLabels = [
    "Launch Speed",
    "Regional Versions",
    "Store Reach",
    "Governance",
    "Cost Efficiency",
    "Sales Impact",
  ];

  // Modals state
  const [isSentinelModalOpen, setIsSentinelModalOpen] = useState<boolean>(false);
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<AgentInfo | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Simulation timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const startTimeRef = useRef<number>(0);
  const isKilledRef = useRef<boolean>(false);
  const hasAutoStartedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => stopAllTimers();
  }, []);

  // Update panel defaults when the trigger under review changes (but not
  // right after a run completes, and not while a Sentinel claim is held for
  // review — either would clobber the live-generated results the brand
  // manager is currently looking at with the trigger's static preset data).
  useEffect(() => {
    if (!isRunning && !isCompleted && !isGateActive && currentTriggerId) {
      setSignals(activeTrigger.signals || []);
      setMeshMetrics(activeTrigger.mesh as [string, string, string] || ["8,700/min", "14 of 14", "19 active feeds"]);
      setSparkPoints([20, 35, 30, 50, 45, 70, 85, 95]);
      setReachMetrics(activeTrigger.reach as [string, string, string, string] || ["142 dark store hubs", "18,400 kiranas", "4,200 kits", "6 languages"]);
      setCurrentAssets(activeTrigger.assets || ASSETS);

      if (activeTrigger.kpis?.length) {
        setKpiValues(activeTrigger.kpis.map((k) => k[0]));
        setKpiTriples(activeTrigger.kpis);
      }
    }
  }, [currentTriggerId, isRunning, isCompleted, isGateActive]);

  // Auto-start the pipeline the moment we land on the Run screen for a trigger
  useEffect(() => {
    if (screen === "run" && currentTriggerId && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      handleRunSimulation();
    }
    if (screen !== "run") {
      hasAutoStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentTriggerId]);

  const stopAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Both of these track genuine wall-clock time since the run started — no
  // preset-driven scaling. How long a live run actually takes depends on the
  // real Gemini/Groq round trips, not a scripted target duration.
  const startClock = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const totalSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const s = String(totalSec % 60).padStart(2, "0");
      setElapsedTime(`T+${m}:${s}`);
    }, 200);
  };

  const getTS = () => {
    const totalSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `+${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  };

  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev]);
  };

  const handleAddCustomTrigger = async (key: string, newTrigger: Trigger) => {
    try {
      await fetch("/api/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: key, trigger: newTrigger }),
      });
      pushNotification(`New AI trigger detected: ${newTrigger.name}`);
    } catch (err) {
      console.warn("Failed to add custom trigger", err);
    }
    await refreshTriggers();
  };

  const handleReset = () => {
    isKilledRef.current = true;
    stopAllTimers();
    setIsRunning(false);
    setIsCompleted(false);
    setIsGateActive(false);
    setSimProgressStep(0);
    setElapsedTime("T+00:00");
    setFlaggedClaim(null);
    setLiveModeStatus(null);
    setProviderLabel(null);
    setToastMessage(null);

    setAgentStates({});
    setAgentTimes({});
    setOccasionQuote("—");
    setOccasionScores(["—", "—", "—", "—"]);
    setLogs([]);

    setSelectedClusterIndex(null);
    setClusterStates({});
    setVerdictText("");
    setGuardrails(GUARDS.map((g) => ({ label: g[0], status: g[1], note: g[2] })));
    setAssetQuotes({});
    setCurrentAssets(activeTrigger.assets || ASSETS);
    setVariantOptions(null);
    setPendingCreativeContext(null);

    if (activeTrigger.kpis?.length) {
      setKpiValues(activeTrigger.kpis.map((k) => k[0]));
      setKpiTriples(activeTrigger.kpis);
    }
  };

  // Abandon the current run and return to the dashboard
  const handleAbortToHome = () => {
    // A run in progress means an AI call is actually in flight — confirm
    // before throwing that away, since there's otherwise no way back once
    // it's gone. Once the run has finished (or hasn't started), leaving is
    // free.
    if (isRunning && !window.confirm("Leave this campaign? The current run will be cancelled and its progress lost.")) {
      return;
    }
    handleReset();
    setCurrentTriggerId(null);
    setScreen("home");
  };

  // PATCH the trigger to "approved" with its run result, then show the summary
  const finalizeTrigger = async (payload: {
    verdict: string;
    kpis: Array<[string, string, string]>;
    assets: Asset[];
    provider: string | null;
  }) => {
    if (!currentTriggerId) {
      setScreen("summary");
      return;
    }
    try {
      const res = await fetch(`/api/triggers/${currentTriggerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Cleared by the Brand Manager, but not fully live until a
          // Regional Marketing Lead signs off — see handleFinalApprove.
          status: "pending_regional_approval",
          approvedBy: userName,
          runResult: payload,
        }),
      });
      const data = await res.json();
      if (data.success && data.trigger) {
        setSummaryTrigger(data.trigger);
        setTriggerRecords((prev) => prev.map((t) => (t.id === currentTriggerId ? data.trigger : t)));
        pushNotification(`Campaign ready for regional sign-off: ${data.trigger.name}`);
      }
    } catch (err) {
      console.warn("Failed to finalize trigger", err);
    }
    refreshBanners();
    // Deliberately does NOT navigate to Summary — the brand manager stays on
    // this screen to actually look at (and optionally regenerate) the banners
    // that just got approved, instead of being whisked straight to aggregate
    // stats. They move on via the explicit "Continue to Summary" button.
  };

  const handleContinueToSummary = () => setScreen("summary");

  // Persist a regenerated banner from the run screen the same way
  // CampaignDetailModal does for a historical one — the trigger is already
  // "approved" in the DB by the time these cards are editable.
  const handleRunAssetsChange = async (updated: Asset[]) => {
    setCurrentAssets(updated);
    if (!currentTriggerId || !activeTrigger.runResult) return;
    try {
      const res = await fetch(`/api/triggers/${currentTriggerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runResult: { ...activeTrigger.runResult, assets: updated } }),
      });
      const data = await res.json();
      if (data.success && data.trigger) {
        setTriggerRecords((prev) => prev.map((t) => (t.id === currentTriggerId ? data.trigger : t)));
        setSummaryTrigger((prev) => (prev && prev.id === currentTriggerId ? data.trigger : prev));
        refreshBanners();
      }
    } catch (err) {
      console.warn("Failed to save regenerated banner", err);
    }
  };

  // Steps after the brand manager has a final asset set in hand (either
  // picked from MAKER's variants, or the single cached fallback set) — runs
  // the compliance scan and finalizes the trigger. Split out from
  // handleRunSimulation so handleSelectVariant can resume the pipeline here
  // after a pause for the variant-choice step.
  const runSentinelAndFinalize = async (
    finalAssets: Asset[],
    finalVerdict: string,
    finalKpis: Array<[string, string, string]>,
    providersUsed: Set<string>,
    anyFallback: boolean
  ) => {
    setCurrentAssets(finalAssets);

    // Step 4: SENTINEL — deterministic compliance scan + generative remediation
    setAgentStates((p) => ({ ...p, sentinel: "running" }));
    addLog("SENTINEL: Scanning generated regional creative against FSSAI Advertising & Claims Regulations 2018...");

    const sentinelRes = await postJSON("/api/pipeline/sentinel", { assets: finalAssets });
    if (isKilledRef.current) return;

    if (sentinelRes.provider) providersUsed.add(sentinelRes.provider);
    const finalProviderLabel = providersUsed.size
      ? Array.from(providersUsed)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" + ")
      : null;
    setLiveModeStatus(anyFallback ? "fallback" : "live");
    setProviderLabel(finalProviderLabel);

    if (sentinelRes.success && sentinelRes.flagged) {
      const claim: FlaggedClaim = {
        assetCode: sentinelRes.assetCode,
        city: sentinelRes.city,
        originalHead: sentinelRes.originalHead,
        originalSub: sentinelRes.originalSub,
        originalEnglish: sentinelRes.originalEnglish,
        claimQuoted: sentinelRes.claimQuoted,
        regulationCite: sentinelRes.regulationCite,
        rationale: sentinelRes.rationale,
        suggestedRewrite: sentinelRes.suggestedRewrite,
      };
      setFlaggedClaim(claim);
      setCurrentAssets((prev) =>
        prev.map((a) => (a.c === claim.assetCode ? { ...a, held: 1 } : a))
      );
      setAgentStates((p) => ({ ...p, sentinel: "gate" }));
      setIsRunning(false);
      setIsGateActive(true);
      setGateMessage(
        `${claim.city} ad held — flagged claim requires brand manager sign-off under FSSAI 2018 regulations.`
      );
      addLog(`SENTINEL: Flagged unverified claim ("${claim.claimQuoted}") on ${claim.city} asset. Quarantined for brand review.`);
      setIsSentinelModalOpen(true);
    } else {
      addLog("SENTINEL: No regulated claims detected across generated assets. All versions cleared for launch.");
      setAgentStates((p) => ({ ...p, sentinel: "done" }));
      setAgentTimes((p) => ({ ...p, sentinel: getTS() }));

      const newClusterStates: Record<number, "on" | "hold"> = {};
      CLUSTERS.forEach((_, idx) => {
        newClusterStates[idx] = "on";
      });
      setClusterStates(newClusterStates);

      setIsRunning(false);
      setIsCompleted(true);
      setSimProgressStep(4);
      if (timerRef.current) clearInterval(timerRef.current);

      finalizeTrigger({
        verdict: finalVerdict,
        kpis: finalKpis,
        assets: finalAssets,
        provider: finalProviderLabel,
      });
    }
  };

  // Brand manager picks one of MAKER's proposed creative directions — resumes
  // the paused pipeline straight into the compliance scan.
  const handleSelectVariant = (variant: CreativeVariant) => {
    if (!pendingCreativeContext) return;
    const { verdict, kpis, providers, anyFallback } = pendingCreativeContext;
    setVariantOptions(null);
    setPendingCreativeContext(null);
    addLog(`BRAND MANAGER: Selected "${variant.angle}" creative direction — proceeding to compliance scan.`);
    runSentinelAndFinalize(variant.assets, verdict, kpis, new Set(providers), anyFallback);
  };

  const handleRunSimulation = async () => {
    handleReset();
    isKilledRef.current = false;
    setIsRunning(true);
    setIsCompleted(false);
    setSimProgressStep(1);
    startClock();

    const eventDescription = activeTrigger.blurb || activeTrigger.name;
    const region = activeTrigger.affectedRegions?.join(", ") || "India";
    let anyFallback = false;
    const providersUsed = new Set<string>();

    const notifyFallback = () => {
      if (!anyFallback) {
        setToastMessage("Live AI temporarily unavailable — continuing with cached data for this step.");
        setTimeout(() => setToastMessage(null), 5000);
      }
      anyFallback = true;
    };

    // Step 1: SCOUT (live signal ingestion)
    setAgentStates((p) => ({ ...p, scout: "running" }));
    addLog("SCOUT: Ingesting live signal streams across IMD, quick-commerce & Search Trends");
    setSimProgressStep(1);

    const scoutRes = await postJSON("/api/pipeline/scout", { eventDescription, region });
    if (isKilledRef.current) return;

    const liveSignals: Signal[] | undefined = scoutRes.success ? scoutRes.data?.signals : undefined;
    const liveMesh: [string, string, string] | undefined = scoutRes.success ? scoutRes.data?.mesh : undefined;
    const liveReach: [string, string, string, string] | undefined = scoutRes.success ? scoutRes.data?.reach : undefined;
    const affectedClusters: string[] | undefined = scoutRes.success ? scoutRes.data?.affectedClusters : undefined;

    if (liveSignals?.length) {
      setSignals(liveSignals);
      setMeshMetrics(liveMesh || (activeTrigger.mesh as [string, string, string]));
      setReachMetrics(liveReach || (activeTrigger.reach as [string, string, string, string]));
      if (scoutRes.provider) providersUsed.add(scoutRes.provider);
      addLog(`SCOUT: Identified anomaly "${activeTrigger.name}". Triggering SWAAD & ARBITER.`);
    } else {
      notifyFallback();
      setSignals(activeTrigger.signals || []);
      setMeshMetrics(activeTrigger.mesh as [string, string, string]);
      setReachMetrics(activeTrigger.reach as [string, string, string, string]);
      addLog("SCOUT: Live signal feed unavailable — using cached demand baseline.");
    }
    setAgentStates((p) => ({ ...p, scout: "done" }));
    setAgentTimes((p) => ({ ...p, scout: getTS() }));

    // Step 2: SWAAD & ARBITER (taste rationale & commercial opportunity)
    setAgentStates((p) => ({ ...p, swaad: "running", arbiter: "running" }));
    setSimProgressStep(2);

    const oppRes = await postJSON("/api/pipeline/opportunity", {
      eventDescription,
      region,
      signals: liveSignals || activeTrigger.signals,
      // Anchors ARBITER's scores to what the brand manager already saw and
      // acted on when reviewing this trigger, instead of an independent
      // fresh guess that could silently contradict it.
      marketLift: activeTrigger.marketLift,
    });
    if (isKilledRef.current) return;

    const liveOpp: string | undefined = oppRes.success ? oppRes.data?.opp : undefined;
    const liveScores: string[] | undefined = oppRes.success ? oppRes.data?.scores : undefined;

    if (liveOpp) {
      setOccasionQuote(liveOpp);
      setOccasionScores(liveScores || activeTrigger.scores || ["94%", "96%", "Low Risk"]);
      if (oppRes.provider) providersUsed.add(oppRes.provider);
      addLog("ARBITER: Quantified meal-occasion value and stock cover across 18,400 outlets.");
    } else {
      notifyFallback();
      setOccasionQuote(activeTrigger.opp || "Regional demand opportunity quantified.");
      setOccasionScores(activeTrigger.scores || ["94%", "96%", "Low Risk"]);
      addLog("ARBITER: Live scoring unavailable — using cached opportunity baseline.");
    }
    setAgentStates((p) => ({ ...p, arbiter: "done" }));
    setAgentTimes((p) => ({ ...p, arbiter: getTS() }));
    addLog("SWAAD: Resolved national recipe into regional taste profiles for the affected clusters.");
    setAgentStates((p) => ({ ...p, swaad: "done" }));
    setAgentTimes((p) => ({ ...p, swaad: getTS() }));

    // Step 3: ECHO, MAKER, BHASHA, COMMERCE (verdict + regional creative + reach)
    setAgentStates((p) => ({
      ...p,
      echo: "running",
      maker: "running",
      bhasha: "running",
      commerce: "running",
    }));
    setSimProgressStep(3);

    const creativeRes = await postJSON("/api/pipeline/creative", {
      eventDescription,
      region,
      opp: liveOpp,
      scores: liveScores,
      affectedClusters,
      // Same anchor as the opportunity call — the "Predicted Sales Lift" KPI
      // generated below ends up as the run's expectedBenefit.salesLift, so it
      // must stay consistent with the number shown when this trigger was
      // reviewed, not silently diverge into an unrelated figure.
      marketLift: activeTrigger.marketLift,
      // 2 rather than 3 — still satisfies "2-3 options," but keeps the JSON
      // response small enough that Groq's fallback reliably produces valid
      // JSON for it (a 3-variant response was measurably more likely to
      // come back malformed under load).
      variantCount: 2,
    });
    if (isKilledRef.current) return;

    const liveVariants: CreativeVariant[] | undefined = creativeRes.success ? creativeRes.data?.variants : undefined;
    const liveVerdict: string | undefined = creativeRes.success ? creativeRes.data?.verdict : undefined;
    const liveKpis: Array<[string, string, string]> | undefined = creativeRes.success ? creativeRes.data?.kpis : undefined;

    const usableVariants =
      Array.isArray(liveVariants) && liveVariants.length > 1 && liveVariants.every((v) => v.assets?.length)
        ? liveVariants
        : null;

    if (usableVariants) {
      if (creativeRes.provider) providersUsed.add(creativeRes.provider);
      const finalVerdict = liveVerdict || "High predicted category offtake across target geographies.";
      const finalKpis = liveKpis || activeTrigger.kpis || [];
      setVerdictText(finalVerdict);
      setKpiValues(finalKpis.map((k) => k[0]));
      setKpiTriples(finalKpis);
      addLog("ECHO & BHASHA: Consumer reactions simulated & regional copy localized live.");
      addLog(`MAKER & COMMERCE: ${usableVariants.length} regional creative directions rendered — awaiting brand manager pick.`);
      setShowAssets(true);
      // Stays at 3/4 — creative is written, but compliance (step 4) hasn't
      // run yet and won't until the brand manager picks a direction.
      setAgentStates((p) => ({ ...p, echo: "done", bhasha: "done", maker: "gate", commerce: "done" }));
      setAgentTimes((p) => ({ ...p, echo: getTS(), bhasha: getTS(), commerce: getTS() }));

      setVariantOptions(usableVariants);
      setPendingCreativeContext({
        verdict: finalVerdict,
        kpis: finalKpis,
        providers: Array.from(providersUsed),
        anyFallback,
      });
      // Pipeline pauses here — handleSelectVariant resumes it with the
      // compliance scan once the brand manager picks a direction.
      return;
    }

    notifyFallback();
    const finalAssets = activeTrigger.assets || ASSETS;
    const finalVerdict = activeTrigger.verdict || "High predicted category offtake across target geographies.";
    const finalKpis = activeTrigger.kpis || [];
    setVerdictText(finalVerdict);
    setCurrentAssets(finalAssets);
    if (finalKpis.length) {
      setKpiValues(finalKpis.map((k) => k[0]));
      setKpiTriples(finalKpis);
    }
    addLog("MAKER: Live creative generation unavailable — using cached regional assets.");
    setShowAssets(true);
    // Stays at 3/4 until runSentinelAndFinalize's compliance check actually clears.
    setAgentStates((p) => ({ ...p, echo: "done", bhasha: "done", maker: "done", commerce: "done" }));
    setAgentTimes((p) => ({ ...p, echo: getTS(), bhasha: getTS(), maker: getTS(), commerce: getTS() }));

    await runSentinelAndFinalize(finalAssets, finalVerdict, finalKpis, providersUsed, anyFallback);
  };

  // Brand Manager resolves the held claim
  const handleApproveWithSuggestedEdit = () => {
    setIsGateActive(false);
    setIsSentinelModalOpen(false);

    let updatedAssets = currentAssets;
    if (flaggedClaim) {
      updatedAssets = currentAssets.map((a) => {
        if (a.c === flaggedClaim.assetCode) {
          return {
            ...a,
            head: flaggedClaim.suggestedRewrite.head,
            sub: flaggedClaim.suggestedRewrite.sub,
            badge: "Live · 100% FSSAI Compliant",
            englishMeaning: flaggedClaim.suggestedRewrite.englishMeaning,
            held: 0,
          };
        }
        return a;
      });
      setCurrentAssets(updatedAssets);
    }

    setAgentStates((p) => ({ ...p, sentinel: "done" }));
    setAgentTimes((p) => ({ ...p, sentinel: getTS() }));
    addLog(`BRAND MANAGER APPROVED (SUGGESTED EDIT): ${flaggedClaim?.city || "Flagged"} ad updated with compliant copy. All regional versions live!`);

    const newClusterStates: Record<number, "on" | "hold"> = {};
    CLUSTERS.forEach((_, idx) => {
      newClusterStates[idx] = "on";
    });
    setClusterStates(newClusterStates);

    if (activeTrigger.kpis?.length) {
      setKpiValues(activeTrigger.kpis.map((k) => k[0]));
    }

    setIsRunning(false);
    setIsCompleted(true);
    setSimProgressStep(4);
    if (timerRef.current) clearInterval(timerRef.current);

    finalizeTrigger({ verdict: verdictText, kpis: kpiTriples, assets: updatedAssets, provider: providerLabel });
  };

  const handleApproveOriginalOverride = () => {
    setIsGateActive(false);
    setIsSentinelModalOpen(false);

    setAgentStates((p) => ({ ...p, sentinel: "done" }));
    setAgentTimes((p) => ({ ...p, sentinel: getTS() }));
    addLog(`BRAND MANAGER OVERRIDE: Submitted ${flaggedClaim?.city || "flagged"} original copy to HUL Regulatory dossier. Remaining versions live!`);

    setIsRunning(false);
    setIsCompleted(true);
    setSimProgressStep(4);
    if (timerRef.current) clearInterval(timerRef.current);

    finalizeTrigger({ verdict: verdictText, kpis: kpiTriples, assets: currentAssets, provider: providerLabel });
  };

  const handleRejectAd = () => {
    setIsGateActive(false);
    setIsSentinelModalOpen(false);

    setAgentStates((p) => ({ ...p, sentinel: "done" }));
    setAgentTimes((p) => ({ ...p, sentinel: getTS() }));
    addLog(`BRAND MANAGER REJECTED ${flaggedClaim?.city?.toUpperCase() || "FLAGGED"} AD: Remaining regional versions deployed live without that creative.`);

    setIsRunning(false);
    setIsCompleted(true);
    setSimProgressStep(4);
    if (timerRef.current) clearInterval(timerRef.current);

    finalizeTrigger({ verdict: verdictText, kpis: kpiTriples, assets: currentAssets, provider: providerLabel });
  };

  // -------------------------------------------------------------------
  // Home / Review handlers
  // -------------------------------------------------------------------
  const handleReviewTrigger = (id: string) => setReviewingTriggerId(id);
  const reviewingTrigger = triggerRecords.find((t) => t.id === reviewingTriggerId) || null;

  const patchTriggerStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/triggers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn("Failed to update trigger status", err);
    }
    await refreshTriggers();
  };

  const handleProceed = () => {
    if (!reviewingTriggerId) return;
    setCurrentTriggerId(reviewingTriggerId);
    setReviewingTriggerId(null);
    setScreen("run");
  };

  const handleSaveForLater = async () => {
    if (!reviewingTriggerId) return;
    await patchTriggerStatus(reviewingTriggerId, "saved");
    setReviewingTriggerId(null);
  };

  const handleCancelTrigger = async () => {
    if (!reviewingTriggerId) return;
    await patchTriggerStatus(reviewingTriggerId, "cancelled");
    setReviewingTriggerId(null);
    setToastMessage("Trigger cancelled — moved to history.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Second half of the approval chain — a Regional Marketing Lead either
  // signs the campaign off (goes fully live, counted in History/KPIs) or
  // sends it back (rejected, same as a Sentinel-held claim being rejected).
  const handleFinalApprove = async (id: string) => {
    const trigger = triggerRecords.find((t) => t.id === id);
    await patchTriggerStatus(id, "approved");
    await refreshBanners();
    pushNotification(`Regional sign-off complete: ${trigger?.name || "Campaign"} is now live.`);
  };

  const handleSendBack = async (id: string) => {
    const trigger = triggerRecords.find((t) => t.id === id);
    await patchTriggerStatus(id, "cancelled");
    pushNotification(`Sent back by Regional Marketing Lead: ${trigger?.name || "Campaign"}.`);
  };

  const handleBackToHomeFromSummary = () => {
    setCurrentTriggerId(null);
    setSummaryTrigger(null);
    refreshTriggers();
    refreshBanners();
    setScreen("home");
  };

  // -------------------------------------------------------------------
  // Screen: LOGIN
  // -------------------------------------------------------------------
  if (screen === "login") {
    return <LoginPage onEnter={handleLogin} />;
  }

  // -------------------------------------------------------------------
  // Screen: HOME
  // -------------------------------------------------------------------
  if (screen === "home") {
    return (
      <>
        <HomeDashboard
          userName={userName}
          triggers={triggerRecords}
          banners={banners}
          onReviewTrigger={handleReviewTrigger}
          onOpenCustomModal={() => setIsCustomModalOpen(true)}
          onExportCsv={handleExportCsv}
          onSignOut={handleSignOut}
          onTriggersRefresh={refreshTriggers}
          notifications={notifications}
          onNotify={pushNotification}
          activeRole={activeRole}
          onSwitchRole={handleSwitchRole}
          onFinalApprove={handleFinalApprove}
          onSendBack={handleSendBack}
        />
        <TriggerReviewModal
          trigger={reviewingTrigger}
          onClose={() => setReviewingTriggerId(null)}
          onProceed={handleProceed}
          onSaveForLater={handleSaveForLater}
          onCancel={handleCancelTrigger}
        />
        <CustomTriggerModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onAddTrigger={handleAddCustomTrigger}
        />
        <Toast message={toastMessage} />
      </>
    );
  }

  // -------------------------------------------------------------------
  // Screen: SUMMARY
  // -------------------------------------------------------------------
  if (screen === "summary") {
    return (
      <RunSummaryScreen trigger={summaryTrigger || activeTrigger} onBackToHome={handleBackToHomeFromSummary} />
    );
  }

  // -------------------------------------------------------------------
  // Screen: RUN (today's existing agent-pipeline experience)
  // -------------------------------------------------------------------
  return (
    <div
      id="knorr-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-7 font-sans selection:bg-orange-500 selection:text-slate-950"
    >
      <div id="knorr-app-shell" className="max-w-7xl mx-auto flex flex-col min-h-screen">
        <Header
          elapsedTime={elapsedTime}
          isTechnicalView={isTechnicalView}
          onToggleTechnicalView={() => setIsTechnicalView(!isTechnicalView)}
          onReset={handleAbortToHome}
        />

        {!isTechnicalView && (
          <div id="brand-manager-view-container">
            <BigTriggerCard
              activeTrigger={activeTrigger}
              isRunning={isRunning}
              isCompleted={isCompleted}
              isGateActive={isGateActive}
              onApproveAndGenerate={handleRunSimulation}
              onContinueToSummary={handleContinueToSummary}
              onOpenGateModal={() => setIsSentinelModalOpen(true)}
              simProgressStep={simProgressStep}
              awaitingApproval={!!variantOptions}
              occasionQuote={occasionQuote}
              occasionScores={occasionScores}
              flaggedClaim={flaggedClaim}
              liveModeStatus={liveModeStatus}
              providerLabel={providerLabel}
            />

            {variantOptions ? (
              <VariantPicker variants={variantOptions} eventTheme={eventTheme} onSelect={handleSelectVariant} />
            ) : isRunning ? (
              <div className="border border-slate-800 rounded-3xl bg-slate-900/40 p-10 flex flex-col items-center justify-center gap-3 text-center mb-6">
                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                <div className="text-sm font-bold text-white">Generating regional banners...</div>
                <div className="text-xs text-slate-400 max-w-sm">
                  Writing localized ad copy for each affected region — this'll only take a moment.
                </div>
              </div>
            ) : (
              <AssetGrid
                assets={currentAssets}
                showAssets={showAssets}
                assetQuotes={assetQuotes}
                onInspectHeldAsset={() => setIsSentinelModalOpen(true)}
                eventTheme={eventTheme}
                editable={isCompleted}
                eventContext={`${activeTrigger.name} — ${activeTrigger.blurb}`}
                onAssetsChange={handleRunAssetsChange}
              />
            )}

            <KpiBar kpiValues={kpiValues} kpiLabels={kpiLabels} />
          </div>
        )}

        {isTechnicalView && (
          <div id="technical-detail-view-container">
            <div className="mb-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>
                  Viewing Technical Architecture: LangGraph 8-Agent Mesh, Real-Time Signal Stream & FSSAI Governance Logs.
                </span>
              </div>
              <button
                onClick={() => setIsTechnicalView(false)}
                className="py-1 px-3 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
              >
                Back to Brand Dashboard
              </button>
            </div>

            <main id="technical-bento-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 mb-4">
              <KitchenMesh
                signals={signals}
                meshMetrics={meshMetrics}
                sparkPoints={sparkPoints}
                reachMetrics={reachMetrics}
              />

              <AgentOrchestration
                agents={AGENTS}
                agentStates={agentStates}
                agentTimes={agentTimes}
                occasionQuote={occasionQuote}
                occasionScores={occasionScores}
                logs={logs}
                onSelectAgent={(agent) => setSelectedAgentForModal(agent)}
              />

              <TasteGraphAndGuards
                clusters={CLUSTERS}
                selectedClusterIndex={selectedClusterIndex}
                clusterStates={clusterStates}
                verdictText={verdictText}
                guardrails={guardrails}
                isGateActive={isGateActive}
                gateMessage={gateMessage}
                onSelectCluster={(i) => setSelectedClusterIndex(i)}
                onApproveGate={handleApproveWithSuggestedEdit}
                onHoldGate={handleRejectAd}
                onOpenClaimModal={() => setIsSentinelModalOpen(true)}
              />
            </main>

            {variantOptions ? (
              <VariantPicker variants={variantOptions} eventTheme={eventTheme} onSelect={handleSelectVariant} />
            ) : isRunning ? (
              <div className="border border-slate-800 rounded-3xl bg-slate-900/40 p-10 flex flex-col items-center justify-center gap-3 text-center mb-6">
                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                <div className="text-sm font-bold text-white">Generating regional banners...</div>
              </div>
            ) : (
              <AssetGrid
                assets={currentAssets}
                showAssets={showAssets}
                assetQuotes={assetQuotes}
                onInspectHeldAsset={() => setIsSentinelModalOpen(true)}
                eventTheme={eventTheme}
                editable={isCompleted}
                eventContext={`${activeTrigger.name} — ${activeTrigger.blurb}`}
                onAssetsChange={handleRunAssetsChange}
              />
            )}
            <KpiBar kpiValues={kpiValues} kpiLabels={kpiLabels} />
          </div>
        )}

        <footer className="foot flex gap-3.5 items-center mt-6 text-[10px] text-slate-400 flex-wrap leading-relaxed border-t border-slate-800/80 pt-4">
          <div>
            <b className="text-slate-300">Winning In Many Indias (WiMI):</b> Tailoring 1 national culinary recipe into 14 distinct Indian taste palates across 18,400+ stores.
            &nbsp;·&nbsp; <b className="text-slate-300">Food Safety Mandate:</b> Every health, nutrition, or immunity claim requires human sign-off under FSSAI Section 53.
            &nbsp;·&nbsp; <b className="text-slate-300">Omnichannel Deployment:</b> Blinkit, Zepto, Swiggy Instamart, and 136,000+ Shakti rural entrepreneurs.
          </div>
        </footer>
      </div>

      <SentinelHoldModal
        isOpen={isSentinelModalOpen}
        onClose={() => setIsSentinelModalOpen(false)}
        onApproveWithEdit={handleApproveWithSuggestedEdit}
        onApproveOriginalOverride={handleApproveOriginalOverride}
        onRejectAd={handleRejectAd}
        flaggedClaim={flaggedClaim}
      />

      <AgentDetailModal agent={selectedAgentForModal} onClose={() => setSelectedAgentForModal(null)} />

      <Toast message={toastMessage} />
    </div>
  );
}
