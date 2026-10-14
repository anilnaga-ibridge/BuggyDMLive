"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, CheckCircle2, FileImage, Images, Info, Loader2, Plus, ShieldCheck, X } from "lucide-react";

interface MediaItem {
  id: number;
  name: string;
  file_type: string;
  url: string;
  alt_text?: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  status: string;
}

const API = "/BuggyCxp/api/qcos/media";
const visualTypes = new Set(["image", "svg", "video", "lottie"]);

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [fileType, setFileType] = useState("image");
  const [busy, setBusy] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<MediaItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function load() {
    const response = await fetch(API, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setItems(payload.data || []);
    else setMessage({ text: payload.error || "Unable to load media", type: "error" });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const altText = String(data.get("altText") || "").trim();
    if (visualTypes.has(fileType) && !altText) {
      setMessage({ text: "Add an accessibility description for visual media.", type: "error" });
      return;
    }
    setBusy(true);
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        fileType,
        url: data.get("url"),
        responsiveUrls: {},
        sizeBytes: Number(data.get("sizeBytes")),
        mimeType: data.get("mimeType"),
        width: Number(data.get("width")) || null,
        height: Number(data.get("height")) || null,
        altText: altText || null,
      }),
    });
    const payload = await response.json();
    setMessage({ text: response.ok ? "Asset registered. It is now available to Theme and Experience Studio." : payload.error || "Unable to register asset", type: response.ok ? "success" : "error" });
    if (response.ok) {
      event.currentTarget.reset();
      setFileType("image");
      await load();
    }
    setBusy(false);
  }

  async function archive() {
    if (!archiveTarget) return;
    setBusy(true);
    const response = await fetch(`${API}/${archiveTarget.id}`, { method: "DELETE" });
    setMessage({ text: response.ok ? `${archiveTarget.name} was archived and removed from new authoring.` : "Unable to archive asset", type: response.ok ? "success" : "error" });
    if (response.ok) await load();
    setArchiveTarget(null);
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 lg:flex-row lg:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Step 1 · Prepare</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><Images className="text-indigo-300" /> Media & Assets</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Register a governed CDN asset once, then reuse it safely in themes, campaigns, and experiences.</p></div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100"><strong>{items.length}</strong> active assets available</div>
      </header>

      {message && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-rose-500/30 bg-rose-500/10 text-rose-100"}`}>{message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}{message.text}<button onClick={() => setMessage(null)} className="ml-auto" aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Plus className="h-5 w-5 text-indigo-300" /> Register an asset</h2><p className="mt-1 text-sm text-slate-400">No file is uploaded here. Use the approved HTTPS CDN URL.</p></div>
          <fieldset className="space-y-4"><legend className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-300">1. Identify the asset</legend><Field name="name" label="Asset name" placeholder="Monsoon grocery hero" required /><label className="block text-sm font-medium text-slate-300">Asset type<select name="fileType" value={fileType} onChange={(event) => setFileType(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white">{["image", "svg", "video", "lottie", "font", "audio"].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label><Field name="url" label="HTTPS CDN URL" placeholder="https://cdn.example.com/campaign.webp" required /></fieldset>
          <fieldset className="space-y-4 border-t border-slate-800 pt-5"><legend className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-300">2. Accessibility and technical details</legend><Field name="altText" label={visualTypes.has(fileType) ? "Accessibility description (required)" : "Accessibility description"} placeholder="Basket of fresh vegetables on a green background" required={visualTypes.has(fileType)} /><Field name="mimeType" label="MIME type" placeholder={fileType === "image" ? "image/webp" : "application/json"} required /><div className="grid grid-cols-3 gap-3"><Field name="sizeBytes" label="Bytes" type="number" required /><Field name="width" label="Width" type="number" /><Field name="height" label="Height" type="number" /></div></fieldset>
          <div className="flex gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-xs leading-5 text-sky-100"><ShieldCheck className="h-5 w-5 shrink-0" />Confirm licensing, CDN access, responsive variants, and no embedded personal data before registration.</div>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-bold text-white hover:bg-indigo-400 disabled:bg-slate-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />} Register and make available</button>
        </form>

        <section className="space-y-4"><div><h2 className="text-xl font-bold text-white">Available assets</h2><p className="mt-1 text-sm text-slate-400">Preview the exact item before selecting it in another studio.</p></div>{items.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
          {item.file_type === "image" || item.file_type === "svg" ? <div role="img" aria-label={item.alt_text || item.name} className="aspect-video bg-slate-950 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(item.url)})` }} /> : <div className="grid aspect-video place-items-center bg-slate-950"><FileImage className="h-8 w-8 text-slate-600" /><span className="text-xs font-bold uppercase text-slate-500">{item.file_type}</span></div>}
          <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-white">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{item.width || "?"} × {item.height || "?"} · {item.file_type}</p></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">ACTIVE</span></div><p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-400">{item.alt_text || "No accessibility description"}</p><button onClick={() => setArchiveTarget(item)} className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-300"><Archive className="h-3.5 w-3.5" /> Archive asset</button></div>
        </article>)}</div> : <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Register the first approved asset using the guided form.</div>}
        <Link href="/admin/themes" className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 font-bold text-indigo-100">Next: create a theme using these assets <ArrowRight className="h-5 w-5" /></Link></section>
      </div>

      {archiveTarget && <div role="dialog" aria-modal="true" aria-labelledby="archive-title" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 p-6"><h2 id="archive-title" className="text-xl font-bold text-white">Archive {archiveTarget.name}?</h2><p className="mt-2 text-sm leading-6 text-slate-400">It will disappear from new authoring. Existing published layouts may still reference the CDN URL, so replace those usages before deleting the remote file.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setArchiveTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Keep asset</button><button onClick={() => void archive()} className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white">Archive</button></div></div></div>}
    </main>
  );
}

function Field({ name, label, placeholder, type = "text", required = false }: { name: string; label: string; placeholder?: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<input name={name} type={type} required={required} min={type === "number" ? 0 : undefined} placeholder={placeholder} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white placeholder:text-slate-600" /></label>;
}
