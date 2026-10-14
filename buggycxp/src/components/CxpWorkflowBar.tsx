"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleHelp, House, ListChecks } from "lucide-react";
import { cxpWorkflow, workflowStepForPath } from "@/lib/qcos/admin-workflow";

export default function CxpWorkflowBar() {
  const pathname = usePathname();
  const step = workflowStepForPath(pathname);
  if (!step) return null;
  const previous = cxpWorkflow[step.number - 2];
  const next = cxpWorkflow[step.number];

  return (
    <aside className="border-b border-slate-800 bg-slate-950/90 px-6 py-3" aria-label="CXP workflow guidance">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 font-extrabold text-white">{step.number}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{step.group}</span><span>•</span><span>Step {step.number} of {cxpWorkflow.length}</span></div>
            <p className="truncate text-sm font-bold text-white">{step.title}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400"><strong className="text-slate-300">Before starting:</strong> {step.prerequisite}</p>
          </div>
        </div>
        <nav className="flex shrink-0 flex-wrap items-center gap-2" aria-label="Workflow navigation">
          <Link href="/admin" className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"><House className="h-3.5 w-3.5" /> Workflow home</Link>
          <Link href="/admin/help" className="hidden items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 2xl:flex"><CircleHelp className="h-3.5 w-3.5" /> Guide</Link>
          {previous && <Link href={previous.route} title={previous.title} className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"><ArrowLeft className="h-3.5 w-3.5" /> Previous</Link>}
          {next ? <Link href={next.route} title={next.title} className="flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-400">Next: {next.shortTitle} <ArrowRight className="h-3.5 w-3.5" /></Link> : <Link href="/admin" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><ListChecks className="h-3.5 w-3.5" /> Finish review</Link>}
        </nav>
      </div>
    </aside>
  );
}
