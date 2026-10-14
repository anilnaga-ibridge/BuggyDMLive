"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Layers3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { loginToCxp } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginToCxp, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a13] px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#172033_1px,transparent_1px),linear-gradient(to_bottom,#172033_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,#000_60%,transparent_100%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800/80 bg-[#0a0f1b]/95 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden min-h-[640px] flex-col justify-between border-r border-slate-800/80 bg-gradient-to-br from-indigo-500/15 via-[#0b1020] to-[#080c15] p-12 lg:flex">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/15">
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-white">Buggy<span className="text-indigo-400">CXP</span></p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Experience Cloud</p>
              </div>
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-indigo-300">Design. Govern. Deliver.</p>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white">One workspace for every customer experience.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Build themes, campaigns and server-driven mobile experiences with governed releases and real-data simulation.</p>
          </div>
          <div className="grid gap-3">
            <Feature icon={Layers3} title="Server-driven UI" text="Manage mobile experiences without app releases." />
            <Feature icon={ShieldCheck} title="Central identity" text="Protected by BuggyDM roles, audit and access policies." />
          </div>
        </div>

        <div className="flex min-h-[640px] items-center p-7 sm:p-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15"><Sparkles className="h-5 w-5 text-indigo-300" /></span>
                <p className="text-lg font-extrabold text-white">Buggy<span className="text-indigo-400">CXP</span></p>
              </div>
            </div>
            <div className="mb-8">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10"><LockKeyhole className="h-5 w-5 text-indigo-300" /></span>
              <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to Experience Cloud</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Use the same credentials as BuggyDM. Authentication remains centrally managed.</p>
            </div>

            <form action={action} className="space-y-5">
              {state?.error && (
                <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-xs leading-5 text-rose-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{state.error}</span>
                </div>
              )}

              <Field label="Email address" icon={Mail}>
                <input id="email" name="email" type="email" autoComplete="username" required placeholder="admin@buggydelivery.com" className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600" />
              </Field>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold text-slate-300">Password</label>
                <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/60 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                {pending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verifying securely…</> : <>Continue to CXP<ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-7 text-center text-[11px] leading-5 text-slate-500">Your credentials are validated by BuggyDM Identity and are never stored in BuggyCXP.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-300">{label}</label><div className="relative rounded-xl border border-slate-700/80 bg-slate-950/60 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15"><Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />{children}</div></div>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof Layers3; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.035] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10"><Icon className="h-4 w-4 text-indigo-300" /></span><div><p className="text-xs font-bold text-slate-200">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div></div>;
}
