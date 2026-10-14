"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  CircleHelp,
  Flame,
  House,
  Images,
  Languages,
  Layers3,
  LogOut,
  Moon,
  Palette,
  Rocket,
  Sparkles,
  Sun,
  Target,
  User,
  UsersRound,
} from "lucide-react";
import { cxpWorkflow } from "@/lib/qcos/admin-workflow";
import { logoutFromCxp } from "@/app/login/actions";

interface SidebarProps {
  adminName: string;
  adminEmail: string;
}

const routeIcons: Record<string, LucideIcon> = {
  "/admin/media": Images,
  "/admin/themes": Palette,
  "/admin/flavour-fest": Flame,
  "/admin/festivals": Sparkles,
  "/admin/localization": Languages,
  "/admin/audiences": UsersRound,
  "/admin/experience": Layers3,
  "/admin/campaigns": Target,
  "/admin/releases": Rocket,
  "/admin/schedules": CalendarClock,
  "/admin/analytics": BarChart3,
};

const groups = ["Prepare", "Build", "Deliver", "Learn"] as const;

export default function Sidebar({ adminName, adminEmail }: SidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("buggycxp-theme") as "dark" | "light" | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("buggycxp-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800/80 bg-[#0b0f19]">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10"><Sparkles className="h-4 w-4 text-indigo-400" /></div>
        <div><span className="block text-sm font-bold leading-tight text-white">Buggy<span className="text-indigo-400">CXP</span></span><span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Experience operations</span></div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="BuggyCXP operations">
        <NavLink route="/admin" label="Workflow Home" icon={House} active={pathname === "/admin"} />
        {groups.map((group) => <section key={group} aria-labelledby={`nav-${group.toLowerCase()}`}>
          <h2 id={`nav-${group.toLowerCase()}`} className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-600">{group}</h2>
          <div className="space-y-1">{cxpWorkflow.filter((step) => step.group === group).map((step) => {
            const Icon = routeIcons[step.route];
            const active = pathname === step.route || pathname.startsWith(`${step.route}/`);
            return <Link key={step.route} href={step.route} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${active ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200" : "border-transparent text-slate-400 hover:bg-slate-900/70 hover:text-white"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${active ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-500 group-hover:text-slate-300"}`}>{step.number}</span>
              <Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{step.shortTitle}</span>{active && <ChevronRight className="h-3.5 w-3.5" />}
            </Link>;
          })}</div>
        </section>)}
        <NavLink route="/admin/help" label="Operating Guide" icon={CircleHelp} active={pathname === "/admin/help"} />
      </nav>

      <div className="space-y-3 border-t border-slate-800/80 bg-slate-950/20 p-4">
        <div className="flex items-center gap-3 px-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300"><User className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{adminName}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{adminEmail}</p></div></div>
        <button onClick={toggleTheme} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#090d16]/40 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"><span className="flex items-center gap-2">{theme === "dark" ? <Moon className="h-3.5 w-3.5 text-indigo-400" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}{theme === "dark" ? "Dark theme" : "Light theme"}</span><span>Change</span></button>
        <form action={logoutFromCxp}><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400"><LogOut className="h-3.5 w-3.5" /> Sign out</button></form>
      </div>
    </aside>
  );
}

function NavLink({ route, label, icon: Icon, active }: { route: string; label: string; icon: LucideIcon; active: boolean }) {
  return <Link href={route} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${active ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200" : "border-transparent text-slate-400 hover:bg-slate-900/70 hover:text-white"}`}><Icon className="h-4 w-4" /><span className="flex-1">{label}</span>{active && <ChevronRight className="h-3.5 w-3.5" />}</Link>;
}
