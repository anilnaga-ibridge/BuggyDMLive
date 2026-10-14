"use client";

import React, { useState } from "react";
import { 
  Users, 
  AlertOctagon, 
  Play, 
  Pause, 
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Flag
} from "lucide-react";
import {
  assignOperatorToStation,
  getSupervisorDashboardMetrics,
  resolveOperationsException,
  updateStationAssignmentStatus,
} from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function SupervisorPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "ops-supervisor",
    getSupervisorDashboardMetrics,
    15_000,
  );
  const metrics = data || {
    delayedPicks: 0,
    qcPending: 0,
    activePackers: 0,
    ridersWaiting: 0,
    exceptions: [],
    operators: [],
    stations: [],
  };
  const { exceptions, operators, stations } = metrics;

  const [assigneeId, setAssigneeId] = useState("");
  const [stationType, setStationType] = useState("");
  const [stationIdentifier, setStationIdentifier] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleToggleStation = async (id: string, currentStatus: string) => {
    try {
      await updateStationAssignmentStatus(id, currentStatus === "active" ? "paused" : "active");
      void refetch();
    } catch (error) {
      setSuccessMsg(getErrorMessage(error, "Failed to update station"));
    }
  };

  const handleResolveException = async (id: string) => {
    try {
      await resolveOperationsException(id, "Resolved from supervisor operations console");
      setSuccessMsg("Exception resolved and audit trail updated");
      void refetch();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setSuccessMsg(getErrorMessage(error, "Failed to resolve exception"));
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !stationType) return;

    const op = operators.find((o) => o.id === assigneeId);
    try {
      await assignOperatorToStation(assigneeId, stationType, stationIdentifier);
      setSuccessMsg(`Assigned ${op?.name || "operator"} to ${stationType}.`);
      setAssigneeId("");
      setStationType("");
      setStationIdentifier("");
      void refetch();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setSuccessMsg(getErrorMessage(error, "Failed to assign operator"));
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Metrics alerts banner */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Delayed Picks</p>
            <h3 className="text-xl font-bold font-mono text-rose-500 mt-1">{loading ? "..." : metrics.delayedPicks}</h3>
          </div>
          <AlertOctagon className="w-8 h-8 text-rose-500/30" />
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">QC Pending</p>
            <h3 className="text-xl font-bold font-mono text-amber-500 mt-1">{loading ? "..." : metrics.qcPending}</h3>
          </div>
          <Flag className="w-8 h-8 text-amber-500/30" />
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Staff</p>
            <h3 className="text-xl font-bold font-mono text-emerald-500 mt-1">{loading ? "..." : metrics.activePackers}</h3>
          </div>
          <Users className="w-8 h-8 text-emerald-500/30" />
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Riders Waiting</p>
            <h3 className="text-xl font-bold font-mono text-violet-500 mt-1">{loading ? "..." : metrics.ridersWaiting}</h3>
          </div>
          <Users className="w-8 h-8 text-violet-500/30" />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Relocations & Active Stations */}
        <div className="col-span-8 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">Dark Store Station Status</h2>
            <button onClick={() => void refetch()} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          
          <div className="space-y-3 mb-6">
            {stations.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-850 bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  <div>
                    <h3 className="text-xs font-semibold">{s.name}</h3>
                    <p className="text-[10px] text-slate-500">Operator: {s.operatorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => void handleToggleStation(s.id, s.status)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      s.status === "active" 
                        ? "border-rose-500/20 text-rose-400 hover:bg-rose-500/5" 
                        : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"
                    }`}
                  >
                    {s.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Relocation Staff Form */}
          <form onSubmit={handleAssignStaff} className="bg-slate-950/20 p-5 border border-slate-800/80 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Relocate Operator</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select 
                value={assigneeId} 
                onChange={(e) => setAssigneeId(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2.5 text-white"
              >
                <option value="">-- Choose Operator --</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>

              <select 
                value={stationType}
                onChange={(e) => setStationType(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2.5 text-white"
              >
                <option value="">-- Station Type --</option>
                {['Picking', 'Packing', 'QC', 'Dispatch', 'Inventory', 'Returns'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                value={stationIdentifier}
                onChange={(e) => setStationIdentifier(e.target.value)}
                placeholder="Desk / zone (optional)"
                className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2.5 text-white"
              />
            </div>

            <button 
              type="submit"
              disabled={!assigneeId || !stationType}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Confirm Operator Relocation</span>
            </button>
          </form>
        </div>

        {/* Exceptions Log List */}
        <div className="col-span-4 glass-panel rounded-2xl p-6 flex flex-col">
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-5">Station Exceptions Log</h2>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {exceptions.map((ex) => (
              <div key={ex.id} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    {ex.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Order #{ex.orderId}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ex.details}</p>
                <button
                  onClick={() => void handleResolveException(ex.id)}
                  className="w-full py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] uppercase rounded border border-rose-500/30 cursor-pointer transition-all"
                >
                  Resolve Exception Override
                </button>
              </div>
            ))}

            {exceptions.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-10">No active station exceptions logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
