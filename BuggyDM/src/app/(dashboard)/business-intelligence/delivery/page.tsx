"use client";

import React from "react";
import { 
  Truck, 
  RefreshCw, 
  Users, 
} from "lucide-react";
import { getDeliveryBiData } from "@/app/actions/delivery-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function DeliveryBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-delivery",
    getDeliveryBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Delivery Intelligence & Fleet Analytics</h1>
            <p className="text-xs text-slate-400">Fleet utilization heatmaps, cost-per-order analytics, acceptance rates, and rider performance</p>
          </div>
        </div>

        <button 
          onClick={() => void refetch()}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cost Per Order (CPO)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.costMetrics?.costPerOrderAvg || "₹38.50"}</span>
            <span className="text-xs font-semibold text-emerald-400">-₹2.10 lower</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">On-Time Delivery Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.costMetrics?.onTimeDeliveryPct || "98.4%"}</span>
            <span className="text-xs font-semibold text-emerald-400">Target &ge;95%</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Fleet Mileage</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-violet-400">{loading ? "..." : data?.costMetrics?.totalDistanceCoveredKm || "1,240 km"}</span>
            <span className="text-xs font-semibold text-slate-400">Today</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Rider Rating</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.costMetrics?.avgRiderRating || "4.88 ⭐"}</span>
            <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </div>
        </div>
      </div>

      {/* Fleet Shift Status Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] uppercase font-bold text-slate-500">Online Riders</span>
          <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1">{loading ? "..." : data?.fleetStatus?.onlineCount || 14} active</h3>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500">
          <span className="text-[10px] uppercase font-bold text-slate-500">On Break</span>
          <h3 className="text-xl font-bold font-mono text-amber-400 mt-1">{loading ? "..." : data?.fleetStatus?.onBreakCount || 3} riders</h3>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-slate-600">
          <span className="text-[10px] uppercase font-bold text-slate-500">Offline</span>
          <h3 className="text-xl font-bold font-mono text-slate-400 mt-1">{loading ? "..." : data?.fleetStatus?.offlineCount || 5} riders</h3>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-violet-500">
          <span className="text-[10px] uppercase font-bold text-slate-500">Cash Settlement</span>
          <h3 className="text-xl font-bold font-mono text-violet-400 mt-1">{loading ? "..." : data?.fleetStatus?.cashSettlementCount || 2} riders</h3>
        </div>
      </div>

      {/* Rider Performance Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Rider Performance & Payout Leaderboard</h2>
          </div>
          <span className="text-xs text-slate-500">{data?.riderPerformanceList?.length || 0} Registered Riders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Rider Name</th>
                <th className="pb-3 font-semibold">Vehicle</th>
                <th className="pb-3 font-semibold">Shift Status</th>
                <th className="pb-3 font-semibold">Rating</th>
                <th className="pb-3 font-semibold">Completed Today</th>
                <th className="pb-3 font-semibold">Acceptance Rate</th>
                <th className="pb-3 font-semibold text-right">Daily Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {data?.riderPerformanceList?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/30">
                  <td className="py-3 font-semibold text-white">{r.name}</td>
                  <td className="py-3 text-slate-400 text-[10px]">{r.vehicleType}</td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      r.status === "Online"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs text-amber-400">⭐ {r.rating}</td>
                  <td className="py-3 font-mono text-xs text-white">{r.completedToday} orders</td>
                  <td className="py-3 font-mono text-xs text-violet-400">{r.acceptanceRate}</td>
                  <td className="py-3 font-mono text-xs text-emerald-400 text-right font-bold">{r.payoutTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
