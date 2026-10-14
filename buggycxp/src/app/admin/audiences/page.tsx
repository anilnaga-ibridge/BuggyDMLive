"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Braces, CheckCircle2, Info, Plus, ShieldCheck, Target, Trash2, UsersRound, X } from "lucide-react";

interface Segment {
  id: number;
  segment_key: string;
  name: string;
  description?: string;
  rules_json: string;
  is_active: boolean;
}

type ContextField = "city" | "market" | "locale" | "module" | "signedIn" | "networkClass" | "preferredCategories";
type RuleOperator = "equals" | "not_equals" | "contains" | "in";
interface RuleDraft { id: number; field: ContextField; operator: RuleOperator; value: string }

const API = "/BuggyCxp/api/qcos/segments";
const fieldLabels: Record<ContextField, string> = {
  city: "Delivery city",
  market: "Market",
  locale: "Language locale",
  module: "Service module",
  signedIn: "Signed-in status",
  networkClass: "Network quality",
  preferredCategories: "Preferred category",
};
const operatorLabels: Record<RuleOperator, string> = { equals: "is exactly", not_equals: "is not", contains: "contains", in: "is one of" };

function ruleValue(rule: RuleDraft): unknown {
  if (rule.field === "signedIn") return rule.value === "true";
  if (rule.operator === "in") return rule.value.split(",").map((item) => item.trim()).filter(Boolean);
  return rule.value.trim();
}

export default function AudiencesPage() {
  const [items, setItems] = useState<Segment[]>([]);
  const [rules, setRules] = useState<RuleDraft[]>([{ id: 1, field: "market", operator: "equals", value: "IN" }]);
  const [join, setJoin] = useState<"AND" | "OR">("AND");
  const [advanced, setAdvanced] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const generatedRules = useMemo(() => ({
    operator: join,
    rules: rules.map((rule) => ({ field: rule.field, operator: rule.operator, value: ruleValue(rule) })),
  }), [join, rules]);

  async function load() {
    const response = await fetch(API, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setItems(payload.data || []);
    else setMessage({ text: payload.error || "Unable to load audiences", type: "error" });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateRule(id: number, patch: Partial<RuleDraft>) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let payloadRules: unknown = generatedRules;
    if (advanced) {
      try { payloadRules = JSON.parse(advancedJson); }
      catch { setMessage({ text: "Advanced rules must be valid JSON.", type: "error" }); return; }
    }
    if (!advanced && rules.some((rule) => !rule.value.trim())) {
      setMessage({ text: "Complete every audience rule value.", type: "error" });
      return;
    }
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segmentKey: data.get("key"), name: data.get("name"), description: data.get("description"), rules: payloadRules, isActive: true }),
    });
    const payload = await response.json();
    setMessage({ text: response.ok ? "Audience created. It is now available for governed targeting." : payload.error || "Unable to create audience", type: response.ok ? "success" : "error" });
    if (response.ok) {
      event.currentTarget.reset();
      setRules([{ id: Date.now(), field: "market", operator: "equals", value: "IN" }]);
      await load();
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Step 4 · Prepare</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><UsersRound className="text-indigo-300" /> Audience Studio</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Describe who may receive an experience using approved context—not personal identity or sensitive customer data.</p></header>

      {message && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-rose-500/30 bg-rose-500/10 text-rose-100"}`}>{message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}{message.text}<button onClick={() => setMessage(null)} className="ml-auto" aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <section><h2 className="text-xl font-bold text-white">1. Name the audience</h2><p className="mt-1 text-sm text-slate-400">Use a name that another operator can understand without opening the rules.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field name="name" label="Display name" placeholder="Hyderabad grocery customers" required /><Field name="key" label="Stable key" placeholder="hyderabad_grocery" required /></div><label className="mt-4 block text-sm font-medium text-slate-300">Business reason<textarea name="description" required rows={2} placeholder="Show locally available grocery campaigns to customers in Hyderabad." className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" /></label></section>

          <section className="border-t border-slate-800 pt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-white">2. Define the rules</h2><p className="mt-1 text-sm text-slate-400">All conditions must match, unless you choose “Any condition”.</p></div><button type="button" onClick={() => { setAdvanced((value) => !value); setAdvancedJson(JSON.stringify(generatedRules, null, 2)); }} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300"><Braces className="h-4 w-4" /> {advanced ? "Use guided builder" : "Advanced JSON"}</button></div>
            {advanced ? <label className="mt-4 block text-sm text-slate-300">Advanced rule tree<textarea value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} rows={12} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-6 text-emerald-200" /></label> : <div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-300">Match behaviour<select value={join} onChange={(event) => setJoin(event.target.value as "AND" | "OR")} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"><option value="AND">All conditions must match</option><option value="OR">Any condition may match</option></select></label>{rules.map((rule, index) => <div key={rule.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 p-4 md:grid-cols-[1fr_0.8fr_1fr_auto]"><label className="text-xs font-medium text-slate-400">Context field<select value={rule.field} onChange={(event) => updateRule(rule.id, { field: event.target.value as ContextField, value: event.target.value === "signedIn" ? "true" : "" })} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">{Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-medium text-slate-400">Comparison<select value={rule.operator} onChange={(event) => updateRule(rule.id, { operator: event.target.value as RuleOperator })} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">{Object.entries(operatorLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-medium text-slate-400">Value{rule.field === "signedIn" ? <select value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white"><option value="true">Signed in</option><option value="false">Guest</option></select> : <input value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} placeholder={rule.operator === "in" ? "Hyderabad, Bengaluru" : "Hyderabad"} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" />}</label><button type="button" disabled={rules.length === 1} onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))} aria-label={`Remove rule ${index + 1}`} className="self-end rounded-lg border border-rose-500/20 p-2 text-rose-300 disabled:border-slate-800 disabled:text-slate-700"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={() => setRules((current) => [...current, { id: Date.now(), field: "city", operator: "equals", value: "" }])} className="flex items-center gap-2 rounded-lg border border-dashed border-indigo-500/40 px-4 py-2 text-sm font-bold text-indigo-200"><Plus className="h-4 w-4" /> Add another condition</button></div>}
          </section>

          <section className="border-t border-slate-800 pt-6"><h2 className="text-xl font-bold text-white">3. Privacy check</h2><div className="mt-3 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6 text-emerald-100"><ShieldCheck className="h-5 w-5 shrink-0" />Only the allow-listed context fields shown above are accepted. Do not encode names, phone numbers, addresses, religion, health, caste, payment information, or inferred sensitive traits in keys or values.</div></section>
          <button className="w-full rounded-xl bg-indigo-500 py-3 font-bold text-white hover:bg-indigo-400">Create active audience</button>
        </form>

        <section className="space-y-4"><div><h2 className="text-xl font-bold text-white">Reusable audiences</h2><p className="mt-1 text-sm text-slate-400">Read the plain description before attaching an audience to a campaign.</p></div>{items.length ? items.map((item) => {
          let parsed: unknown = {};
          try { parsed = JSON.parse(item.rules_json); } catch { parsed = { error: "Stored rule is invalid" }; }
          return <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{item.name}</h3><code className="mt-1 block text-xs text-indigo-300">{item.segment_key}</code></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{item.is_active ? "ACTIVE" : "INACTIVE"}</span></div><p className="mt-3 text-sm leading-6 text-slate-400">{item.description || "No business reason recorded."}</p><details className="mt-4"><summary className="cursor-pointer text-xs font-bold text-slate-300"><Target className="mr-2 inline h-4 w-4" />View technical rule</summary><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-300">{JSON.stringify(parsed, null, 2)}</pre></details></article>;
        }) : <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Create the first reusable audience with the guided builder.</div>}
          <Link href="/admin/experience" className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 font-bold text-indigo-100">Next: build the customer experience <ArrowRight className="h-5 w-5" /></Link>
        </section>
      </div>
    </main>
  );
}

function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<input name={name} required={required} placeholder={placeholder} pattern={name === "key" ? "[a-z][a-z0-9_.-]*" : undefined} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" /></label>;
}
