"use client";

import React from "react";
import { 
  Sparkles,
  Zap,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import {
  getManagerDashboardMetrics,
  resolveManagerRecommendation,
} from "@/app/actions/ops";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function ManagerPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "ops-manager",
    getManagerDashboardMetrics,
    30_000,
  );
  const metricsData = data || {
    processedOrders: "0",
    slaCompliance: "0.0%",
    pendingOrders: 0,
    avgPickTime: "N/A",
    avgPackTime: "N/A",
    handoverSlaSecs: 0,
    recommendations: [],
  };

  const handleApplyRec = async (id: string) => {
    await resolveManagerRecommendation(id, "applied");
    void refetch();
  };

  const metrics = [
    { title: "Processed Orders", value: metricsData.processedOrders },
    { title: "SLA Compliance", value: metricsData.slaCompliance },
    { title: "Pending Orders", value: metricsData.pendingOrders },
    { title: "Handover SLA", value: metricsData.handoverSlaSecs > 0 ? `${metricsData.handoverSlaSecs}s` : "N/A" },
  ];

  return (
    <div className="space-y-6 text-white">
      {/* Top row analytics overview */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-2xl relative">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{m.title}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono">{loading ? "..." : m.value}</span>
              <span className="text-xs font-semibold text-slate-500">Live</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main split */}
      <div className="grid grid-cols-12 gap-6">
        {/* Operations speed analysis charts */}
        <div className="col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">Fulfillment Speed Analysis</h2>
              <button onClick={() => void refetch()} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            {/* Visual Bar Charts */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Picking Speed (mins/order)</span>
                  <span className="font-mono text-emerald-400">{metricsData.avgPickTime}</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: "70%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Packing Efficiency (mins/order)</span>
                  <span className="font-mono text-emerald-400">{metricsData.avgPackTime}</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Rider Handover SLA (secs)</span>
                  <span className="font-mono text-violet-400">{metricsData.handoverSlaSecs > 0 ? `${metricsData.handoverSlaSecs}s` : "N/A"}</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-full rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-5 mt-6 flex justify-between items-center text-xs text-slate-500">
            <span>SLA breach threshold configured: 10 mins</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Normal Status
            </span>
          </div>
        </div>

        {/* AI Recommendations panel */}
        <div className="col-span-5 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">AI Recommendations</h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {metricsData.recommendations.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">{r.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">{r.description}</p>
                <button 
                  onClick={() => void handleApplyRec(r.id)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                >
                  {r.action}
                </button>
              </div>
            ))}
            {metricsData.recommendations.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-10">No pending optimization recommendations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
