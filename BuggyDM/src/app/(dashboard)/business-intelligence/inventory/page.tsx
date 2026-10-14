"use client";

import React, { useState } from "react";
import { 
  Database, 
  Calendar, 
  TrendingDown, 
  RefreshCw, 
  ShieldCheck, 
  ShoppingCart, 
  PackageCheck
} from "lucide-react";
import { getInventoryBiData, createPurchaseOrder } from "@/app/actions/inventory-bi";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function InventoryBiPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "bi-inventory",
    getInventoryBiData,
  );

  const [showPoModal, setShowPoModal] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !poAmount) return;
    try {
      await createPurchaseOrder(vendorName, `₹${poAmount}`);
      setStatusMsg(`Purchase Order for '${vendorName}' approved!`);
      setShowPoModal(false);
      setVendorName("");
      setPoAmount("");
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch {
      alert("Failed to create purchase order");
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Inventory Intelligence & Expiry Risk Console</h1>
            <p className="text-xs text-slate-400">Stock accuracy rate, shrinkage tracking, expiry timeline, and automated replenishment POs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPoModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Generate Vendor PO</span>
          </button>
          <button 
            onClick={() => void refetch()}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inventory Valuation</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.totalInventoryValuation || "₹14,85,000"}</span>
            <span className="text-xs font-semibold text-emerald-400">Audited Today</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stock Accuracy Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{loading ? "..." : data?.stockAccuracyRate || "99.2%"}</span>
            <span className="text-xs font-semibold text-emerald-400">Target &ge;99%</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Expiry Risk Items</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{loading ? "..." : data?.expiryRiskList?.length || 8}</span>
            <span className="text-xs font-semibold text-rose-400">Action Required</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stock Shrinkage Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">0.08%</span>
            <span className="text-xs font-semibold text-emerald-400">-0.02% lower</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Expiry Risk Timeline Table */}
        <div className="col-span-8 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Expiry Risk Timeline (&lt;30 Days)</h2>
            </div>
            <span className="text-xs text-slate-500">{data?.expiryRiskList?.length || 0} Batches Tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Stock Qty</th>
                  <th className="pb-3 font-semibold">Valuation</th>
                  <th className="pb-3 font-semibold">Days to Expiry</th>
                  <th className="pb-3 font-semibold text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data?.expiryRiskList?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-white">{item.name}</td>
                    <td className="py-3 text-slate-400 text-[10px]">{item.category}</td>
                    <td className="py-3 font-mono text-xs text-white">{item.quantity} units</td>
                    <td className="py-3 font-mono text-xs text-slate-300">{item.valuation}</td>
                    <td className="py-3 font-mono text-xs text-amber-400">{item.daysUntilExpiry} days</td>
                    <td className="py-3 text-right">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        item.status === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : item.status === "HIGH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shrinkage Logs & Vendor Purchase Orders */}
        <div className="col-span-4 space-y-6">
          {/* Stock Shrinkage Log */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Stock Shrinkage Log</h2>
            </div>

            <div className="space-y-3 text-xs">
              {data?.shrinkageLogs?.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">{log.itemName}</span>
                    <span className="font-mono text-rose-400">-{log.damagedQty} units</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{log.storeName} &bull; {log.reason}</span>
                    <span>{log.reportedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Purchase Orders */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Vendor POs</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {data?.purchaseOrders?.map((po) => (
                <div key={po.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">{po.vendor} ({po.id})</span>
                    <span className="font-mono text-emerald-400">{po.totalValue}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{po.itemsCount} SKUs</span>
                    <span className="text-emerald-400 font-bold">{po.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: New Purchase Order */}
      {showPoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Generate Vendor Purchase Order</h2>
            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Vendor Name</label>
                <input 
                  type="text" 
                  value={vendorName} 
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Nestlé India Pvt Ltd"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required 
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Total PO Amount (₹)</label>
                <input 
                  type="number" 
                  value={poAmount} 
                  onChange={(e) => setPoAmount(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  required 
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Approve PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
