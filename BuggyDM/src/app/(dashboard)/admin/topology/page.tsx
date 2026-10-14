"use client";

import React, { useState } from "react";
import {
  Store,
  Plus,
  RefreshCw,
  MapPin,
  Box,
  Database,
  CheckCircle,
  Grid
} from "lucide-react";
import { getDarkStores, createDarkStore, createTopologyBin } from "@/app/actions/topology";
import { getErrorMessage } from "@/lib/errors";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function TopologyPage() {
  const { data: stores = [], isLoading: loading, refetch } = useActionQuery(
    "admin-dark-stores",
    getDarkStores,
  );
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLat, setStoreLat] = useState(17.44);
  const [storeLng, setStoreLng] = useState(78.34);

  const [showBinModal, setShowBinModal] = useState(false);
  const [binZone, setBinZone] = useState("Zone A (Ambient)");
  const [binRack, setBinRack] = useState("RACK-A1");
  const [binShelf, setBinShelf] = useState("SHELF-1");
  const [binCodeInput, setBinCodeInput] = useState("");

  const [statusMsg, setStatusMsg] = useState("");

  const effectiveStoreId = selectedStoreId || stores[0]?.id || "";
  const activeStore = stores.find((s) => s.id === effectiveStoreId) || stores[0];

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storeCode) return;
    try {
      await createDarkStore(storeName, storeCode, storeAddress, storeLat, storeLng);
      setStatusMsg(`Dark Store '${storeName}' created successfully!`);
      setShowStoreModal(false);
      setStoreName("");
      setStoreCode("");
      setStoreAddress("");
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to create dark store"));
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!binCodeInput || !effectiveStoreId) return;
    try {
      await createTopologyBin(effectiveStoreId, binZone, binRack, binShelf, binCodeInput);
      setStatusMsg(`Bin '${binCodeInput}' created in ${binZone}!`);
      setShowBinModal(false);
      setBinCodeInput("");
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to create topology bin"));
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dark Store Topology & Shelf-Level Micro-Inventory</h1>
            <p className="text-xs text-slate-400">Physical Zone $\rightarrow$ Rack $\rightarrow$ Shelf $\rightarrow$ Bin mapping for sub-90s picker path optimization</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStoreModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Dark Store</span>
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
          <CheckCircle className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Select Store Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
              effectiveStoreId === store.id
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{store.name} ({store.code})</span>
          </button>
        ))}
      </div>

      {activeStore && (
        <div className="grid grid-cols-12 gap-6">
          {/* Store Layout Overview */}
          <div className="col-span-4 glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold">{activeStore.name}</h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1 inline-block">
                  {activeStore.code}
                </span>
              </div>
              <Box className="w-8 h-8 text-slate-700" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-300 text-right">{activeStore.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Capacity / hr:</span>
                <span className="font-mono text-emerald-400">{activeStore.capacity_orders} orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical Bins:</span>
                <span className="font-mono text-slate-300">{activeStore.topology?.length || 0}</span>
              </div>
            </div>

            <button
              onClick={() => setShowBinModal(true)}
              className="w-full py-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topology Bin (Zone/Rack/Shelf)</span>
            </button>
          </div>

          {/* Topology Rack / Bin Grid */}
          <div className="col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Physical Bin Layout Grid</h2>
                </div>
                <span className="text-xs text-slate-500">{activeStore.topology?.length || 0} Defined Bins</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {activeStore.topology?.map((bin) => (
                  <div key={bin.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {bin.bin_code}
                      </span>
                      <span className="text-[10px] text-slate-500">{bin.zone}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold">
                      {bin.rack_code} &bull; {bin.shelf}
                    </div>
                  </div>
                ))}

                {(!activeStore.topology || activeStore.topology.length === 0) && (
                  <p className="col-span-3 text-xs text-slate-500 italic text-center py-10">No topology bins mapped for this dark store.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bin Stock Audit Table */}
          <div className="col-span-12 glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Bin-Level Stock Audit</h2>
              </div>
              <span className="text-xs text-slate-500">{activeStore.inventory?.length || 0} Stock Mappings</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Exact Bin Code</th>
                    <th className="pb-3 font-semibold">Available Stock</th>
                    <th className="pb-3 font-semibold">Reserved Stock</th>
                    <th className="pb-3 font-semibold">Stock Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {activeStore.inventory?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/30">
                      <td className="py-3 font-semibold text-white">
                        {inv.item?.name || `Item #${inv.item_id}`}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-emerald-400">
                        {inv.bin_code}
                      </td>
                      <td className="py-3 font-mono text-xs text-white">
                        {inv.quantity} units
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-400">
                        {inv.reserved_qty} units
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          inv.quantity > 10
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {inv.quantity > 10 ? "Optimal Stock" : "Low Stock Alert"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {(!activeStore.inventory || activeStore.inventory.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-xs text-slate-500 italic text-center py-8">
                        No bin-level inventory mapped for this store yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Dark Store */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Create Dark Store Location</h2>
            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Hitech City Micro-Fulfillment Center"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Store Code</label>
                <input
                  type="text"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  placeholder="e.g. DS-HYD-HITECH"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="e.g. Cyber Towers Road, Hyderabad"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeLat}
                    onChange={(e) => setStoreLat(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeLng}
                    onChange={(e) => setStoreLng(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Topology Bin */}
      {showBinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Add Topology Bin</h2>
            <form onSubmit={handleCreateBin} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Temperature Zone</label>
                <select
                  value={binZone}
                  onChange={(e) => setBinZone(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Zone A (Ambient)">Zone A (Ambient)</option>
                  <option value="Zone B (Chilled)">Zone B (Chilled)</option>
                  <option value="Zone C (Frozen)">Zone C (Frozen)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Rack Code</label>
                  <input
                    type="text"
                    value={binRack}
                    onChange={(e) => setBinRack(e.target.value)}
                    placeholder="e.g. RACK-A2"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Shelf</label>
                  <input
                    type="text"
                    value={binShelf}
                    onChange={(e) => setBinShelf(e.target.value)}
                    placeholder="e.g. SHELF-3"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Exact Bin Code</label>
                <input
                  type="text"
                  value={binCodeInput}
                  onChange={(e) => setBinCodeInput(e.target.value)}
                  placeholder="e.g. BIN-A2-03"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBinModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Save Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
