"use client";

import React, { useEffect, useState } from "react";
import { 
  Grid, 
  Clock, 
  Scan, 
  AlertTriangle, 
  Layers,
  ShieldCheck
} from "lucide-react";
import { 
  getStagedShelves, 
  getPendingWaitingRiders, 
  stagePackageToShelf, 
  reconcileHandover 
} from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type DispatchRack = Awaited<ReturnType<typeof getStagedShelves>>[number];
type WaitingRiderRecord = Awaited<
  ReturnType<typeof getPendingWaitingRiders>
>[number];
type WaitingRider = {
  id: string;
  name: string;
  phone: string;
  packagesNeeded: number;
};

function toWaitingRider(rider: WaitingRiderRecord): WaitingRider {
  return {
    id: rider.id.toString(),
    name: `${rider.f_name} ${rider.l_name}`.trim(),
    phone: rider.phone,
    packagesNeeded: rider.current_orders,
  };
}

export default function DispatcherPage() {
  const [racks, setRacks] = useState<DispatchRack[]>([]);
  const [waitingRiders, setWaitingRiders] = useState<WaitingRider[]>([]);
  const [activeRider, setActiveRider] = useState<WaitingRider | null>(null);
  const [barcode, setBarcode] = useState("");
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });

  // Load shelves & riders on mount
  const loadData = async () => {
    try {
      const shelves = await getStagedShelves();
      setRacks(shelves || []);
      
      const riders = await getPendingWaitingRiders();
      setWaitingRiders((riders || []).map(toWaitingRider));
    } catch (error) {
      console.error("Failed to load dispatch data:", error);
      setScanMessage({
        text: getErrorMessage(error, "Failed to load dispatch data"),
        type: "error",
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getStagedShelves(), getPendingWaitingRiders()])
      .then(([shelves, riders]) => {
        if (cancelled) return;
        setRacks(shelves || []);
        setWaitingRiders((riders || []).map(toWaitingRider));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to load dispatch data:", error);
        setScanMessage({
          text: getErrorMessage(error, "Failed to load dispatch data"),
          type: "error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    if (activeRider) {
      // Rider Handover mode
      setScanMessage({ text: "Processing handover...", type: "info" });
      try {
        await reconcileHandover([barcode.trim()], activeRider.id);
        setScanLogs((prev) => [...prev, `[Handover] Handed over package ${barcode} to Rider ${activeRider.name}`]);
        setScanMessage({ text: `Package ${barcode} handed over to Rider ${activeRider.name}`, type: "success" });
        setActiveRider(null);
        await loadData();
      } catch (error) {
        setScanMessage({ text: getErrorMessage(error, "Handover failed"), type: "error" });
      }
    } else {
      const availableRack = racks.find((rack) => rack.occupied < rack.capacity);
      if (!availableRack) {
        setScanMessage({ text: "No dispatch shelf has available capacity", type: "error" });
        return;
      }

      setScanMessage({ text: "Staging package...", type: "info" });
      try {
        await stagePackageToShelf(barcode.trim(), availableRack.name);
        setScanLogs((prev) => [...prev, `[Staging] Staged package ${barcode} on ${availableRack.name}`]);
        setScanMessage({ text: `Package ${barcode} staged on ${availableRack.name}`, type: "success" });
        await loadData();
      } catch (error) {
        setScanMessage({ text: getErrorMessage(error, "Staging failed"), type: "error" });
      }
    }

    setBarcode("");
  };

  const handleSelectRider = (rider: WaitingRider) => {
    setActiveRider(rider);
    setScanMessage({ text: `Rider ${rider.name} selected. Scan package barcode to complete handover.`, type: "info" });
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Shelf overview grid */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        <h1 className="text-lg font-bold mb-4">Staging & Shelf Management</h1>
        
        {/* Shelf blocks */}
        <div className="grid grid-cols-2 gap-4 mb-6 overflow-y-auto max-h-[60vh] pr-2">
          {racks.length > 0 ? (
            racks.map((r, idx) => {
              const isFull = r.occupied >= r.capacity;
              return (
                <div 
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isFull ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-900/40 border-slate-850"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Grid className="w-5 h-5 text-violet-400" />
                      <span className="font-bold text-sm">{r.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isFull ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {r.occupied} / {r.capacity} Occupied
                    </span>
                  </div>

                  {/* Shelf Package List */}
                  <div className="space-y-2">
                    {r.packages && r.packages.map((pkg, index) => {
                      return (
                        <div 
                          key={index}
                          className="p-3 rounded-lg border text-xs flex items-center justify-between bg-slate-950/20 border-slate-800/80 text-slate-350"
                        >
                          <div>
                            <p className="font-mono font-bold text-[10px] text-violet-400">{pkg.packageId}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Order ID: #{pkg.orderId}</p>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[9px] text-slate-450">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Staged</span>
                          </div>
                        </div>
                      );
                    })}
                    {(!r.packages || r.packages.length === 0) && (
                      <p className="text-xs text-slate-600 italic text-center py-4">Shelf is empty</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center text-center opacity-65 py-10">
              <Layers className="w-10 h-10 text-slate-650 mb-3" />
              <p className="text-xs text-slate-400">No dispatch staging shelves found</p>
            </div>
          )}
        </div>

        {/* Scan history console logs */}
        {scanLogs.length > 0 && (
          <div className="bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl flex-1 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
            <h3 className="text-slate-505 font-bold uppercase tracking-wider mb-2 text-[8px]">Handover logs</h3>
            {scanLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting riders & Scanners panel */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-5">Rider Pickup / Handover</h2>

        {/* Barcode scanner action bar */}
        <form onSubmit={handleScanBarcode} className="relative mb-5">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-505">
            <Scan className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder={activeRider ? `Scan packages for ${activeRider.name}...` : "Scan package barcode..."}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 text-white"
          />
        </form>

        {scanMessage.text && (
          <div className={`p-3 rounded-lg mb-5 text-xs flex items-center gap-2 border ${
            scanMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            scanMessage.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-455" :
            "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }`}>
            {scanMessage.type === "success" && <ShieldCheck className="w-4 h-4" />}
            {scanMessage.type === "error" && <AlertTriangle className="w-4 h-4" />}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* List of active waiting riders */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Waiting Riders</h3>
          {waitingRiders.map((rider) => (
            <div 
              key={rider.id}
              onClick={() => handleSelectRider(rider)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeRider?.id === rider.id
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md"
                  : "bg-slate-900/50 border-slate-850 hover:bg-slate-900 text-slate-350"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-xs text-slate-300">{rider.name}</span>
                <span className="text-[9px] bg-slate-800 text-slate-450 px-2 py-0.5 rounded font-mono">
                  {rider.packagesNeeded} pkg
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Phone: {rider.phone}</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-2">Ready for assigned handover</p>
            </div>
          ))}
          {waitingRiders.length === 0 && (
            <p className="text-xs text-slate-600 italic text-center py-4">No waiting riders</p>
          )}
        </div>
      </div>
    </div>
  );
}
