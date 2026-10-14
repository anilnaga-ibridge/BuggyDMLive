"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useState } from "react";
import { 
  ShoppingBag, 
  LogOut, 
  User,
  ChevronRight,
  ChevronDown,
  BarChart3,
  WifiOff
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { useNavigation } from "@/hooks/useNavigation";
import { useBadges } from "@/hooks/useBadges";
import { useIsMounted } from "@/hooks/useIsMounted";
import IconResolver from "./common/IconResolver";

interface SidebarProps {
  adminName: string;
  adminEmail: string;
}

export default function Sidebar({ adminName, adminEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isBiOpen, setIsBiOpen] = useState(false);
  const [isOpsOpen, setIsOpsOpen] = useState(false);

  const { mainLinks, biSubLinks, opsSubLinks, isOffline } = useNavigation();
  const { badges } = useBadges(15);
  const isMounted = useIsMounted();

  const biExpanded = isBiOpen || pathname.startsWith("/business-intelligence");
  const opsExpanded = isOpsOpen || pathname.startsWith("/ops");

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-slate-800/80 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-bold text-lg text-white">
            Buggy<span className="text-emerald-500">DM</span>
          </span>
        </div>

        {isOffline && (
          <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] flex items-center gap-1 font-mono" title="Offline Navigation Cached Mode">
            <WifiOff className="w-3 h-3 animate-pulse" />
            <span>OFFLINE</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {/* Main Links */}
        {mainLinks.map((link) => {
          const isActive = pathname === link.route || (link.route !== "/" && pathname.startsWith(link.route) && !pathname.startsWith("/business-intelligence") && !pathname.startsWith("/ops"));
          const badgeVal = isMounted && link.badgeProvider ? (badges[link.badgeProvider] ?? link.badgeValue) : null;

          return (
            <Link
              key={link.route}
              href={link.route}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconResolver name={link.icon} className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                <span>{link.title}</span>
              </div>

              <div className="flex items-center gap-2">
                {badgeVal !== null && badgeVal !== undefined && badgeVal > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {badgeVal}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </Link>
          );
        })}

        {/* Collapsible Business Intelligence Group */}
        {biSubLinks.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setIsBiOpen(!biExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer border ${
                pathname.startsWith("/business-intelligence")
                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 transition-colors ${pathname.startsWith("/business-intelligence") ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                <span>Business Intelligence</span>
              </div>
              {biExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {biExpanded && (
              <div className="pl-4 mt-1 space-y-1 border-l border-slate-800 ml-6">
                {biSubLinks.map((subLink) => {
                  const isSubActive = pathname === subLink.route;

                  return (
                    <Link
                      key={subLink.route}
                      href={subLink.route}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 group cursor-pointer ${
                        isSubActive
                          ? "text-emerald-400 bg-emerald-500/5"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/30"
                      }`}
                    >
                      <IconResolver name={subLink.icon} className={`w-3.5 h-3.5 transition-colors ${isSubActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                      <span>{subLink.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Buggy OPS Group */}
        {opsSubLinks.length > 0 && (
          <div className="space-y-1 mt-2">
            <button
              onClick={() => setIsOpsOpen(!opsExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer border ${
                pathname.startsWith("/ops")
                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className={`w-4 h-4 transition-colors ${pathname.startsWith("/ops") ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                <span>Buggy OPS</span>
              </div>
              {opsExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {opsExpanded && (
              <div className="pl-4 mt-1 space-y-1 border-l border-slate-800 ml-6">
                {opsSubLinks.map((subLink) => {
                  const isSubActive = pathname === subLink.route || pathname.startsWith(subLink.route);
                  const badgeVal = isMounted && subLink.badgeProvider ? (badges[subLink.badgeProvider] ?? subLink.badgeValue) : null;

                  return (
                    <Link
                      key={subLink.route}
                      href={subLink.route}
                      className={`flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 group cursor-pointer ${
                        isSubActive
                          ? "text-emerald-400 bg-emerald-500/5"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconResolver name={subLink.icon} className={`w-3.5 h-3.5 transition-colors ${isSubActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                        <span>{subLink.title}</span>
                      </div>

                      {badgeVal !== null && badgeVal !== undefined && badgeVal > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {badgeVal}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-4">
        <ThemeSwitcher />

        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{adminName}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{adminEmail}</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 text-xs font-medium cursor-pointer transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
