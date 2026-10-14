"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { getDeliveryBoysList, getDeliveryBoysMetrics, updateDeliveryBoyStatusAction, DeliveryBoyData } from "@/app/actions/delivery";
import { getDeliveryBoyImageUrl } from "@/lib/images";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Phone, 
  Mail, 
  Activity, 
  UserCheck, 
  UserMinus, 
  AlertCircle
} from "lucide-react";

interface Metrics {
  total: number;
  online: number;
  offline: number;
  delivering: number;
}

interface DeliveryBoysListProps {
  initialMetrics: Metrics;
}

function DeliveryBoyAvatar({ image, name }: { image: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getDeliveryBoyImageUrl(image);

  if (!imageUrl || hasError) {
    return <User className="w-4 h-4 text-slate-500" />;
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      width={40}
      height={40}
      unoptimized
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

export default function DeliveryBoysList({ initialMetrics }: DeliveryBoysListProps) {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoyData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "online", "offline", "delivering"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [listResult, metricsResult] = await Promise.all([
        getDeliveryBoysList({
          search: search || undefined,
          statusFilter: statusFilter || undefined,
          page,
          limit,
        }),
        getDeliveryBoysMetrics(),
      ]);

      setDeliveryBoys(listResult.deliveryBoys);
      setTotal(listResult.total);
      setMetrics(metricsResult);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch delivery boys metadata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getDeliveryBoysList({ statusFilter: statusFilter || undefined, page, limit }),
      getDeliveryBoysMetrics(),
    ]).then(([listResult, metricsResult]) => {
      if (cancelled) return;
      setDeliveryBoys(listResult.deliveryBoys);
      setTotal(listResult.total);
      setMetrics(metricsResult);
      setLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error(error);
      setError("Failed to fetch delivery boys metadata.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [limit, page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setError("");
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) return;

    startTransition(async () => {
      const result = await updateDeliveryBoyStatusAction(targetId, !currentActive);
      if (result.success) {
        // Optimistically update local list state
        setDeliveryBoys((prev) =>
          prev.map((dm) => (dm.id === id ? { ...dm, active: !currentActive } : dm))
        );
        // Refresh full metrics & list
        const metricsResult = await getDeliveryBoysMetrics();
        setMetrics(metricsResult);
      } else {
        setError(result.error || "Failed to update online status.");
      }
    });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
        <p className="text-slate-400 text-xs mt-1">Track active riders, view live delivery statuses, and toggle online shifts</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Header Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Riders */}
        <div className="kpi-gradient-categories p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Riders</p>
            <p className="text-lg font-bold text-white mt-1">{metrics.total}</p>
          </div>
          <User className="w-5 h-5 text-violet-400 opacity-80" />
        </div>

        {/* Online Riders */}
        <div className="kpi-gradient-total p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online Shifts</p>
            <p className="text-lg font-bold text-emerald-450 mt-1">{metrics.online}</p>
          </div>
          <UserCheck className="w-5 h-5 text-emerald-450 opacity-80" />
        </div>

        {/* Delivering Riders */}
        <div className="kpi-gradient-schedules p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivering (Busy)</p>
            <p className="text-lg font-bold text-amber-500 mt-1">{metrics.delivering}</p>
          </div>
          <Activity className="w-5 h-5 text-amber-500 opacity-80" />
        </div>

        {/* Offline Riders */}
        <div className="kpi-gradient-outOfStock p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Offline (Away)</p>
            <p className="text-lg font-bold text-rose-450 mt-1">{metrics.offline}</p>
          </div>
          <UserMinus className="w-5 h-5 text-rose-450 opacity-80" />
        </div>
      </div>

      {/* Filtering Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800/80">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search riders by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-500" />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Shifts</option>
            <option value="online">Online Riders</option>
            <option value="offline">Offline Riders</option>
            <option value="delivering">Active Deliveries</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
              loadData();
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Delivery Table */}
      <div className="flex-1 glass-panel border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deliveryBoys.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <User className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
            <p className="text-xs text-slate-400 font-semibold">No delivery men found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Avatar</th>
                  <th className="py-3.5 px-4">Rider Info</th>
                  <th className="py-3.5 px-4 w-44">Contact Details</th>
                  <th className="py-3.5 px-4 w-40 text-center">Active Deliveries</th>
                  <th className="py-3.5 px-4 w-40 text-center">Completed Deliveries</th>
                  <th className="py-3.5 px-4 w-32 text-center">Live Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">Shift Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {deliveryBoys.map((dm) => (
                  <tr key={dm.id} className="hover:bg-slate-900/10 transition-colors">
                    {/* Avatar */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto overflow-hidden">
                        <DeliveryBoyAvatar image={dm.image} name={dm.f_name} />
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-white truncate">{dm.f_name} {dm.l_name}</p>
                      <p className="text-[9px] text-slate-500 font-bold mt-0.5">Rider ID: #{dm.id}</p>
                    </td>

                    {/* Contact */}
                    <td className="py-2.5 px-4 space-y-1">
                      <p className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-600 shrink-0" />
                        <span>{dm.phone}</span>
                      </p>
                      {dm.email && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[150px]">{dm.email}</span>
                        </p>
                      )}
                    </td>

                    {/* Current Orders */}
                    <td className="py-2.5 px-4 text-center">
                      {dm.current_orders > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
                          {dm.current_orders} ORDERS BUSY
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Order Count */}
                    <td className="py-2.5 px-4 text-center font-bold text-slate-300">
                      {dm.order_count} trips
                    </td>

                    {/* Live Status Badge */}
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        dm.active
                          ? dm.current_orders > 0
                            ? "bg-amber-500/10 border-amber-500/25 text-amber-450"
                            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-500"
                      }`}>
                        {dm.active
                          ? dm.current_orders > 0
                            ? "DELIVERING"
                            : "ONLINE"
                          : "OFFLINE"}
                      </span>
                    </td>

                    {/* Shift Toggle switch */}
                    <td className="py-2.5 px-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dm.active}
                          onChange={() => handleToggleActive(dm.id, dm.active)}
                          disabled={isPending}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:height-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-[#070a13] peer-checked:after:border-transparent disabled:opacity-40"></div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && deliveryBoys.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span className="text-xs text-slate-500">
            Showing <span className="text-slate-300">{(page - 1) * limit + 1}</span> to{" "}
            <span className="text-slate-300">
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="text-slate-300">{total}</span> riders
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
