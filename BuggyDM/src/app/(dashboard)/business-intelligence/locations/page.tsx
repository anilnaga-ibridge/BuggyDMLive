"use client";

import React from "react";
import { 
  MapPin, 
  Compass, 
  RefreshCw, 
  Globe,
} from "lucide-react";
import { getLocationsBiData } from "@/app/actions/locations-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function LocationsBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-locations",
    getLocationsBiData,
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Store Location Expansion & Geofencing Intelligence</h1>
            <p className="text-xs text-slate-400">Micro-fulfillment catchment polygons, SLA delivery radius hex rings, and site expansion feasibility</p>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Service Coverage</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.totalCoverageAreaKm2 || "48.5 km²"}</span>
            <span className="text-xs font-semibold text-emerald-400">Dense Hex Rings</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Micro-Fulfillment Centers</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.activeLocations?.length || 4}</span>
            <span className="text-xs font-semibold text-emerald-400">Operational</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pipeline Expansion Sites</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{loading ? "..." : data?.proposedExpansionSites?.length || 3}</span>
            <span className="text-xs font-semibold text-amber-400">In Pipeline</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Catchments Table */}
        <div className="col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Store Catchment Polygons</h2>
            </div>
          </div>

          <div className="space-y-3">
            {data?.activeLocations?.map((loc) => (
              <div key={loc.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 space-y-2 text-xs">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-white">{loc.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {loc.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{loc.address}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-850">
                  <span>Radius: <strong className="text-white">{loc.serviceRadiusKm}</strong></span>
                  <span>Target SLA: <strong className="text-emerald-400">{loc.slaDeliveryTarget}</strong></span>
                  <span>Density: <strong className="text-amber-400">{loc.populationDensity}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expansion Site Feasibility Index */}
        <div className="col-span-5 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Globe className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Expansion Site Feasibility</h2>
          </div>

          <div className="space-y-3 text-xs">
            {data?.proposedExpansionSites?.map((site) => (
              <div key={site.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-white">{site.locationName}</span>
                  <span className="font-mono text-emerald-400 font-bold">{site.feasibilityScore} Score</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Est. Orders: <strong className="text-white">{site.estDailyOrders}/day</strong></span>
                  <span>Payback: <strong className="text-amber-400">{site.estPaybackMonths} mos</strong></span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded inline-block ${
                  site.status === "APPROVED FOR LAUNCH" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {site.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
