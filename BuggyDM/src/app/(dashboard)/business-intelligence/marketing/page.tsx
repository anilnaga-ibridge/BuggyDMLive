"use client";

import React from "react";
import { 
  Megaphone, 
  Target, 
  RefreshCw, 
  Filter
} from "lucide-react";
import { getMarketingBiData } from "@/app/actions/marketing-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function MarketingBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-marketing",
    getMarketingBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Marketing & Campaign ROI Intelligence</h1>
            <p className="text-xs text-slate-400">Customer Acquisition Cost (CAC), ROAS, acquisition conversion funnel, and promo codes</p>
          </div>
        </div>

        <button 
          onClick={() => void refetch()}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average CAC</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.metrics?.avgCac || "₹72.50"}</span>
            <span className="text-xs font-semibold text-emerald-400">-₹6.50 lower</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Return on Ad Spend (ROAS)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.metrics?.avgRoas || "4.35x"}</span>
            <span className="text-xs font-semibold text-emerald-400">Target &ge;3.5x</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">LTV : CAC Ratio</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.metrics?.clvToCacRatio || "5.8x"}</span>
            <span className="text-xs font-semibold text-emerald-400">Highly Scalable</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Campaigns</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-violet-400">{loading ? "..." : data?.campaigns?.length || 3}</span>
            <span className="text-xs font-semibold text-slate-400">Live Promotions</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Campaigns Table */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Promo Code Campaigns</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Promo Code</th>
                  <th className="pb-3 font-semibold">Campaign Title</th>
                  <th className="pb-3 font-semibold">Redemptions</th>
                  <th className="pb-3 font-semibold">ROAS</th>
                  <th className="pb-3 font-semibold">CAC</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data?.campaigns?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30">
                    <td className="py-3 font-mono font-bold text-emerald-400">{c.code}</td>
                    <td className="py-3 text-white">{c.title}</td>
                    <td className="py-3 font-mono text-slate-300">{c.redemptions}</td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">{c.roas}</td>
                    <td className="py-3 font-mono text-slate-300">{c.cac}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acquisition Conversion Funnel */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Filter className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Acquisition Funnel</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">1. Ad Impressions</span>
              <div className="font-mono text-base font-bold text-white">{data?.funnel?.impressions}</div>
            </div>

            <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">2. Ad Clicks (CTR)</span>
              <div className="font-mono text-base font-bold text-emerald-400">{data?.funnel?.clicks}</div>
            </div>

            <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">3. App Installs</span>
              <div className="font-mono text-base font-bold text-teal-400">{data?.funnel?.appInstalls}</div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">4. First Order Placed</span>
              <div className="font-mono text-base font-bold text-emerald-300">{data?.funnel?.firstOrders}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
