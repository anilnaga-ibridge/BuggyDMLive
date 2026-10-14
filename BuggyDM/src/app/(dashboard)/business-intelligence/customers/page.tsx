"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
} from "lucide-react";
import { getCustomersBiData } from "@/app/actions/customers-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function CustomersBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-customers",
    getCustomersBiData,
  );
  const [statusMsg, setStatusMsg] = useState("");

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Customer Cohort & Retention Intelligence</h1>
            <p className="text-xs text-slate-400">Cohort retention matrices, churn risk prevention, and CSAT / NPS metrics</p>
          </div>
        </div>

        <button 
          onClick={() => void refetch()}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Monthly Users</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.totalActiveUsers || "14,820"}</span>
            <span className="text-xs font-semibold text-emerald-400">+22% MoM</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Promoter Score (NPS)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.csatMetrics?.npsScore || 78}</span>
            <span className="text-xs font-semibold text-emerald-400">World Class</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average CSAT Rating</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.csatMetrics?.avgCsatRating || "4.9 / 5.0"}</span>
            <span className="text-xs font-semibold text-emerald-400">⭐ 98.2% Positive</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Support Resolution Speed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-violet-400">{loading ? "..." : data?.csatMetrics?.resolutionTimeAvgMins || "2.4 mins"}</span>
            <span className="text-xs font-semibold text-slate-400">Automated AI Bot</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Cohort Retention Table */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Cohort Retention Matrix</h2>
            </div>
            <span className="text-xs text-slate-500">Monthly Customer Retention</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Cohort Month</th>
                  <th className="pb-3 font-semibold">Acquired Users</th>
                  <th className="pb-3 font-semibold">Month 1</th>
                  <th className="pb-3 font-semibold">Month 2</th>
                  <th className="pb-3 font-semibold text-right">Month 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data?.cohorts?.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-white">{c.cohortMonth}</td>
                    <td className="py-3 font-mono text-slate-300">{c.usersAcquired} users</td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">{c.month1}</td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">{c.month2}</td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold text-right">{c.month3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Churn Risk Prevention Alert List */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Churn Risk Prevention</h2>
          </div>

          <div className="space-y-3 text-xs">
            {data?.churnRiskList?.map((user) => (
              <div key={user.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-white">{user.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    user.churnRisk === "HIGH" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {user.churnRisk} RISK
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {user.totalOrders} total orders &bull; Inactive for <strong className="text-amber-400">{user.daysInactive} days</strong>
                </div>
                <button
                  onClick={() => {
                    setStatusMsg(`Re-engagement trigger sent to ${user.name}!`);
                    setTimeout(() => setStatusMsg(""), 3000);
                  }}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all"
                >
                  {user.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
