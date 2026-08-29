import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Flame,
  Bookmark,
  Clock3,
  Download,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Store,
  ShoppingCart,
  LogOut,
  Radar,
  Loader2,
  PiggyBank,
  ChevronRight,
  Bell,
  ListChecks,
  RotateCcw,
  UserCog,
  ShieldCheck,
  FileBarChart2,
} from "lucide-react";
import { TriggerRecord, BannerRecord, Asset, Cluster, AppNotification, UserRole } from "../types";
import { CLUSTERS, TRIGGERS as PRESET_TRIGGERS } from "../data/mockData";
import { TickingStat } from "./TickingStat";
import { TasteRadarChart } from "./TasteRadarChart";
import { CampaignDetailModal } from "./CampaignDetailModal";
import { AssetGrid } from "./AssetGrid";
import { RoiReportModal } from "./RoiReportModal";
import { TasteProfileModal } from "./TasteProfileModal";
import { deriveEventTheme } from "../lib/theme";

interface HomeDashboardProps {
  userName: string;
  triggers: TriggerRecord[];
  banners: BannerRecord[];
  onReviewTrigger: (id: string) => void;
  onOpenCustomModal: () => void;
  onExportCsv: () => void;
  onSignOut: () => void;
  onTriggersRefresh: () => Promise<void> | void;
  notifications: AppNotification[];
  onNotify: (message: string) => void;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onFinalApprove: (id: string) => void;
  onSendBack: (id: string) => void;
}

// The 6 seeded scenario topics vs. anything the AI originated on its own
// (a Scan result or a brand-manager-proposed custom event) — kept as two
// separate queues on Home rather than one mixed list.
const PRESET_ID_LIST = Object.keys(PRESET_TRIGGERS);
const PRESET_IDS = new Set(PRESET_ID_LIST);
// A restocked preset gets a fresh id like "cold_reset_<timestamp>_<n>" (see
// /api/demo/reset) so the original approved/cancelled row can stay in
// History untouched — this still needs to read as "Cold wave", not an
// AI-originated trigger, so match the prefix too.
const isPresetId = (id: string) => PRESET_IDS.has(id) || PRESET_ID_LIST.some((base) => id.startsWith(`${base}_reset_`));

const METRO_CLUSTER_CODES = ["DL", "MH", "KA", "TN", "WB"];
const AGENCY_BASELINE_PER_CAMPAIGN = 1_200_000; // ₹12L — the agency-cost baseline quoted throughout the app's KPIs

function parseRupees(str: string): number {
  const cleaned = str.replace(/[₹,\s]/g, "");
  const crMatch = cleaned.match(/^([\d.]+)cr$/i);
  if (crMatch) return parseFloat(crMatch[1]) * 1e7;
  const lMatch = cleaned.match(/^([\d.]+)l$/i);
  if (lMatch) return parseFloat(lMatch[1]) * 1e5;
  return parseFloat(cleaned) || 0;
}

function parsePercent(str: string): number {
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function formatInrCompact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function bannerToAsset(b: BannerRecord): Asset {
  return {
    c: b.clusterCode,
    city: b.city,
    lang: b.lang,
    fmt: b.fmt,
    head: b.head,
    sub: b.sub,
    bg1: "",
    bg2: "",
    badge: b.badge,
    q: "₹ 55",
    held: b.held,
    englishMeaning: b.englishMeaning,
  };
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userName,
  triggers,
  banners,
  onReviewTrigger,
  onOpenCustomModal,
  onExportCsv,
  onSignOut,
  onTriggersRefresh,
  notifications,
  onNotify,
  activeRole,
  onSwitchRole,
  onFinalApprove,
  onSendBack,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [detailTrigger, setDetailTrigger] = useState<TriggerRecord | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showRoiReport, setShowRoiReport] = useState(false);
  const [signingOffId, setSigningOffId] = useState<string | null>(null);
  const [tasteModalCluster, setTasteModalCluster] = useState<Cluster | null>(null);

  const pending = triggers.filter((t) => t.status === "pending");
  const presetPending = pending.filter((t) => isPresetId(t.id));
  const aiPending = pending.filter((t) => !isPresetId(t.id));
  const saved = triggers.filter((t) => t.status === "saved");
  const awaitingRegionalApproval = triggers
    .filter((t) => t.status === "pending_regional_approval")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const history = triggers
    .filter((t) => t.status === "approved" || t.status === "cancelled")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const totalOrders = banners.reduce((sum, b) => sum + (b.orderCount || 0), 0);

  const { totalCostSavings, avgSalesLift } = useMemo(() => {
    const approved = triggers.filter((t) => t.status === "approved");
    const savings = approved.reduce((sum, t) => {
      const kpis = t.runResult?.kpis || t.kpis || [];
      const computeCostKpi = kpis.find((k) => /compute cost/i.test(k[1] || ""));
      const actualCost = computeCostKpi ? parseRupees(computeCostKpi[0]) : 0;
      return sum + Math.max(0, AGENCY_BASELINE_PER_CAMPAIGN - actualCost);
    }, 0);
    // Excludes non-numeric ("—") and implausible outlier values (a single FMCG
    // campaign realistically lifts category sales well under 60%) so one
    // malformed historical record can't blow up the whole average.
    const lifts = approved
      .map((t) => (t.expectedBenefit ? parsePercent(t.expectedBenefit.salesLift) : null))
      .filter((v): v is number => v !== null && v > 0 && v <= 60);
    const avg = lifts.length > 0 ? lifts.reduce((s, v) => s + v, 0) / lifts.length : 0;
    return { totalCostSavings: savings, avgSalesLift: avg };
  }, [triggers]);

  // Recent Banners groups, in the order the API already returns them (most
  // recently approved trigger first) — capped to just the latest campaign so
  // Home stays short; every older campaign is one click away via History.
  const recentGroups = useMemo(() => {
    const order: string[] = [];
    const byTrigger: Record<string, BannerRecord[]> = {};
    for (const b of banners) {
      if (!byTrigger[b.triggerId]) {
        byTrigger[b.triggerId] = [];
        order.push(b.triggerId);
      }
      byTrigger[b.triggerId].push(b);
    }
    return order.slice(0, 1).map((triggerId) => ({
      triggerId,
      triggerName: byTrigger[triggerId][0].triggerName,
      assets: byTrigger[triggerId].map(bannerToAsset),
    }));
  }, [banners]);

  const handleScan = async () => {
    setIsScanning(true);
    setScanError("");
    try {
      const res = await fetch("/api/triggers/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Scan failed.");
      }
      onNotify(`New AI trigger detected: ${data.trigger?.name || "Untitled opportunity"}`);
      await onTriggersRefresh();
    } catch (err: any) {
      setScanError(err.message || "Could not scan for new opportunities.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetDemo = async () => {
    if (
      !window.confirm(
        "Reset demo data? This restocks all 6 predefined events and trims History down to the most recent 10 entries. Custom and scanned triggers are left untouched. This cannot be undone."
      )
    ) {
      return;
    }
    setIsResettingDemo(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.warn("Failed to reset demo data", err);
      setIsResettingDemo(false);
    }
  };

  const handleFinalApproveClick = async (id: string) => {
    setSigningOffId(id);
    try {
      await onFinalApprove(id);
    } finally {
      setSigningOffId(null);
    }
  };

  const handleSendBackClick = async (id: string) => {
    if (!window.confirm("Send this campaign back? It'll be marked cancelled and the brand manager will need to re-run it.")) {
      return;
    }
    setSigningOffId(id);
    try {
      await onSendBack(id);
    } finally {
      setSigningOffId(null);
    }
  };

  const visibleClusters: Cluster[] = showAllRegions
    ? CLUSTERS
    : CLUSTERS.filter((c) => METRO_CLUSTER_CODES.includes(c.c));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-7 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/30">
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none">
                KNORR <span className="text-orange-400 font-light">Demand Engine</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-1">
                Welcome back, <span className="text-slate-200 font-medium">{userName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-2xl z-50 p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-6">No notifications yet.</div>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start gap-2 px-2 py-2 rounded-xl hover:bg-slate-800/60 text-xs"
                          >
                            <span className="text-slate-200 flex-1 leading-snug">{n.message}</span>
                            <span className="text-slate-500 text-[10px] shrink-0 font-mono">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowRoiReport(true)}
              title="CFO-facing report of agency cost avoided across every approved campaign"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <FileBarChart2 className="w-3.5 h-3.5" />
              ROI Report
            </button>

            <div className="relative">
              <button
                onClick={() => setShowRoleMenu((v) => !v)}
                title="Switch persona to simulate the two-step approval chain"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5" />
                Acting as: <span className="text-slate-200">{activeRole}</span>
              </button>
              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute right-0 top-11 w-56 border border-slate-800 rounded-2xl bg-slate-900 shadow-2xl z-50 p-1.5">
                    {(["Brand Manager", "Regional Marketing Lead"] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          onSwitchRole(role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          role === activeRole
                            ? "bg-orange-500/15 text-orange-300"
                            : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleResetDemo}
              disabled={isResettingDemo}
              title="Reset Demo Data — restocks the 6 predefined events and trims History to the most recent 10 — leaves custom/scanned triggers untouched"
              aria-label="Reset Demo Data"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResettingDemo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-7">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Triggers Detected
            </div>
            <b className="text-2xl font-extrabold text-white">{triggers.length}</b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Campaigns Live
            </div>
            <b className="text-2xl font-extrabold text-emerald-400">
              {triggers.filter((t) => t.status === "approved").length}
            </b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-sky-400" />
              Banners Across Regions
            </div>
            <b className="text-2xl font-extrabold text-sky-400">{banners.length}</b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              Simulated Orders
            </div>
            <b className="text-2xl font-extrabold text-amber-400">
              <TickingStat value={totalOrders} />
            </b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
              Cost Savings vs Agency
            </div>
            <b className="text-2xl font-extrabold text-emerald-400">
              <TickingStat value={totalCostSavings} formatter={formatInrCompact} />
            </b>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              Avg. Sales Lift
            </div>
            <b className="text-2xl font-extrabold text-orange-400">
              <TickingStat value={Math.round(avgSalesLift * 10)} formatter={(n) => `+${(n / 10).toFixed(1)}%`} />
            </b>
          </div>
        </div>

        {/* Main content: opportunities/taste explorer on the left, History pinned to the right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Awaiting Regional Sign-Off — second step of the approval chain.
                A Brand Manager's completed run lands here; it isn't fully
                live (or counted in KPIs/History) until a Regional Marketing
                Lead signs off. */}
            {/* Awaiting Regional Sign-Off is the Lead's primary section, so it
                always renders (with an empty state) for that role; the Brand
                Manager only sees it when there's actually something pending. */}
            {(activeRole === "Regional Marketing Lead" || awaitingRegionalApproval.length > 0) && (
              <section>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Awaiting Regional Sign-Off ({awaitingRegionalApproval.length})
                </h2>
                {awaitingRegionalApproval.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
                    No campaigns awaiting your sign-off right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {awaitingRegionalApproval.map((t) => (
                      <RegionalApprovalRow
                        key={t.id}
                        trigger={t}
                        canAct={activeRole === "Regional Marketing Lead"}
                        isBusy={signingOffId === t.id}
                        onView={() => setDetailTrigger(t)}
                        onApprove={() => handleFinalApproveClick(t.id)}
                        onSendBack={() => handleSendBackClick(t.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Everything below initiates or reviews NEW triggers — a Regional
                Marketing Lead's job here is only to sign off on campaigns
                already generated, not to originate them. */}
            {activeRole === "Brand Manager" && (
              <>
                {/* Predefined Events — the 6 seeded scenario topics */}
                <section>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 text-slate-400" />
                    Predefined Events
                  </h2>

                  {presetPending.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
                      All predefined events have been reviewed — see History below.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {presetPending.map((t) => (
                        <TriggerRow key={t.id} trigger={t} onReview={() => onReviewTrigger(t.id)} />
                      ))}
                    </div>
                  )}
                </section>

                {/* New AI Event Triggers — anything the AI originated itself, via Scan or a custom proposal */}
                <section>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      New AI Event Triggers
                    </h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isScanning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Radar className="w-3.5 h-3.5" />
                        )}
                        Scan
                      </button>
                      <button
                        onClick={onOpenCustomModal}
                        className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Propose Custom Event
                      </button>
                    </div>
                  </div>

                  {scanError && (
                    <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl mb-3">
                      {scanError}
                    </div>
                  )}

                  {aiPending.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
                      No AI-originated opportunities right now — scan for one or propose a custom event.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiPending.map((t) => (
                        <TriggerRow key={t.id} trigger={t} onReview={() => onReviewTrigger(t.id)} />
                      ))}
                    </div>
                  )}
                </section>

                {/* Saved for Later */}
                {saved.length > 0 && (
                  <section>
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2 mb-3">
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      Saved for Later
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {saved.map((t) => (
                        <TriggerRow key={t.id} trigger={t} onReview={() => onReviewTrigger(t.id)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Taste Profile Explorer */}
                <section>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-wide">
                      Taste Profile Explorer · SWAAD
                    </h2>
                    <button
                      onClick={() => setShowAllRegions((v) => !v)}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      {showAllRegions ? "Show metro cities only" : `Show all ${CLUSTERS.length} regions →`}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {visibleClusters.map((c) => (
                      <button
                        key={c.c}
                        onClick={() => setTasteModalCluster(c)}
                        className="border border-slate-800/90 rounded-xl bg-slate-900/60 p-1.5 flex flex-col items-center text-center hover:border-orange-500/40 hover:bg-slate-900 transition-colors cursor-pointer"
                      >
                        <TasteRadarChart cluster={c} className="w-[76px] h-[70px]" />
                        <div className="text-[10px] font-bold text-white mt-0.5 leading-tight">{c.n}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Right column: History, pinned so it stays visible while the left column scrolls */}
          {history.length > 0 && (
            <section className="lg:sticky lg:top-5 border border-slate-800/80 rounded-2xl bg-slate-900/40 p-4">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2 mb-3">
                <Clock3 className="w-4 h-4" />
                History ({history.length})
              </h2>
              <div className={`space-y-2 ${showAllHistory ? "max-h-[560px] overflow-y-auto pr-1" : ""}`}>
                {(showAllHistory ? history : history.slice(0, 5)).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTrigger(t)}
                    className="w-full flex items-center justify-between gap-2 border border-slate-800/80 rounded-xl bg-slate-900/60 hover:border-orange-500/40 hover:bg-slate-900 px-3 py-2.5 text-xs transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {t.status === "approved" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span className="text-slate-200 font-medium truncate">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                      {t.status === "approved" && t.expectedBenefit && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {t.expectedBenefit.salesLift}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
              {history.length > 5 && (
                <button
                  onClick={() => setShowAllHistory((v) => !v)}
                  className="w-full text-center text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer mt-3 pt-3 border-t border-slate-800/80"
                >
                  {showAllHistory ? "Show latest 5 only" : `Show all ${history.length} →`}
                </button>
              )}
            </section>
          )}
        </div>

        {/* Recent Banners — just the latest campaign; older ones are one click away via History */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wide">
              Recent Banners
            </h2>
            <button
              onClick={onExportCsv}
              disabled={banners.length === 0}
              className="text-xs font-bold text-slate-950 bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export to CRM (CSV)
            </button>
          </div>

          {recentGroups.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
              No campaigns launched yet — review and approve a trigger to generate regional banners.
            </div>
          ) : (
            recentGroups.map((group) => {
              const groupTrigger = triggers.find((t) => t.id === group.triggerId) || null;
              const theme = deriveEventTheme(group.triggerName);
              return (
                <div key={group.triggerId}>
                  <button
                    onClick={() => groupTrigger && setDetailTrigger(groupTrigger)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-orange-400 cursor-pointer mb-1"
                  >
                    {group.triggerName}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="max-h-[420px] overflow-y-auto pr-1">
                    <AssetGrid assets={group.assets} showAssets eventTheme={theme} />
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      <CampaignDetailModal
        key={detailTrigger?.id || "none"}
        trigger={detailTrigger}
        onClose={() => setDetailTrigger(null)}
        onTriggerUpdated={onTriggersRefresh}
      />

      {showRoiReport && <RoiReportModal triggers={triggers} onClose={() => setShowRoiReport(false)} />}

      <TasteProfileModal cluster={tasteModalCluster} onClose={() => setTasteModalCluster(null)} />
    </div>
  );
};

const RegionalApprovalRow: React.FC<{
  trigger: TriggerRecord;
  canAct: boolean;
  isBusy: boolean;
  onView: () => void;
  onApprove: () => void;
  onSendBack: () => void;
}> = ({ trigger, canAct, isBusy, onView, onApprove, onSendBack }) => (
  <div className="border border-amber-500/30 rounded-2xl bg-slate-900/60 p-4 flex items-center justify-between gap-3 flex-wrap">
    <button onClick={onView} className="min-w-0 text-left cursor-pointer">
      <div className="text-sm font-bold text-white truncate hover:text-orange-400 transition-colors">
        {trigger.name}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-2">
        <span>Approved by {trigger.approvedBy || "Brand Manager"}</span>
        {trigger.expectedBenefit && (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trigger.expectedBenefit.salesLift}
          </span>
        )}
      </div>
    </button>
    {canAct ? (
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSendBack}
          disabled={isBusy}
          className="text-xs font-bold text-slate-400 hover:text-red-400 px-3 py-2 rounded-xl border border-slate-800 hover:border-red-500/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Back
        </button>
        <button
          onClick={onApprove}
          disabled={isBusy}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 py-2 rounded-xl hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          Final Approve
        </button>
      </div>
    ) : (
      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full shrink-0">
        Waiting on Regional Marketing Lead
      </span>
    )}
  </div>
);

const TriggerRow: React.FC<{ trigger: TriggerRecord; onReview: () => void }> = ({ trigger, onReview }) => (
  <div className="border border-slate-800/90 rounded-2xl bg-slate-900/60 p-4 flex items-center justify-between gap-3 hover:border-orange-500/40 transition-colors">
    <div className="min-w-0">
      <div className="text-sm font-bold text-white truncate">{trigger.name}</div>
      <div className="text-[11px] text-slate-400 mt-0.5 truncate">{trigger.meta}</div>
    </div>
    <button
      onClick={onReview}
      className="shrink-0 text-xs font-bold text-slate-950 bg-orange-500 hover:bg-orange-400 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
    >
      Review →
    </button>
  </div>
);
