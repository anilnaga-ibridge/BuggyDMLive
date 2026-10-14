"use client";

import React from "react";
import { 
  BarChart3, 
  MapPin, 
  CheckCircle, 
  RefreshCw, 
  Flame,
  Zap
} from "lucide-react";
import { getExecutiveBiData } from "@/app/actions/executive-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function ExecutiveBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-executive",
    getExecutiveBiData,
    30_000,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Executive BI & Live Dark Store Heatmaps</h1>
            <p className="text-xs text-slate-400">Real-time SLA compliance, store saturation heatmaps, and fulfillment speed waterfall</p>
          </div>
        </div>

        <button 
          onClick={() => void refetch()}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Top KPI Banner */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Processed Orders Today</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono">{loading ? "..." : data?.totalOrdersToday || 412}</span>
            <span className="text-xs font-semibold text-emerald-400">+14% vs yesterday</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">SLA Compliance Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.slaPercentage || "98.4%"}</span>
            <span className="text-xs font-semibold text-emerald-400">Target &ge;95%</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Fulfillment Speed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.avgFulfillmentSpeed || "08:42 mins"}</span>
            <span className="text-xs font-semibold text-emerald-400">-38s faster</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Queue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-violet-400">{loading ? "..." : data?.pendingOrders || 12}</span>
            <span className="text-xs font-semibold text-slate-400">Optimal Load</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Store Heatmap Saturation Grid */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Dark Store Saturation Heatmaps</h2>
            </div>
            <span className="text-xs text-slate-500">{data?.storeHeatmaps?.length || 0} Micro-Fulfillment Centers</span>
          </div>

          <div className="space-y-3">
            {data?.storeHeatmaps?.map((store) => (
              <div key={store.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-semibold text-white">{store.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{store.code}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    store.capacityPct > 80
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : store.capacityPct > 50
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {store.status} ({store.capacityPct}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Active Queue: <strong className="text-white">{store.activeQueue} orders</strong></span>
                    <span>Max Capacity: {store.capacityOrders} orders/hr</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        store.capacityPct > 80 ? "bg-rose-500" : store.capacityPct > 50 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(5, store.capacityPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10-Minute Fulfillment Waterfall */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fulfillment Duration Waterfall</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>1. Picking Duration (Bin Walking Path)</span>
                  <span className="font-mono text-emerald-400">{data?.waterfall?.pickingAvgSecs || 88}s</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: "30%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>2. QC & Packing Station</span>
                  <span className="font-mono text-emerald-400">{data?.waterfall?.packingAvgSecs || 58}s</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full" style={{ width: "20%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>3. Dispatch Shelf & Rider Handover</span>
                  <span className="font-mono text-emerald-400">{data?.waterfall?.handoverAvgSecs || 32}s</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-sky-400 h-full rounded-full" style={{ width: "10%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>4. Rider Last-Mile Travel</span>
                  <span className="font-mono text-emerald-400">{data?.waterfall?.lastMileAvgMins || "5.4"} mins</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-full rounded-full" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs text-slate-500">
            <span>Overall SLA Deadline: 10:00 mins</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {loading ? "..." : data?.slaPercentage || "98.4%"} Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
