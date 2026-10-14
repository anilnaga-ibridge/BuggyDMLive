"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  LifeBuoy,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import {
  getRiderProfile,
  getRidersForDashboard,
  toggleRiderShiftStatus,
} from "@/app/actions/rider";
import { getErrorMessage } from "@/lib/errors";

type RiderTab = "orders" | "earnings" | "safety";

const SHIFT_STATUSES = ["Online", "On Break", "Offline", "Cash Settlement"];

export default function RiderUnifiedPage() {
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [activeTab, setActiveTab] = useState<RiderTab>("orders");
  const [statusMessage, setStatusMessage] = useState("");

  const ridersQuery = useQuery({
    queryKey: ["rider-dashboard-list"],
    queryFn: getRidersForDashboard,
  });
  const riders = ridersQuery.data || [];
  const effectiveRiderId = selectedRiderId || riders[0]?.id || "";

  const profileQuery = useQuery({
    queryKey: ["rider-dashboard-profile", effectiveRiderId],
    queryFn: () => getRiderProfile(effectiveRiderId),
    enabled: effectiveRiderId.length > 0,
  });
  const profile = profileQuery.data;

  const payoutTotal = useMemo(
    () => (profile?.payoutLogs || []).reduce(
      (sum, payout) => sum + Number(payout.total_payout || 0),
      0,
    ),
    [profile?.payoutLogs],
  );

  const handleStatusChange = async (status: string) => {
    if (!effectiveRiderId) return;
    try {
      await toggleRiderShiftStatus(effectiveRiderId, status);
      setStatusMessage(`Shift status updated to ${status}.`);
      void profileQuery.refetch();
      void ridersQuery.refetch();
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Failed to update shift status"));
    }
  };

  const isLoading = ridersQuery.isLoading || profileQuery.isLoading;
  const error = ridersQuery.error || profileQuery.error;

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-white">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Rider Operations Console</h1>
            <p className="text-xs text-slate-400">Assigned orders, shift state, and persisted payout records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={effectiveRiderId}
            onChange={(event) => setSelectedRiderId(event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white"
            aria-label="Select rider"
          >
            {riders.length === 0 && <option value="">No active riders</option>}
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>{rider.name} · {rider.phone}</option>
            ))}
          </select>
          <button
            onClick={() => void profileQuery.refetch()}
            disabled={!effectiveRiderId}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white disabled:opacity-40"
            aria-label="Refresh rider profile"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4" />
          {getErrorMessage(error, "Unable to load rider data")}
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          {statusMessage}
        </div>
      )}

      {profile && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Rider" value={profile.rider.name} icon={<User className="h-4 w-4" />} />
            <Metric label="Completed this shift" value={String(profile.session.orders_completed)} icon={<CheckCircle className="h-4 w-4" />} />
            <Metric label="Acceptance rate" value={`${profile.incentiveState.acceptanceRate}%`} icon={<ShieldCheck className="h-4 w-4" />} />
            <Metric label="Recent payouts" value={`₹${payoutTotal.toFixed(2)}`} icon={<IndianRupee className="h-4 w-4" />} />
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Shift status</h2>
                <p className="text-[11px] text-slate-500">Changes are persisted to the selected rider profile.</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                {profile.rider.status || "Offline"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {SHIFT_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => void handleStatusChange(status)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    profile.rider.status === status
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <nav className="grid grid-cols-3 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
            {([
              ["orders", "Assigned orders"],
              ["earnings", "Payout ledger"],
              ["safety", "Safety"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === tab ? "bg-emerald-500 text-black" : "text-slate-400"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {activeTab === "orders" && (
            <section className="space-y-3">
              {profile.assignedOrders.map((order) => (
                <article key={order.id} className="glass-panel rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-emerald-400">Order #{order.id}</p>
                      <h3 className="mt-1 text-sm font-semibold">{order.qcom_stage} · {order.order_status}</h3>
                    </div>
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] text-slate-300">
                      {order.distance.toFixed(1)} km
                    </span>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {order.delivery_address || "Delivery address unavailable"}
                  </p>
                  <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
                    <span>Delivery charge: ₹{Number(order.delivery_charge).toFixed(2)}</span>
                    <span>Tip: ₹{Number(order.dm_tips).toFixed(2)}</span>
                  </div>
                </article>
              ))}
              {profile.assignedOrders.length === 0 && <EmptyState text="No active orders are assigned to this rider." />}
            </section>
          )}

          {activeTab === "earnings" && (
            <section className="space-y-3">
              {profile.payoutLogs.map((payout) => (
                <article key={payout.id} className="glass-panel flex items-center justify-between rounded-2xl p-5">
                  <div>
                    <p className="font-mono text-xs text-slate-300">Order #{payout.order_id}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" /> {payout.created_at ? new Date(payout.created_at).toLocaleString() : "Time unavailable"}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">₹{Number(payout.total_payout).toFixed(2)}</span>
                </article>
              ))}
              {profile.payoutLogs.length === 0 && <EmptyState text="No persisted payout entries were found." />}
            </section>
          )}

          {activeTab === "safety" && (
            <section className="glass-panel rounded-2xl border border-rose-500/20 p-6 text-center">
              <LifeBuoy className="mx-auto h-10 w-10 text-rose-400" />
              <h2 className="mt-3 text-base font-bold">Emergency assistance</h2>
              <p className="mx-auto mt-1 max-w-lg text-xs text-slate-400">
                For immediate danger in India, contact the national emergency response number. Operational incident escalation must be configured per region before rider-app release.
              </p>
              <a href="tel:112" className="mt-4 inline-flex rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white">Call 112</a>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
      <p className="mt-2 truncate text-lg font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="glass-panel rounded-2xl p-10 text-center text-xs text-slate-500">{text}</div>;
}
