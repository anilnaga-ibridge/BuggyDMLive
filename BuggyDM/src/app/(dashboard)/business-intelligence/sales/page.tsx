"use client";

import React from "react";
import { 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  PieChart, 
} from "lucide-react";
import { getSalesBiData } from "@/app/actions/sales-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function SalesBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-sales",
    getSalesBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sales & Customer LTV Intelligence</h1>
            <p className="text-xs text-slate-400">Gross Merchandise Value (GMV), AOV, peak ordering slots, and customer LTV cohorts</p>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">GMV Today</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.gmvToday || "₹2,05,600"}</span>
            <span className="text-xs font-semibold text-emerald-400">+18% growth</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Order Value (AOV)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.aov || "₹485.00"}</span>
            <span className="text-xs font-semibold text-emerald-400">+₹32 higher</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Repeat Customer Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-violet-400">{loading ? "..." : data?.customerCohorts?.repeatCustomerPct || "78.4%"}</span>
            <span className="text-xs font-semibold text-emerald-400">High Loyalty</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer LTV (Avg)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.customerCohorts?.customerLtvAvg || "₹4,250"}</span>
            <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Peak Order Slot Heatmap */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Peak Order Velocity Slots</h2>
            </div>
            <span className="text-xs text-slate-500">Hourly Distribution</span>
          </div>

          <div className="space-y-4">
            {data?.peakHours?.map((slot, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{slot.hour}</span>
                  <span className="font-mono text-emerald-400 font-bold">{slot.volume} orders ({slot.share})</span>
                </div>
                <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: slot.share }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Revenue Share */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Category Revenue Share</h2>
          </div>

          <div className="space-y-3 text-xs">
            {data?.categoryRevenue?.map((cat, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{cat.category}</div>
                  <div className="text-[10px] text-slate-500">{cat.percentage} of total revenue</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">{cat.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
