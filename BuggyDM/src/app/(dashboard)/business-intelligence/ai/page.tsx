"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
} from "lucide-react";
import { getAiDemandForecast, generateReplenishmentTask } from "@/app/actions/ai-forecast";
import { useActionQuery } from "@/hooks/useActionQuery";
import { getErrorMessage } from "@/lib/errors";

type ForecastItem = Awaited<
  ReturnType<typeof getAiDemandForecast>
>["stockOutPredictions"][number];

export default function AiInsightsPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-ai-forecast",
    getAiDemandForecast,
  );
  const [statusMsg, setStatusMsg] = useState("");

  const handleReplenish = async (item: ForecastItem) => {
    try {
      await generateReplenishmentTask(item.id, item.binCode, 50);
      setStatusMsg(`Replenished +50 units to ${item.binCode} (${item.itemName})`);
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to replenish inventory"));
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Demand Forecasting & Predictive Replenishment</h1>
            <p className="text-xs text-slate-400">Stock-out prediction algorithms, picker route optimization, and automated bin replenishment</p>
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

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Stock-Out Risk Predictor */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Predictive Stock-Out Risk Index</h2>
            </div>
            <span className="text-xs text-slate-500">{data?.stockOutPredictions?.length || 0} Bins Monitored</span>
          </div>

          <div className="space-y-3">
            {data?.stockOutPredictions?.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{item.itemName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.binCode}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Qty: <strong className="text-white">{item.currentQuantity}</strong> &bull; Burn Rate: <strong className="text-amber-400">{item.burnRatePerHour} units/hr</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      item.riskLevel === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : item.riskLevel === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {item.hoursRemaining}h to empty
                    </span>
                  </div>

                  <button
                    onClick={() => handleReplenish(item)}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all"
                  >
                    +50 Replenish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Basket Correlation & Slotting Recommendations */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Slotting Recommendations</h2>
          </div>

          <div className="space-y-4">
            {data?.slottingRecommendations?.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{rec.itemA} + {rec.itemB}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    {rec.correlation} Co-occurrence
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rec.recommendation}</p>
                <button
                  onClick={() => {
                    setStatusMsg(`Applied AI slotting recommendation for ${rec.itemA}!`);
                    setTimeout(() => setStatusMsg(""), 3000);
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all"
                >
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
