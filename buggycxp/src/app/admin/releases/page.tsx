"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  FileCheck2,
  Layers3,
  Loader2,
  RefreshCcw,
  Rocket,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

interface ActivePublication {
  id: number;
  published_at?: string;
  page_version: {
    id: number;
    version_number: number;
    template: { page_name: string };
  };
}

interface ReleaseChannel {
  channelId: number;
  channelCode: string;
  channelName: string;
  activePublishes: ActivePublication[];
}

interface PageVersion {
  id: number;
  version_number: number;
  status: string;
  created_by: number;
  approved_by: number | null;
  created_at?: string;
  template: { page_name: string };
}

const channelDetails: Record<string, { shortName: string; audience: string; description: string; tone: string }> = {
  dev: { shortName: "Development", audience: "Developers only", description: "First safe check with local and development apps.", tone: "border-sky-500/40 bg-sky-500/10 text-sky-200" },
  qa: { shortName: "QA testing", audience: "Internal testers", description: "Structured functional, visual, and accessibility testing.", tone: "border-violet-500/40 bg-violet-500/10 text-violet-200" },
  staging: { shortName: "Staging", audience: "Release team", description: "Final production-like rehearsal. Independent approval required.", tone: "border-amber-500/40 bg-amber-500/10 text-amber-100" },
  prod: { shortName: "Production", audience: "Real customers", description: "Customer-facing release. Approval and explicit confirmation required.", tone: "border-rose-500/40 bg-rose-500/10 text-rose-100" },
};
const channelOrder = ["dev", "qa", "staging", "prod"];

function friendlyPageName(pageName: string) {
  return pageName.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function ReleaseStudio() {
  const [channels, setChannels] = useState<ReleaseChannel[]>([]);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [viewerUserId, setViewerUserId] = useState<number | null>(null);
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("dev");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [productionConfirmation, setProductionConfirmation] = useState("");
  const [rollbackTarget, setRollbackTarget] = useState<{ publishId: number; pageName: string; channelCode: string } | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotice = (message: string, type: "success" | "error" = "success") => setNotice({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/BuggyCxp/api/qcos/releases", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load releases");
      const nextVersions = (payload.versions || []) as PageVersion[];
      setChannels(
        [...(payload.channels || [])].sort(
          (left: ReleaseChannel, right: ReleaseChannel) => channelOrder.indexOf(left.channelCode) - channelOrder.indexOf(right.channelCode),
        ),
      );
      setVersions(nextVersions);
      setViewerUserId(payload.viewerUserId ?? null);
      setSelectedPage((current) => current || nextVersions[0]?.template.page_name || "");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Unable to load releases", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const pages = useMemo(() => [...new Set(versions.map((version) => version.template.page_name))], [versions]);
  const pageVersions = useMemo(
    () => versions.filter((version) => version.template.page_name === selectedPage),
    [selectedPage, versions],
  );
  const selectedVersion = pageVersions.find((version) => String(version.id) === selectedVersionId) || null;
  const selectedChannelDetails = channelDetails[selectedChannel] || channelDetails.dev;
  const selectedChannelRecord = channels.find((channel) => channel.channelCode === selectedChannel);
  const currentPublication = selectedChannelRecord?.activePublishes?.find(
    (publish) => publish.page_version.template.page_name === selectedPage,
  );
  const requiresReview = selectedChannel === "staging" || selectedChannel === "prod";
  const reviewBlocked = Boolean(selectedVersion && requiresReview && !selectedVersion.approved_by);
  const sameAsActive = currentPublication?.page_version.id === selectedVersion?.id;
  const canOpenConfirmation = Boolean(selectedPage && selectedVersion && !reviewBlocked && !sameAsActive && !busyAction);

  function choosePage(pageName: string) {
    setSelectedPage(pageName);
    setSelectedVersionId(String(versions.find((version) => version.template.page_name === pageName)?.id || ""));
    setConfirming(false);
    setNotice(null);
  }

  async function approveVersion(version: PageVersion) {
    setBusyAction(`approve-${version.id}`);
    try {
      const response = await fetch("/BuggyCxp/api/qcos/releases/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageVersionId: version.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Approval failed");
      showNotice(`${friendlyPageName(version.template.page_name)} version ${version.version_number} is independently approved.`);
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Approval failed", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVersion) return;
    setBusyAction("publish");
    try {
      const response = await fetch("/BuggyCxp/api/qcos/releases/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageVersionId: selectedVersion.id,
          channelCode: selectedChannel,
          confirmation: productionConfirmation,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Publish failed");
      showNotice(`${friendlyPageName(selectedPage)} version ${selectedVersion.version_number} is now active in ${selectedChannelDetails.shortName}.`);
      setConfirming(false);
      setProductionConfirmation("");
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Publish failed", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function rollback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rollbackTarget || rollbackReason.trim().length < 10) return;
    setBusyAction("rollback");
    try {
      const response = await fetch("/BuggyCxp/api/qcos/releases/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishId: rollbackTarget.publishId, reason: rollbackReason.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Rollback failed");
      showNotice(`${friendlyPageName(rollbackTarget.pageName)} was removed from ${channelDetails[rollbackTarget.channelCode]?.shortName || rollbackTarget.channelCode}.`);
      setRollbackTarget(null);
      setRollbackReason("");
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Rollback failed", "error");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 p-6 shadow-2xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Guided release</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><Rocket className="text-indigo-300" /> Publish an app experience</h1>
            <p className="mt-3 leading-7 text-slate-300">Choose what you want to publish, where you want to test it, and review exactly who will see it. Existing customer releases stay active until the final confirmation succeeds.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh status
          </button>
        </div>
      </header>

      {notice && <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 ${notice.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-rose-500/30 bg-rose-500/10 text-rose-100"}`}>
        {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}<span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message" className="ml-auto"><X className="h-4 w-4" /></button>
      </div>}

      <ol aria-label="Release progress" className="grid gap-3 md:grid-cols-4">
        {[
          ["1", "Choose experience", Boolean(selectedPage)],
          ["2", "Choose version", Boolean(selectedVersion)],
          ["3", "Choose audience", Boolean(selectedChannel)],
          ["4", "Review and publish", sameAsActive],
        ].map(([number, label, complete]) => <li key={String(number)} className={`flex items-center gap-3 rounded-2xl border p-4 ${complete ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-800 bg-slate-900/60"}`}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${complete ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{complete ? <Check className="h-4 w-4" /> : number}</span><span className="text-sm font-semibold">{label}</span>
        </li>)}
      </ol>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">1</span><div><h2 className="text-xl font-bold text-white">Which app experience?</h2><p className="mt-1 text-sm text-slate-400">Select the screen or journey you edited in Experience Studio.</p></div></div>
            {pages.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pages.map((page) => <button key={page} onClick={() => choosePage(page)} className={`rounded-2xl border p-4 text-left transition ${selectedPage === page ? "border-indigo-400 bg-indigo-500/15 ring-1 ring-indigo-400" : "border-slate-700 bg-slate-950/50 hover:border-slate-500"}`}><Layers3 className="mb-3 h-5 w-5 text-indigo-300" /><span className="block font-bold text-white">{friendlyPageName(page)}</span><span className="mt-1 block font-mono text-xs text-slate-500">{page}</span></button>)}</div> : <EmptyState />}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">2</span><div><h2 className="text-xl font-bold text-white">Which saved version?</h2><p className="mt-1 text-sm text-slate-400">Choose the exact immutable version you tested. Newest versions appear first.</p></div></div>
            <div className="mt-5 space-y-3">{pageVersions.map((version) => {
              const selected = selectedVersion?.id === version.id;
              const reviewed = Boolean(version.approved_by);
              const authoredByViewer = viewerUserId === version.created_by;
              return <article key={version.id} className={`rounded-2xl border p-4 ${selected ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 bg-slate-950/40"}`}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <button onClick={() => setSelectedVersionId(String(version.id))} className="flex flex-1 items-center gap-3 text-left">
                    {selected ? <CheckCircle2 className="h-6 w-6 text-indigo-300" /> : <Circle className="h-6 w-6 text-slate-600" />}
                    <span><span className="block text-lg font-bold text-white">Version {version.version_number}</span><span className="mt-1 block text-xs text-slate-400">Saved build ID {version.id}</span></span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${reviewed ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-100"}`}>{reviewed ? "Independently reviewed" : "Review required"}</span>
                    {!reviewed && (authoredByViewer ? <span className="text-xs text-slate-500">Ask another administrator to review</span> : <button disabled={Boolean(busyAction)} onClick={() => void approveVersion(version)} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/10">{busyAction === `approve-${version.id}` ? "Approving…" : "Approve as reviewer"}</button>)}
                  </div>
                </div>
              </article>;
            })}{selectedPage && pageVersions.length === 0 && <EmptyState />}</div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">3</span><div><h2 className="text-xl font-bold text-white">Who should see it?</h2><p className="mt-1 text-sm text-slate-400">Start with Development. Move forward only after testing passes.</p></div></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{channels.map((channel) => {
              const detail = channelDetails[channel.channelCode] || { shortName: channel.channelName, audience: channel.channelCode, description: "Release environment", tone: "border-slate-700 bg-slate-900 text-slate-200" };
              const active = channel.activePublishes?.find((publish) => publish.page_version.template.page_name === selectedPage);
              return <button key={channel.channelId} onClick={() => { setSelectedChannel(channel.channelCode); setConfirming(false); }} className={`rounded-2xl border p-4 text-left transition ${selectedChannel === channel.channelCode ? `${detail.tone} ring-1 ring-current` : "border-slate-700 bg-slate-950/40 hover:border-slate-500"}`}>
                <span className="flex items-start justify-between gap-3"><span><span className="block font-bold">{detail.shortName}</span><span className="mt-1 block text-xs opacity-75">{detail.audience}</span></span>{selectedChannel === channel.channelCode && <CheckCircle2 className="h-5 w-5" />}</span>
                <span className="mt-3 block text-sm leading-6 opacity-80">{detail.description}</span><span className="mt-3 block text-xs font-semibold">{active ? `Currently version ${active.page_version.version_number}` : "Nothing published for this experience"}</span>
              </button>;
            })}</div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sticky top-6 rounded-3xl border border-indigo-500/30 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-300"><FileCheck2 className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Release summary</span></div>
            <h2 className="mt-4 text-xl font-bold text-white">Review before publishing</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Summary label="Experience" value={selectedPage ? friendlyPageName(selectedPage) : "Not selected"} />
              <Summary label="New version" value={selectedVersion ? `Version ${selectedVersion.version_number}` : "Not selected"} />
              <Summary label="Destination" value={selectedChannelDetails.shortName} />
              <Summary label="Audience" value={selectedChannelDetails.audience} />
              <Summary label="Currently active" value={currentPublication ? `Version ${currentPublication.page_version.version_number}` : "Nothing published"} />
            </dl>

            <div className="mt-5 space-y-3">
              {!selectedPage && <Blocker text="Choose an experience in step 1." />}
              {!selectedVersion && <Blocker text="Choose a saved version in step 2." />}
              {reviewBlocked && <Blocker text="This destination requires approval from someone other than the author." />}
              {sameAsActive && <div className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0" />This version is already active here.</div>}
              {canOpenConfirmation && <div className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"><ShieldCheck className="h-5 w-5 shrink-0" />Ready for final confirmation.</div>}
            </div>

            <button disabled={!canOpenConfirmation} onClick={() => setConfirming(true)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-bold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500">Review and publish <ChevronRight className="h-4 w-4" /></button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">Publishing changes only this experience in the selected environment and refreshes app layout caches.</p>
          </section>
        </aside>
      </section>

      <section className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6">
        <div className="flex items-start gap-3"><RotateCcw className="mt-1 h-5 w-5 text-rose-300" /><div><h2 className="text-lg font-bold text-white">Emergency rollback</h2><p className="mt-1 text-sm text-slate-400">Use only when an active experience is causing a customer or testing problem. A reason is required for the audit log.</p></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{channels.map((channel) => {
          const active = channel.activePublishes?.find((publish) => publish.page_version.template.page_name === selectedPage);
          return <div key={channel.channelId} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-sm font-bold text-white">{channelDetails[channel.channelCode]?.shortName || channel.channelName}</p><p className="mt-1 text-xs text-slate-500">{active ? `${friendlyPageName(selectedPage)} · Version ${active.page_version.version_number}` : "No active version for the selected experience"}</p><button disabled={!active} onClick={() => active && setRollbackTarget({ publishId: active.id, pageName: selectedPage, channelCode: channel.channelCode })} className="mt-4 w-full rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600">Start rollback</button></div>;
        })}</div>
      </section>

      {confirming && selectedVersion && <div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <form onSubmit={publish} className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Final confirmation</p><h2 id="publish-title" className="mt-2 text-2xl font-bold text-white">Publish version {selectedVersion.version_number}?</h2></div><button type="button" onClick={() => setConfirming(false)} aria-label="Close"><X className="h-5 w-5 text-slate-400" /></button></div>
          <div className={`rounded-2xl border p-4 ${selectedChannelDetails.tone}`}><p className="font-bold">{selectedChannelDetails.shortName} · {selectedChannelDetails.audience}</p><p className="mt-2 text-sm leading-6 opacity-80">{selectedChannelDetails.description}</p></div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm"><span className="font-semibold text-white">{friendlyPageName(selectedPage)}</span><ArrowRight className="h-4 w-4 text-slate-500" /><span>Version {selectedVersion.version_number}</span></div>
          {selectedChannel === "prod" && <label className="block text-sm text-slate-300">Type <strong className="text-white">PUBLISH</strong> to confirm that real customers will receive this experience.<input autoFocus value={productionConfirmation} onChange={(event) => setProductionConfirmation(event.target.value)} className="mt-2 block w-full rounded-xl border border-rose-500/40 bg-slate-900 p-3 font-mono text-white outline-none focus:border-rose-400" /></label>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConfirming(false)} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300">Go back</button><button disabled={busyAction === "publish" || (selectedChannel === "prod" && productionConfirmation !== "PUBLISH")} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-400">{busyAction === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Confirm publication</button></div>
        </form>
      </div>}

      {rollbackTarget && <div role="dialog" aria-modal="true" aria-labelledby="rollback-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <form onSubmit={rollback} className="w-full max-w-lg space-y-5 rounded-3xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl">
          <div><p className="text-xs font-bold uppercase tracking-widest text-rose-300">Emergency action</p><h2 id="rollback-title" className="mt-2 text-2xl font-bold text-white">Remove this active publication?</h2><p className="mt-2 text-sm leading-6 text-slate-400">{friendlyPageName(rollbackTarget.pageName)} will no longer use this release in {channelDetails[rollbackTarget.channelCode]?.shortName || rollbackTarget.channelCode}. The mobile app will use its safe fallback if no earlier active publication exists.</p></div>
          <label className="block text-sm text-slate-300">Explain the customer or testing problem<textarea autoFocus required minLength={10} rows={4} value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} placeholder="Example: Product rail is empty on Android QA devices." className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-rose-400" /></label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setRollbackTarget(null); setRollbackReason(""); }} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300">Cancel</button><button disabled={rollbackReason.trim().length < 10 || busyAction === "rollback"} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 font-bold text-white disabled:bg-slate-700 disabled:text-slate-400">{busyAction === "rollback" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Confirm rollback</button></div>
        </form>
      </div>}
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-200">{value}</dd></div>;
}

function Blocker({ text }: { text: string }) {
  return <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"><AlertTriangle className="h-5 w-5 shrink-0" />{text}</div>;
}

function EmptyState() {
  return <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-6 text-center"><Clock3 className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm text-slate-400">No saved versions are available yet.</p><Link href="/admin/experience" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-300">Create one in Experience Studio <ExternalLink className="h-4 w-4" /></Link></div>;
}
