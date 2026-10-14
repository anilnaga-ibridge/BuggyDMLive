"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock3, Info, Loader2, ShieldCheck, TimerOff, X } from "lucide-react";

interface Schedule {
  id: number;
  scheduled_for: string;
  rollout_pct: string;
  status: string;
  reason: string;
  page_version: { id: number; version_number: number; template: { page_name: string } };
  channel: { code: string; name: string };
}
interface Version { id: number; version_number: number; status: string; approved_by: number | null; template: { page_name: string } }
interface Channel { channelCode: string; channelName: string }

const API = "/BuggyCxp/api/qcos/schedules";
const channelDescription: Record<string, string> = {
  dev: "Developers only",
  qa: "Internal QA testers",
  staging: "Final release rehearsal",
  prod: "Real customers",
};
const friendly = (value: string) => value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export default function SchedulesPage() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pageName, setPageName] = useState("");
  const [versionId, setVersionId] = useState("");
  const [channelCode, setChannelCode] = useState("dev");
  const [scheduledFor, setScheduledFor] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [minimumScheduleTime] = useState(() => Date.now() + 60_000);
  const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function load() {
    const [scheduleResponse, releaseResponse] = await Promise.all([
      fetch(API, { cache: "no-store" }),
      fetch("/BuggyCxp/api/qcos/releases", { cache: "no-store" }),
    ]);
    const schedulesPayload = await scheduleResponse.json();
    const releasesPayload = await releaseResponse.json();
    if (scheduleResponse.ok) setItems(schedulesPayload.data || []);
    if (releaseResponse.ok) {
      const nextVersions = releasesPayload.versions || [];
      setVersions(nextVersions);
      setChannels(releasesPayload.channels || []);
      setPageName((current) => current || nextVersions[0]?.template.page_name || "");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pages = useMemo(() => [...new Set(versions.map((version) => version.template.page_name))], [versions]);
  const pageVersions = versions.filter((version) => version.template.page_name === pageName);
  const selectedVersion = pageVersions.find((version) => String(version.id) === versionId) || null;
  const needsReview = channelCode === "staging" || channelCode === "prod";
  const reviewBlocked = Boolean(selectedVersion && needsReview && !selectedVersion.approved_by);
  const productionBlocked = channelCode === "prod" && confirmation !== "SCHEDULE";
  const timeBlocked = !scheduledFor || new Date(scheduledFor).getTime() < minimumScheduleTime;
  const ready = Boolean(selectedVersion && !reviewBlocked && !productionBlocked && !timeBlocked && reason.trim().length >= 10);

  function choosePage(value: string) {
    setPageName(value);
    setVersionId(String(versions.find((version) => version.template.page_name === value)?.id || ""));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !selectedVersion) return;
    setBusy(true);
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageVersionId: selectedVersion.id, channelCode, scheduledFor: new Date(scheduledFor).toISOString(), rolloutPct: 100, reason: reason.trim(), confirmation }),
    });
    const payload = await response.json();
    setMessage({ text: response.ok ? "Publication scheduled. Keep an owner available to monitor and roll back." : payload.error || "Unable to schedule publication", type: response.ok ? "success" : "error" });
    if (response.ok) {
      setScheduledFor("");
      setReason("");
      setConfirmation("");
      await load();
    }
    setBusy(false);
  }

  async function cancel() {
    if (!cancelTarget) return;
    setBusy(true);
    const response = await fetch(`${API}?id=${cancelTarget.id}`, { method: "DELETE" });
    setMessage({ text: response.ok ? "Scheduled publication cancelled." : "Unable to cancel schedule", type: response.ok ? "success" : "error" });
    if (response.ok) await load();
    setCancelTarget(null);
    setBusy(false);
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Step 8 · Deliver</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><CalendarClock className="text-indigo-300" /> Scheduled Publishing</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Choose one immutable experience version, a future time, and the exact environment. All displayed times use <strong className="text-slate-300">{timezone}</strong>.</p></header>

      {message && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-rose-500/30 bg-rose-500/10 text-rose-100"}`}>{message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}{message.text}<button onClick={() => setMessage(null)} className="ml-auto" aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <section><h2 className="text-xl font-bold text-white">1. Select the experience and version</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-300">Experience<select value={pageName} onChange={(event) => choosePage(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"><option value="">Choose experience</option>{pages.map((page) => <option key={page} value={page}>{friendly(page)}</option>)}</select></label><label className="text-sm font-medium text-slate-300">Immutable version<select value={versionId} onChange={(event) => setVersionId(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"><option value="">Choose version</option>{pageVersions.map((version) => <option key={version.id} value={version.id}>Version {version.version_number} · {version.approved_by ? "reviewed" : "not reviewed"}</option>)}</select></label></div></section>

          <section className="border-t border-slate-800 pt-6"><h2 className="text-xl font-bold text-white">2. Choose the destination</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{channels.map((channel) => <button type="button" key={channel.channelCode} onClick={() => { setChannelCode(channel.channelCode); setConfirmation(""); }} className={`rounded-2xl border p-4 text-left ${channelCode === channel.channelCode ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 bg-slate-950/40"}`}><span className="block font-bold text-white">{channel.channelName}</span><span className="mt-1 block text-xs text-slate-400">{channelDescription[channel.channelCode] || channel.channelCode}</span></button>)}</div>{reviewBlocked && <Blocker text="Staging and Production require approval from a different administrator." />}</section>

          <section className="border-t border-slate-800 pt-6"><h2 className="text-xl font-bold text-white">3. Choose time and record the reason</h2><div className="mt-4 space-y-4"><label className="block text-sm font-medium text-slate-300">Publication date and time ({timezone})<input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} required className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" /></label><label className="block text-sm font-medium text-slate-300">Why is this being scheduled?<textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={10} rows={3} placeholder="Launch the reviewed Independence Day grocery experience after QA sign-off." className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" /></label><div className="flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm leading-6 text-sky-100"><ShieldCheck className="h-5 w-5 shrink-0" /><span><strong>Rollout: 100% of the selected environment.</strong><br />Percentage canary rollout is disabled until resolver-side audience bucketing is implemented and verified.</span></div></div></section>

          {channelCode === "prod" && <section className="border-t border-rose-500/20 pt-6"><h2 className="text-xl font-bold text-white">4. Confirm future customer impact</h2><label className="mt-3 block text-sm text-slate-300">Type <strong className="text-white">SCHEDULE</strong> to confirm real customers will receive this at the selected time.<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 block w-full rounded-xl border border-rose-500/40 bg-slate-950 p-3 font-mono text-white" /></label></section>}
          {!selectedVersion && <Blocker text="Choose an immutable version." />}{timeBlocked && scheduledFor && <Blocker text="Choose a time at least one minute in the future." />}
          <button disabled={!ready || busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-bold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />} Schedule publication</button>
        </form>

        <section className="space-y-4"><div><h2 className="text-xl font-bold text-white">Publication calendar</h2><p className="mt-1 text-sm text-slate-400">Upcoming, completed, and cancelled operations remain visible for audit.</p></div>{items.length ? items.map((item) => <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{friendly(item.page_version.template.page_name)} · Version {item.page_version.version_number}</p><p className="mt-1 text-sm text-indigo-200">{item.channel.name} · {new Date(item.scheduled_for).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "scheduled" ? "bg-indigo-500/10 text-indigo-200" : item.status === "executed" ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>{item.status.toUpperCase()}</span></div><p className="mt-4 text-sm leading-6 text-slate-400">{item.reason}</p><p className="mt-2 text-xs text-slate-500">100% environment rollout</p>{item.status === "scheduled" && <button onClick={() => setCancelTarget(item)} className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-200"><TimerOff className="h-4 w-4" /> Cancel schedule</button>}</article>) : <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No scheduled publications yet.</div>}
          <Link href="/admin/analytics" className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 font-bold text-indigo-100">Next: monitor analytics and audit <ArrowRight className="h-5 w-5" /></Link>
        </section>
      </div>

      {cancelTarget && <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 p-6"><h2 id="cancel-title" className="text-xl font-bold text-white">Cancel this scheduled publication?</h2><p className="mt-2 text-sm leading-6 text-slate-400">{friendly(cancelTarget.page_version.template.page_name)} version {cancelTarget.page_version.version_number} will not publish to {cancelTarget.channel.name} at {new Date(cancelTarget.scheduled_for).toLocaleString()}.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setCancelTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Keep schedule</button><button onClick={() => void cancel()} className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white">Cancel publication</button></div></div></div>}
    </main>
  );
}

function Blocker({ text }: { text: string }) {
  return <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"><AlertTriangle className="h-5 w-5 shrink-0" />{text}</div>;
}
