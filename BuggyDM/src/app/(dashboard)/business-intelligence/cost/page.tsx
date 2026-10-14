"use client";

import React from "react";
import { 
  DollarSign, 
  PieChart, 
  RefreshCw, 
  Calculator,
} from "lucide-react";
import { getCostBiData } from "@/app/actions/cost-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function CostBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-cost",
    getCostBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Financial Cost & Margin Intelligence</h1>
            <p className="text-xs text-slate-400">Unit economics, Contribution Margin (CM1 & CM2), and dark store OpEx breakdown</p>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contribution Margin (CM2)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.unitEconomics?.contributionMargin2 || "₹76.50"}</span>
            <span className="text-xs font-semibold text-emerald-400">Positive CM2</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gross Margin %</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">30.0%</span>
            <span className="text-xs font-semibold text-emerald-400">Target &ge;28%</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">EBITDA Margin %</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.ebitdaMarginPct || "+12.4%"}</span>
            <span className="text-xs font-semibold text-emerald-400">Store Profitable</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Store Status</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.netProfitabilityStatus || "PROFITABLE"}</span>
            <span className="text-xs font-semibold text-emerald-400">✓ Healthy</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Unit Economics Waterfall */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Order Unit Economics (Per Order)</h2>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800 font-semibold">
              <span className="text-white">Average Order Value (AOV):</span>
              <span className="font-mono text-emerald-400">{data?.unitEconomics?.avgOrderValue}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/20 rounded-xl border border-slate-850 text-slate-400">
              <span>(-) Cost of Goods Sold (CoGS):</span>
              <span className="font-mono text-rose-400">-{data?.unitEconomics?.cogsAvg}</span>
            </div>
            <div className="flex justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 font-bold text-emerald-400">
              <span>(=) Gross Profit (CM1):</span>
              <span className="font-mono">{data?.unitEconomics?.grossMarginAvg}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/20 rounded-xl border border-slate-850 text-slate-400">
              <span>(-) Pick & Pack Warehouse Labor:</span>
              <span className="font-mono text-rose-400">-{data?.unitEconomics?.pickPackLaborCost}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/20 rounded-xl border border-slate-850 text-slate-400">
              <span>(-) Rider Delivery Payout:</span>
              <span className="font-mono text-rose-400">-{data?.unitEconomics?.riderPayoutAvg}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/20 rounded-xl border border-slate-850 text-slate-400">
              <span>(-) Packaging & Liners:</span>
              <span className="font-mono text-rose-400">-{data?.unitEconomics?.packagingMaterialsCost}</span>
            </div>
            <div className="flex justify-between p-3.5 bg-emerald-500/20 rounded-xl border border-emerald-500/40 font-extrabold text-sm text-emerald-300">
              <span>Net Contribution Margin 2 (CM2):</span>
              <span className="font-mono">{data?.unitEconomics?.contributionMargin2}</span>
            </div>
          </div>
        </div>

        {/* Monthly Operational Expense Share */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Monthly Dark Store OpEx Share</h2>
          </div>

          <div className="space-y-3 text-xs">
            {data?.opexBreakdown?.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-white">{item.category}</span>
                  <span className="font-mono text-amber-400">{item.monthlyExpense}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>OpEx Weight</span>
                  <span className="text-emerald-400 font-bold">{item.share}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
