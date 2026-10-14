"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Eye,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_table: string;
  record_id: number;
  ip_address: string;
  timestamp: string;
}

interface AnalyticsMetric {
  widgetInstanceId: number;
  widgetName: string;
  eventName: string;
  count: number;
}

type Decision = "keep" | "improve" | "rollback";

const decisionOptions: Array<{ value: Decision; label: string; description: string; icon: typeof CheckCircle2; colour: string }> = [
  { value: "keep", label: "Keep", description: "Success metric improved and guardrails are healthy.", icon: CheckCircle2, colour: "emerald" },
  { value: "improve", label: "Improve", description: "Result is inconclusive; revise the experience and test again.", icon: Wrench, colour: "amber" },
  { value: "rollback", label: "Rollback", description: "A guardrail regressed or customers are being harmed.", icon: RotateCcw, colour: "rose" },
];

const selectedDecisionClass: Record<Decision, string> = {
  keep: "border-emerald-400 bg-emerald-500/10",
  improve: "border-amber-400 bg-amber-500/10",
  rollback: "border-rose-400 bg-rose-500/10",
};

function humanize(value: string) {
  return value.replace(/^qcos_/, "").replaceAll("_", " ");
}

export default function AnalyticsStudio() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [total24h, setTotal24h] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadObservabilityData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [logsResponse, metricsResponse] = await Promise.all([
        fetch("/BuggyCxp/api/qcos/audit-logs", { cache: "no-store" }),
        fetch("/BuggyCxp/api/qcos/analytics-stats", { cache: "no-store" }),
      ]);
      const [logsBody, metricsBody] = await Promise.all([logsResponse.json(), metricsResponse.json()]);
      if (!logsResponse.ok || !logsBody.success) throw new Error(logsBody.error || "Could not load audit history");
      if (!metricsResponse.ok || !metricsBody.success) throw new Error(metricsBody.error || "Could not load interaction events");
      setAuditLogs(logsBody.data ?? []);
      setMetrics(metricsBody.data.metrics ?? []);
      setTotal24h(Number(metricsBody.data.total24h ?? 0));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadObservabilityData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadObservabilityData]);

  const totals = useMemo(() => metrics.reduce((result, metric) => {
    result.all += Number(metric.count);
    const event = metric.eventName.toLowerCase();
    if (event.includes("view") || event.includes("impression")) result.views += Number(metric.count);
    if (event.includes("click") || event.includes("tap")) result.actions += Number(metric.count);
    return result;
  }, { all: 0, views: 0, actions: 0 }), [metrics]);

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return auditLogs;
    return auditLogs.filter((log) => `${log.action} ${log.target_table} ${log.record_id} ${log.user_id}`.toLowerCase().includes(needle));
  }, [auditLogs, query]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300"><Sparkles className="h-4 w-4" /> Step 9 · Learn</div>
          <h1 className="text-3xl font-extrabold text-white">Analytics & audit</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Review measured customer interactions and administrator changes, then make an explicit keep, improve, or rollback decision.</p>
        </div>
        <button type="button" onClick={() => void loadObservabilityData()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-900 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh actual data</button>
      </header>

      {message && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Analytics could not load.</strong><p className="mt-1 text-rose-200">{message}</p></div></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Measured interaction summary">
        {[
          { label: "Events in last 24 hours", value: total24h, icon: Activity, note: "Time-bounded API count" },
          { label: "All recorded events", value: totals.all, icon: TrendingUp, note: "Across returned aggregates" },
          { label: "Views / impressions", value: totals.views, icon: Eye, note: "Name-based event grouping" },
          { label: "Clicks / taps", value: totals.actions, icon: MousePointerClick, note: "Name-based event grouping" },
        ].map((item) => <article key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"><div className="flex items-center justify-between"><item.icon className="h-5 w-5 text-indigo-300" /><span className="text-3xl font-black text-white">{loading ? "—" : item.value.toLocaleString()}</span></div><h2 className="mt-4 text-sm font-bold text-slate-200">{item.label}</h2><p className="mt-1 text-[11px] text-slate-500">{item.note}</p></article>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-4"><h2 className="flex items-center gap-2 font-bold text-white"><Activity className="h-4 w-4 text-indigo-300" /> Widget interaction totals</h2><p className="mt-1 text-xs leading-5 text-slate-400">These are the event names and counts actually returned by the CXP analytics API. No synthetic latency or availability values are shown.</p></div>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><th className="p-3">Widget / section</th><th className="p-3">Event</th><th className="p-3 text-right">Count</th></tr></thead><tbody className="divide-y divide-slate-800">{metrics.map((metric) => <tr key={`${metric.widgetInstanceId}-${metric.eventName}`} className="text-slate-300"><td className="p-3 font-semibold text-white">{metric.widgetName}</td><td className="p-3"><span className="rounded-lg bg-indigo-500/10 px-2 py-1 font-mono text-[10px] text-indigo-200">{metric.eventName}</span></td><td className="p-3 text-right text-base font-black text-white">{Number(metric.count).toLocaleString()}</td></tr>)}{metrics.length === 0 && !loading && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No widget events have been recorded yet. Validate Flutter event instrumentation before evaluating a release.</td></tr>}</tbody></table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5"><h2 className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-4 w-4 text-sky-300" /> Measurement coverage</h2><div className="mt-4 space-y-3 text-xs leading-5 text-slate-300"><p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> Widget event totals and last-24-hour volume are connected.</p><p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> Administrative mutation history is connected.</p><p className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Latency, cache hit rate, crash-free users, and availability are not supplied by this API yet. Connect the observability platform before enforcing those SLAs.</p></div></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"><h2 className="flex items-center gap-2 font-bold text-white"><ClipboardCheck className="h-4 w-4 text-indigo-300" /> Release decision</h2><p className="mt-1 text-xs leading-5 text-slate-400">Compare the agreed success metric and guardrails before choosing.</p><div className="mt-4 space-y-2">{decisionOptions.map((option) => { const Icon = option.icon; const selected = decision === option.value; return <button key={option.value} type="button" onClick={() => setDecision(option.value)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${selected ? selectedDecisionClass[option.value] : "border-slate-800 bg-slate-950/50 hover:border-slate-700"}`}><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-slate-500"}`} /><span><strong className="block text-sm text-white">{option.label}</strong><span className="mt-0.5 block text-[11px] leading-4 text-slate-400">{option.description}</span></span></button>; })}</div>{decision && <p className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-100">Decision selected: <strong>{decisionOptions.find((item) => item.value === decision)?.label}</strong>. Record the reason in your delivery ticket before closing the release.</p>}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-white">Administrator audit trail</h2><p className="mt-1 text-xs text-slate-400">Latest 50 recorded CXP mutations, newest first.</p></div><label className="relative block md:w-80"><span className="sr-only">Search audit trail</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, table, record, user" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-400" /></label></div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><th className="p-3">Time</th><th className="p-3">Action</th><th className="p-3">Area</th><th className="p-3">Record</th><th className="p-3">Administrator</th><th className="p-3">Source IP</th></tr></thead><tbody className="divide-y divide-slate-800">{filteredLogs.map((log) => <tr key={log.id} className="text-slate-300 hover:bg-slate-950/50"><td className="whitespace-nowrap p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td><td className="p-3"><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${log.action === "CREATE" ? "bg-emerald-500/10 text-emerald-300" : log.action === "DELETE" || log.action === "ROLLBACK" ? "bg-rose-500/10 text-rose-300" : "bg-indigo-500/10 text-indigo-300"}`}>{log.action}</span></td><td className="p-3 font-semibold capitalize text-white">{humanize(log.target_table)}</td><td className="p-3 font-mono">#{log.record_id}</td><td className="p-3 font-mono">User #{log.user_id}</td><td className="p-3 font-mono text-slate-500">{log.ip_address}</td></tr>)}{filteredLogs.length === 0 && !loading && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No audit entries match this search.</td></tr>}</tbody></table></div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-white">Complete the operating loop</h2><p className="mt-1 text-sm text-slate-300">Use the evidence to keep, improve, or roll back. Then return to the workflow home for the next change.</p></div><Link href="/admin" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-400">Workflow home <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  );
}
