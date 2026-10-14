"use client";

import React, { useState, useEffect } from "react";
import { 
  Printer, 
  Trash2, 
  Plus, 
  Clock, 
  Weight, 
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { 
  getAwaitingPackingOrders, 
  startPackingSession, 
  createPackedPackage, 
  completePackingSession 
} from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type PackingOrder = Awaited<
  ReturnType<typeof getAwaitingPackingOrders>
>[number];
type PackingSessionData = Awaited<ReturnType<typeof startPackingSession>>;
type PackedItem = PackingSessionData["items"][number];
type CreatedPackage = {
  id: string;
  size: string;
  weight: number;
};

export default function PackerPage() {
  const [orders, setOrders] = useState<PackingOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PackingOrder | null>(null);
  const [activePackSession, setActivePackSession] = useState<PackingSessionData["session"] | null>(null);
  const [packedItems, setPackedItems] = useState<PackedItem[]>([]);
  const [packages, setPackages] = useState<CreatedPackage[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [bagSize, setBagSize] = useState("Medium Bag");
  const [manualWeight, setManualWeight] = useState("1.5");
  const [printLogs, setPrintLogs] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });

  // Packing Desk Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (activeOrder) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeOrder]);

  // Load packing queue on mount
  useEffect(() => {
    let cancelled = false;
    void getAwaitingPackingOrders()
      .then((queue) => {
        if (cancelled) return;
        setOrders(queue || []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to load packing queue:", error);
        setScanMessage({
          text: getErrorMessage(error, "Failed to load packing queue"),
          type: "error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getFormattedTime = () => {
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const secs = String(timerSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleSelectOrder = async (order: PackingOrder) => {
    setActiveOrder(order);
    setTimerSeconds(0);
    setPrintLogs([]);
    setScanMessage({ text: "Starting packing session...", type: "info" });

    try {
      const data = await startPackingSession(order.id, "1"); // Packer ID = 1
      setActivePackSession(data.session);
      setPackedItems(data.items || []);
      setPackages([]);
      setScanMessage({ text: "Items loaded. Bag items and enter weight.", type: "success" });
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to start packing session"), type: "error" });
    }
  };

  // Add package to this order
  const handleAddPackage = async () => {
    if (!activeOrder || !activePackSession) return;
    if (!manualWeight) {
      setScanMessage({ text: "Please enter package weight", type: "error" });
      return;
    }

    try {
      const weightNum = parseFloat(manualWeight);
      setScanMessage({ text: "Generating package label...", type: "info" });

      const pkg = await createPackedPackage({
        orderId: activeOrder.id,
        packSessionId: activePackSession.id.toString(),
        weight: weightNum,
        packagingType: bagSize,
        items: packedItems.map((i) => ({ itemId: i.itemId, quantity: i.quantity }))
      });

      const newPkg = {
        id: pkg.package_id,
        size: pkg.packaging_type,
        weight: pkg.weight
      };

      setPackages((current) => [...current, newPkg]);
      setPrintLogs((prev) => [...prev, `[PrintQueue] Printed label for ${pkg.package_id} (${bagSize})`]);
      setScanMessage({ text: `Package ${pkg.package_id} successfully created and registered.`, type: "success" });
      setManualWeight("1.5");
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to create package"), type: "error" });
    }
  };

  const handleRemovePackage = (id: string) => {
    setPackages(packages.filter((p) => p.id !== id));
  };

  const handleFinishPacking = async () => {
    if (!activePackSession || !activeOrder) return;
    try {
      setScanMessage({ text: "Finalizing packing session...", type: "info" });
      await completePackingSession(activePackSession.id.toString(), "1");
      setScanMessage({ text: "Packing finished. Moving to QC queue.", type: "success" });

      setTimeout(() => {
        setOrders(orders.filter((o) => o.id !== activeOrder.id));
        setActiveOrder(null);
        setPackages([]);
        setActivePackSession(null);
      }, 1500);
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to finish packing session"), type: "error" });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Left panel: Packing Queue */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-5">Packing Queue</h2>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {orders.length > 0 ? (
            orders.map((o) => (
              <div 
                key={o.id}
                onClick={() => handleSelectOrder(o)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeOrder?.id === o.id
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold">Order #{o.id}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {o.itemsCount} items
                  </span>
                </div>
                <p className="text-xs text-slate-400">{o.customer}</p>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-violet-400 font-bold">{o.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-65 py-10">
              <ShoppingBag className="w-10 h-10 text-slate-650 mb-3" />
              <p className="text-xs text-slate-400">No orders awaiting packing</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Packing Station Workspace */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        {activeOrder ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header / SLA timer */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h1 className="text-lg font-bold">Packing Station 2 - Order #{activeOrder.id}</h1>
                <p className="text-xs text-slate-400">Bag and weigh picked items</p>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-sm font-bold">{getFormattedTime()}</span>
              </div>
            </div>

            {/* Scan notifications */}
            {scanMessage.text && (
              <div className={`p-3 rounded-lg mb-5 text-xs flex items-center gap-2 border ${
                scanMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                scanMessage.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                scanMessage.type === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              }`}>
                {scanMessage.type === "success" && <ShieldCheck className="w-4 h-4" />}
                {scanMessage.type === "error" && <AlertTriangle className="w-4 h-4" />}
                <span>{scanMessage.text}</span>
              </div>
            )}

            {/* Checklist of packed items */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950/20 p-4 border border-slate-800/80 rounded-xl overflow-y-auto max-h-48">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Picked Items</h3>
                <div className="space-y-2">
                  {packedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-emerald-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package creator control */}
              <div className="bg-slate-950/20 p-4 border border-slate-800/80 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create Package</h3>
                <div className="flex gap-2">
                  {/* Bag size */}
                  <select 
                    value={bagSize} 
                    onChange={(e) => setBagSize(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2 text-white flex-1 focus:outline-none"
                  >
                    <option>Small Bag</option>
                    <option>Medium Bag</option>
                    <option>Large Bag</option>
                    <option>Insulated Bag</option>
                    <option>Cardboard Box</option>
                  </select>

                  {/* Weight */}
                  <div className="relative w-28">
                    <input 
                      type="number" 
                      step="0.1" 
                      value={manualWeight} 
                      onChange={(e) => setManualWeight(e.target.value)}
                      placeholder="Weight" 
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2 pl-7 text-white focus:outline-none"
                    />
                    <Weight className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                  </div>
                </div>

                <button 
                  onClick={handleAddPackage}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#070a13] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Bag & Print Label
                </button>
              </div>
            </div>

            {/* Created packages listing */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Created Packages ({packages.length})</h3>
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-850 bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="text-xs font-bold font-mono">{pkg.id}</p>
                      <p className="text-[10px] text-slate-400">{pkg.size} • <span className="font-mono text-emerald-400">{pkg.weight} KG</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer">
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleRemovePackage(pkg.id)}
                      className="p-2 rounded-lg border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Printer diagnostics logger */}
            {printLogs.length > 0 && (
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl mb-4 font-mono text-[10px] text-slate-400 space-y-1">
                {printLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}

            <button 
              onClick={handleFinishPacking}
              className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-500/10 transition-all text-sm"
            >
              <span>Move to Quality Check Desk</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <ShoppingBag className="w-16 h-16 text-slate-650 mb-4" />
            <h2 className="text-lg font-semibold text-slate-300">No active packing session</h2>
            <p className="text-xs text-slate-505 mt-1 max-w-sm">
              Please select a ready order from the packing queue on the left side to begin bagging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
