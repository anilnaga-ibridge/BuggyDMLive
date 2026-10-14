"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkstationHeader from "@/components/WorkstationHeader";
import { useNavigation } from "@/hooks/useNavigation";
import { useBadges } from "@/hooks/useBadges";
import { useIsMounted } from "@/hooks/useIsMounted";
import IconResolver from "@/components/common/IconResolver";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { opsSubLinks } = useNavigation();
  const { badges } = useBadges(15);
  const isMounted = useIsMounted();

  return (
    <div className="flex flex-col h-full bg-[#080b11] text-white">
      {/* Dynamic Header Component */}
      <WorkstationHeader />

      {/* Main Workstation Sidebar + View Content */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-[#0b0f19] border-r border-slate-800/80 flex flex-col p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-3">
            Workstations
          </p>

          {opsSubLinks.map((link) => {
            const isActive = pathname === `/BuggyDm${link.route}` || pathname === link.route || pathname.startsWith(link.route);
            const badgeVal = isMounted && link.badgeProvider ? (badges[link.badgeProvider] ?? link.badgeValue) : null;

            return (
              <Link
                key={link.route}
                href={link.route}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconResolver name={link.icon} className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{link.title}</span>
                </div>

                {badgeVal !== null && badgeVal !== undefined && badgeVal > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {badgeVal}
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Main Workstation Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#080b11] relative text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
