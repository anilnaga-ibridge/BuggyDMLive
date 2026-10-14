"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Beaker,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

interface ExperimentVariant {
  id: number;
  name: string;
  traffic_pct: string | number;
}

interface Experiment {
  id: number;
  name: string;
  description: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  flag?: { flag_key: string };
  variants?: ExperimentVariant[];
}

interface ReusableRule {
  id: number;
  name: string;
  conditions_json: string;
  is_active: boolean;
}

interface RuleCondition {
  field?: string;
  operator?: string;
  value?: unknown;
}

const contextFields = [
  { value: "market", label: "Market", example: "IN" },
  { value: "city", label: "City", example: "Hyderabad" },
  { value: "locale", label: "Language / locale", example: "te-IN" },
  { value: "module", label: "Shopping module", example: "grocery" },
  { value: "platform", label: "Platform", example: "android" },
  { value: "deviceType", label: "Device type", example: "mobile" },
  { value: "networkClass", label: "Network class", example: "4g" },
] as const;

const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
const labelClass = "mb-1.5 block text-xs font-bold text-slate-300";

function conditionSummary(raw: string) {
  try {
    const condition = JSON.parse(raw) as RuleCondition;
    const field = contextFields.find((item) => item.value === condition.field)?.label ?? condition.field;
    const operator = condition.operator === "not_equals" ? "is not" : condition.operator === "contains" ? "contains" : "is";
    if (field && condition.value !== undefined) return `${field} ${operator} “${String(condition.value)}”`;
  } catch {
    return "The stored condition needs technical review.";
  }
  return "Compound or advanced condition";
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function CampaignStudio() {
  const [initialStart] = useState(() => new Date(Date.now() + 60 * 60_000));
  const [initialEnd] = useState(() => new Date(initialStart.getTime() + 7 * 24 * 60 * 60_000));
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [rules, setRules] = useState<ReusableRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"rule" | "experiment" | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const [ruleName, setRuleName] = useState("");
  const [ruleField, setRuleField] = useState("market");
  const [ruleOperator, setRuleOperator] = useState("equals");
  const [ruleValue, setRuleValue] = useState("");

  const [experimentName, setExperimentName] = useState("");
  const [flagKey, setFlagKey] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput(initialStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(initialEnd));
  const [controlName, setControlName] = useState("Control");
  const [treatmentName, setTreatmentName] = useState("Treatment");
  const [controlPct, setControlPct] = useState(50);

  const showMessage = (text: string, error = false) => {
    setMessage({ text, error });
    window.setTimeout(() => setMessage(null), 4500);
  };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/BuggyCxp/api/qcos/campaigns", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Could not load campaigns");
      setExperiments(body.data.experiments ?? []);
      setRules(body.data.rules ?? []);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not load campaigns", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCampaigns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCampaigns]);

  const createRule = async (event: FormEvent) => {
    event.preventDefault();
    if (ruleName.trim().length < 2 || !ruleValue.trim()) {
      showMessage("Add a clear rule name and comparison value.", true);
      return;
    }
    setSaving("rule");
    try {
      const response = await fetch("/BuggyCxp/api/qcos/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName.trim(),
          conditions_json: JSON.stringify({ field: ruleField, operator: ruleOperator, value: ruleValue.trim() }),
          actions_json: "[]",
          is_active: true,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Could not create rule");
      setRuleName("");
      setRuleValue("");
      showMessage("Targeting rule created. It is ready to reference from Experience Studio.");
      await loadCampaigns();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not create rule", true);
    } finally {
      setSaving(null);
    }
  };

  const createExperiment = async (event: FormEvent) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!experimentName.trim() || !flagKey.trim() || !controlName.trim() || !treatmentName.trim()) {
      showMessage("Complete the experiment, flag, and variant names.", true);
      return;
    }
    if (end <= start) {
      showMessage("The end time must be after the start time.", true);
      return;
    }
    setSaving("experiment");
    try {
      const response = await fetch("/BuggyCxp/api/qcos/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: experimentName.trim(),
          flagKey: flagKey.trim().toLowerCase(),
          description: description.trim() || undefined,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          variants: [
            { name: controlName.trim(), trafficPct: controlPct, properties: {} },
            { name: treatmentName.trim(), trafficPct: 100 - controlPct, properties: {} },
          ],
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Could not create experiment");
      setExperimentName("");
      setFlagKey("");
      setDescription("");
      showMessage("Draft experiment created. It will activate automatically at its start time.");
      await loadCampaigns();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not create experiment", true);
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      {message && (
        <div role="status" className={`fixed right-5 top-5 z-50 flex max-w-md items-start gap-3 rounded-xl border p-4 shadow-2xl ${message.error ? "border-rose-500/40 bg-rose-950 text-rose-100" : "border-emerald-500/40 bg-emerald-950 text-emerald-100"}`}>
          {message.error ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300"><Sparkles className="h-4 w-4" /> Step 6 · Build</div>
          <h1 className="text-3xl font-extrabold text-white">Campaigns & targeting</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Create reusable visibility rules and controlled A/B assignments. Commerce prices, inventory, eligibility, and checkout remain owned by their source APIs.</p>
        </div>
        <button type="button" onClick={() => void loadCampaigns()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-900 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Campaign workflow">
        {[
          ["1", "Define", "Choose a non-sensitive audience signal and document the intended outcome."],
          ["2", "Configure", "Create a reusable rule or a time-bounded two-variant experiment."],
          ["3", "Validate", "Preview in Experience Studio, publish one immutable version, then measure events."],
        ].map(([number, title, text]) => (
          <div key={number} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><div className="mb-2 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-xs font-black text-white">{number}</span><h2 className="font-bold text-white">{title}</h2></div><p className="text-xs leading-5 text-slate-400">{text}</p></div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={createRule} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><Target className="h-5 w-5" /></span><div><h2 className="font-bold text-white">Create a reusable targeting rule</h2><p className="mt-1 text-xs leading-5 text-slate-400">Use this when the same customer condition will be reused across widgets or sections.</p></div></div>
          <div className="space-y-4">
            <label><span className={labelClass}>Rule name</span><input className={inputClass} value={ruleName} onChange={(event) => setRuleName(event.target.value)} placeholder="Example: Hyderabad Telugu customers" maxLength={100} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className={labelClass}>Customer context</span><select className={inputClass} value={ruleField} onChange={(event) => setRuleField(event.target.value)}>{contextFields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}</select></label>
              <label><span className={labelClass}>Comparison</span><select className={inputClass} value={ruleOperator} onChange={(event) => setRuleOperator(event.target.value)}><option value="equals">is exactly</option><option value="not_equals">is not</option><option value="contains">contains</option></select></label>
            </div>
            <label><span className={labelClass}>Value</span><input className={inputClass} value={ruleValue} onChange={(event) => setRuleValue(event.target.value)} placeholder={contextFields.find((item) => item.value === ruleField)?.example} /></label>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-5 text-amber-100"><strong>Privacy guardrail:</strong> Do not target by caste, religion, health, payment details, or other sensitive personal data.</div>
            <button disabled={saving !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-400 disabled:opacity-50"><Plus className="h-4 w-4" /> {saving === "rule" ? "Creating…" : "Create active rule"}</button>
          </div>
        </form>

        <form onSubmit={createExperiment} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-violet-500/15 p-2 text-violet-300"><Beaker className="h-5 w-5" /></span><div><h2 className="font-bold text-white">Create a two-variant experiment</h2><p className="mt-1 text-xs leading-5 text-slate-400">Assignments are stable per customer or device and become active during the selected window.</p></div></div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>Experiment name</span><input className={inputClass} value={experimentName} onChange={(event) => setExperimentName(event.target.value)} placeholder="Home hero message test" /></label><label><span className={labelClass}>Feature flag key</span><input className={inputClass} value={flagKey} onChange={(event) => setFlagKey(event.target.value.replace(/\s+/g, "-"))} placeholder="home.hero.message" pattern="[a-z][a-z0-9_.-]*" /></label></div>
            <label><span className={labelClass}>Hypothesis / success metric</span><textarea className={`${inputClass} min-h-20 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Changing the home message should improve hero clicks without reducing add-to-cart rate." maxLength={1000} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>Start in your local timezone</span><input type="datetime-local" className={inputClass} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label><span className={labelClass}>End in your local timezone</span><input type="datetime-local" className={inputClass} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>Control name · {controlPct}%</span><input className={inputClass} value={controlName} onChange={(event) => setControlName(event.target.value)} /></label><label><span className={labelClass}>Treatment name · {100 - controlPct}%</span><input className={inputClass} value={treatmentName} onChange={(event) => setTreatmentName(event.target.value)} /></label></div>
            <label><span className={labelClass}>Traffic split: {controlPct}% control / {100 - controlPct}% treatment</span><input className="w-full accent-indigo-500" type="range" min={10} max={90} step={5} value={controlPct} onChange={(event) => setControlPct(Number(event.target.value))} /></label>
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-xs leading-5 text-sky-100"><strong>Implementation checkpoint:</strong> the Flutter client must consume the returned flag and variant assignment before this changes customer UI.</div>
            <button disabled={saving !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-violet-400 disabled:opacity-50"><CalendarClock className="h-4 w-4" /> {saving === "experiment" ? "Creating…" : "Create draft experiment"}</button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Reusable rules</h2><p className="mt-1 text-xs text-slate-400">Reference with <code className="text-indigo-300">rule:rule-name</code>.</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">{rules.length}</span></div><div className="space-y-3">{rules.length === 0 && !loading ? <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">No reusable rules yet.</p> : rules.map((rule) => <article key={rule.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{rule.name}</h3><p className="mt-1 text-xs text-slate-400">{conditionSummary(rule.conditions_json)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${rule.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{rule.is_active ? "Active" : "Inactive"}</span></div></article>)}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Experiments</h2><p className="mt-1 text-xs text-slate-400">Draft, active, and completed assignment windows.</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">{experiments.length}</span></div><div className="space-y-3">{experiments.length === 0 && !loading ? <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">No experiments yet.</p> : experiments.map((experiment) => <article key={experiment.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{experiment.name}</h3><p className="mt-1 text-xs text-indigo-300">{experiment.flag?.flag_key ?? "Feature flag"}</p></div><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-violet-300">{experiment.status}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">{new Date(experiment.starts_at).toLocaleString()} → {new Date(experiment.ends_at).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2">{experiment.variants?.map((variant) => <span key={variant.id} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">{variant.name} · {Number(variant.traffic_pct)}%</span>)}</div></article>)}</div></div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-bold text-white">Completion checkpoint</h2><p className="mt-1 text-sm text-slate-300">Rule is understandable, experiment has an owner and metric, dates are correct, and the exact experience was previewed.</p></div></div><Link href="/admin/releases" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-500">Continue to publishing <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  );
}
