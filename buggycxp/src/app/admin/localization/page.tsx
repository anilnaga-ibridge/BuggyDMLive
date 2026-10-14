"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, Languages, ShieldCheck } from "lucide-react";

interface Row {
  id: number;
  entity_type: string;
  entity_id: number;
  locale: string;
  field_key: string;
  value_text: string;
  status: string;
}

const API = "/BuggyCxp/api/qcos/localizations";
const localeOptions = [
  { value: "en-IN", label: "English", example: "Fresh groceries delivered fast" },
  { value: "te-IN", label: "తెలుగు + English", example: "తాజా కిరాణా · Fresh groceries" },
  { value: "hi-IN", label: "हिन्दी + English", example: "ताज़ा किराना · Fresh groceries" },
];

function copyFinding(locale: string, value: string) {
  if (!value.trim()) return "Enter customer-facing copy.";
  if (locale === "en-IN") return "";
  if (!/[A-Za-z]/.test(value)) return "Add a short English anchor after the native-language copy.";
  if (locale === "te-IN" && !/[\u0C00-\u0C7F]/.test(value)) return "Add Telugu script before the English anchor.";
  if (locale === "hi-IN" && !/[\u0900-\u097F]/.test(value)) return "Add Hindi script before the English anchor.";
  return "";
}

export default function LocalizationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [locale, setLocale] = useState("te-IN");
  const [value, setValue] = useState("");
  const finding = useMemo(() => copyFinding(locale, value), [locale, value]);

  async function load() {
    const response = await fetch(API, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setRows(payload.data || []);
    else setMessage(payload.error);
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (finding) {
      setMessage(finding);
      return;
    }
    const data = new FormData(event.currentTarget);
    const response = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: data.get("entityType"),
        entityId: Number(data.get("entityId")),
        locale,
        fieldKey: data.get("fieldKey"),
        value,
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Translation draft saved. A second reviewer must approve it." : payload.error);
    if (response.ok) {
      setValue("");
      await load();
    }
  }

  async function review(id: number, status: "approved" | "draft") {
    const response = await fetch(API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = await response.json();
    setMessage(response.ok ? `Translation ${status}. Customer preview cache refreshed.` : payload.error);
    if (response.ok) await load();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 p-6 shadow-2xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Inclusive content operations</p>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white">
              <Languages className="text-indigo-300" aria-hidden="true" /> Language Studio
            </h1>
            <p className="mt-3 leading-7 text-slate-300">
              Manage English, Telugu + English, and Hindi + English SDUI copy. Native copy appears first; a familiar English anchor helps customers with varied literacy levels.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <ShieldCheck size={18} aria-hidden="true" /> Draft → independent review → customer delivery
          </div>
        </div>
      </header>

      {message && <div role="status" className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-indigo-100">{message}</div>}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">Create translation draft</h2>
            <p className="mt-1 text-sm text-slate-400">Widget fields use keys such as props.title, props.subtitle, props.ctaLabel, or props.accessibilityLabel.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-300">Entity type
              <select name="entityType" className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white">
                <option value="widget">Widget</option><option value="section">Section</option><option value="page">Page layout</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">Entity ID
              <input name="entityId" required min="1" type="number" placeholder="e.g. 42" className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" />
            </label>
            <label className="text-sm font-medium text-slate-300">Language mode
              <select value={locale} onChange={(event) => setLocale(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white">
                {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">Field key
              <input name="fieldKey" required defaultValue="props.title" className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-300">Customer-facing copy
            <textarea value={value} onChange={(event) => setValue(event.target.value)} required rows={4} placeholder={localeOptions.find((option) => option.value === locale)?.example} className="mt-2 block w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-base leading-7 text-white" />
          </label>
          <div className={`flex gap-2 rounded-xl border p-3 text-sm ${finding ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"}`}>
            {finding ? <Info size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            {finding || "Copy includes the required native script and English anchor."}
          </div>
          <button disabled={Boolean(finding)} className="w-full rounded-xl bg-indigo-500 py-3 font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">Save translation draft</button>
        </form>

        <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-bold text-white">Mobile preview</h2>
          <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border-8 border-slate-800 bg-white text-slate-950 shadow-2xl">
            <div className="bg-emerald-700 px-5 pb-7 pt-5 text-white">
              <p className="text-xs font-semibold opacity-80">15 mins · Hyderabad</p>
              <p className="mt-2 text-xl font-extrabold">{value || localeOptions.find((option) => option.value === locale)?.example}</p>
            </div>
            <div className="space-y-3 p-5">
              <div className="h-12 rounded-2xl bg-slate-100" /><div className="grid grid-cols-2 gap-3"><div className="h-28 rounded-2xl bg-amber-100" /><div className="h-28 rounded-2xl bg-indigo-100" /></div>
            </div>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-slate-300">
            <li>• Keep actions short and put native-language text first.</li>
            <li>• Use icons as reinforcement, never as the only instruction.</li>
            <li>• Legal, payment, and safety copy requires a qualified human review.</li>
          </ul>
        </aside>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 p-5"><h2 className="text-xl font-bold text-white">Translation queue</h2><p className="mt-1 text-sm text-slate-400">Only approved rows are merged into the customer SDUI payload.</p></div>
        <div className="overflow-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-900 text-slate-400"><tr>{["Entity", "Language", "Field", "Customer copy", "Status", "Review"].map((heading) => <th key={heading} className="p-4 text-left font-semibold">{heading}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-800 text-slate-300">
              <td className="p-4 font-mono text-xs">{row.entity_type}:{row.entity_id}</td><td className="p-4">{row.locale}</td><td className="p-4 font-mono text-xs">{row.field_key}</td><td className="max-w-md p-4 leading-6">{row.value_text}</td>
              <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}>{row.status}</span></td>
              <td className="p-4">{row.status === "approved" ? <button onClick={() => void review(row.id, "draft")} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800">Return to draft</button> : <button onClick={() => void review(row.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500">Approve</button>}</td>
            </tr>)}</tbody>
          </table>
          {rows.length === 0 && <p className="p-8 text-center text-slate-500">No translation drafts yet.</p>}
        </div>
      </section>
    </main>
  );
}
