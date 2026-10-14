"use client";

import React from "react";
import { 
  Package, 
  Zap, 
  RefreshCw, 
  PieChart
} from "lucide-react";
import { getProductsBiData } from "@/app/actions/products-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function ProductsBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-products",
    getProductsBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Product Velocity & Category Performance Intelligence</h1>
            <p className="text-xs text-slate-400">Top-selling SKU rankings, picker walking speed, inventory turnover, and category margins</p>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Inventory Turnover</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.avgInventoryTurnover || "12.4x"}</span>
            <span className="text-xs font-semibold text-emerald-400">High Velocity</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Top Revenue Category</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold text-emerald-400 truncate">{loading ? "..." : data?.topCategory || "Fresh Dairy"}</span>
            <span className="text-xs font-semibold text-emerald-400">35% Share</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Pick Velocity</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">14.2s / item</span>
            <span className="text-xs font-semibold text-emerald-400">-1.8s faster</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Out-Of-Stock (OOS) Index</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">0.38%</span>
            <span className="text-xs font-semibold text-emerald-400">Target &lt;1%</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* SKU Velocity & Pick Speed Table */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">SKU Velocity & Picker Speed</h2>
            </div>
            <span className="text-xs text-slate-500">{data?.productRankings?.length || 0} SKUs Monitored</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">SKU Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Sold Today</th>
                  <th className="pb-3 font-semibold">Pick Time</th>
                  <th className="pb-3 font-semibold">Margin</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data?.productRankings?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-white">{p.name}</td>
                    <td className="py-3 text-slate-400 text-[10px]">{p.category}</td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">{p.unitsSoldToday} units</td>
                    <td className="py-3 font-mono text-slate-300">{p.pickVelocitySecs}</td>
                    <td className="py-3 font-mono text-emerald-400">{p.marginPct}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        p.stockStatus === "LOW STOCK" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {p.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Gross Margin Matrix */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <PieChart className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Category Margin & Turnover</h2>
          </div>

          <div className="space-y-3 text-xs">
            {data?.categoryPerformance?.map((cat, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-white">{cat.category}</span>
                  <span className="font-mono text-emerald-400">{cat.grossMargin} Margin</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Turnover: <strong className="text-white">{cat.turnoverRatio}</strong></span>
                  <span>OOS Rate: <strong className="text-emerald-400">{cat.OosRate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
