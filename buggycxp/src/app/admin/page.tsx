import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Images,
  Languages,
  Layers3,
  Palette,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cxpWorkflow } from "@/lib/qcos/admin-workflow";

const icons: Record<string, LucideIcon> = {
  "/admin/media": Images,
  "/admin/themes": Palette,
  "/admin/localization": Languages,
  "/admin/audiences": UsersRound,
  "/admin/experience": Layers3,
  "/admin/campaigns": Target,
  "/admin/releases": Rocket,
  "/admin/schedules": CalendarClock,
  "/admin/analytics": BarChart3,
};

export default async function CxpWorkflowHome() {
  const [media, themes, translations, audiences, versions, rules, releases, schedules, events] = await Promise.all([
    prisma.qcos_media_library.count({ where: { status: "active" } }),
    prisma.qcos_themes.count(),
    prisma.qcos_localizations.count({ where: { status: "approved" } }),
    prisma.qcos_segments.count({ where: { is_active: true } }),
    prisma.qcos_page_versions.count(),
    prisma.qcos_experience_rules.count({ where: { is_active: true } }),
    prisma.qcos_publish_history.count({ where: { rolled_back_at: null } }),
    prisma.qcos_scheduled_publications.count({ where: { status: "scheduled" } }),
    prisma.qcos_analytics_events.count(),
  ]);
  const counts = [media, themes, translations, audiences, versions, rules, releases, schedules, events];
  const firstIncomplete = counts.findIndex((count) => count === 0);
  const recommended = cxpWorkflow[firstIncomplete < 0 ? 8 : firstIncomplete];

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 p-7 shadow-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-300">Buggy Experience Cloud</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><Sparkles className="text-indigo-300" /> One workflow from idea to customer</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">Follow the numbered steps in order for a new experience. You can return to any completed step for updates, but publishing always uses an immutable saved version.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href={recommended.route} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white hover:bg-indigo-400">Continue with step {recommended.number}: {recommended.shortTitle} <ArrowRight className="h-4 w-4" /></Link><Link href="/admin/help" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-900">Read the operating guide</Link></div>
      </header>

      <section>
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-white">Complete operating workflow</h2><p className="mt-1 text-sm text-slate-400">A count shows existing records, not final approval. Open the step to review readiness.</p></div><span className="text-sm text-slate-500">{counts.filter((count) => count > 0).length} of {cxpWorkflow.length} steps started</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cxpWorkflow.map((step, index) => {
          const Icon = icons[step.route];
          const started = counts[index] > 0;
          return <Link key={step.route} href={step.route} className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-xl">
            <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-extrabold text-white">{step.number}</span><span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${started ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>{started && <CheckCircle2 className="h-3.5 w-3.5" />}{started ? `${counts[index]} available` : "Not started"}</span></div>
            <Icon className="mt-6 h-5 w-5 text-indigo-300" /><h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3><p className="mt-2 min-h-16 text-sm leading-6 text-slate-400">{step.purpose}</p><span className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-300">Open step <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>;
        })}</div>
      </section>

      <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6"><h2 className="text-lg font-bold text-white">Important operating rule</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">Creating content does not publish it. Experience drafts are immutable; staging and production require a different administrator to review them. Prices, stock, fees, eligibility, payments, and order state always remain controlled by Buggy backend products—not CXP.</p></section>
    </main>
  );
}
