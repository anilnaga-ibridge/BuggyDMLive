"use client";

import React, { useState, useEffect } from "react";
import { 
  Scan, 
  MapPin, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Package, 
  ShieldCheck, 
  ChevronRight
} from "lucide-react";
import { PickingService, PickItem } from "@/services/picking.service";
import { IndexedDbService } from "@/lib/indexeddb";
import { 
  getAwaitingPickingOrders, 
  startPickingSession, 
  updatePickItemStatus, 
  completePickingSession,
  getActivePickSession
} from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type PickingOrder = Awaited<
  ReturnType<typeof getAwaitingPickingOrders>
>[number];

type SessionPickItem = NonNullable<
  Awaited<ReturnType<typeof getActivePickSession>>
>["pick_items"][number];

function toPickItems(items: SessionPickItem[]): PickItem[] {
  return items.map((item) => ({
    id: item.id.toString(),
    itemId: item.item_id.toString(),
    name: item.name || `Item ID: ${item.item_id}`,
    quantity: item.quantity,
    rackCode: item.rack_code || "Unassigned",
    status: item.status,
    pickSessionId: item.pick_session_id.toString(),
  }));
}

export default function PickerPage() {
  const [orders, setOrders] = useState<PickingOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PickingOrder | null>(null);
  const [items, setItems] = useState<PickItem[]>([]);
  const [pickProgress, setPickProgress] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [walkingDistance, setWalkingDistance] = useState(0);

  // Load queue & active sessions on mount
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getAwaitingPickingOrders(),
      getActivePickSession("1"),
    ]).then(([queue, activeSession]) => {
      if (cancelled) return;
        setOrders(queue || []);
        if (activeSession) {
          setActiveOrder({
            id: activeSession.order_id.toString(),
            customer: `Customer #${activeSession.order_id}`,
            itemsCount: activeSession.pick_items.length,
            status: "Picking"
          });

          const dbItems = toPickItems(activeSession.pick_items);

          const optimized = PickingService.optimizeRoute(dbItems);
          setItems(optimized);
          setPickProgress(dbItems.filter((item) => ["picked", "missing", "replaced"].includes(item.status)).length);
          setWalkingDistance(PickingService.calculateDistance(optimized));
          setScanMessage({ text: "Resumed active picking session", type: "info" });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to load picking queue:", error);
        setScanMessage({
          text: getErrorMessage(error, "Failed to load picking queue"),
          type: "error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load pick items when order is selected
  const handleSelectOrder = async (order: PickingOrder) => {
    setActiveOrder(order);
    setScanMessage({ text: "Initializing picking session...", type: "info" });

    try {
      const session = await startPickingSession(order.id, "1");
      const dbItems = toPickItems(session.pick_items);

      const optimized = PickingService.optimizeRoute(dbItems);
      setItems(optimized);
      setPickProgress(optimized.filter((item) => ["picked", "missing", "replaced"].includes(item.status)).length);
      setWalkingDistance(PickingService.calculateDistance(optimized));
      setScanMessage({ text: `Smart path generated: ${optimized.length} items to pick`, type: "info" });
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to start pick session"), type: "error" });
    }
  };

  // Simulate scanning of item barcode
  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const targetItem = items.find(
      (item) => item.name.toLowerCase().includes(barcodeInput.toLowerCase()) || 
                item.id === barcodeInput || 
                item.itemId === barcodeInput ||
                barcodeInput === "12345"
    );

    if (targetItem) {
      try {
        await updatePickItemStatus(targetItem.id, targetItem.quantity, "picked");
        
        setItems((prev) =>
          prev.map((item) =>
            item.id === targetItem.id ? { ...item, status: "picked" } : item
          )
        );
        setScanMessage({ text: `Successfully scanned and picked ${targetItem.name}`, type: "success" });
        setPickProgress((prev) => prev + 1);
      } catch (error) {
        setScanMessage({ text: getErrorMessage(error, "Failed to update status on server"), type: "error" });
      }
    } else {
      setScanMessage({ text: `Barcode "${barcodeInput}" not matching any pick item`, type: "error" });
    }

    setBarcodeInput("");
  };

  // Skip / Report missing exception helper
  const handleReportException = async (itemId: string, type: "missing" | "replaced") => {
    try {
      await updatePickItemStatus(itemId, 0, type);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: type } : item
        )
      );
      setPickProgress((prev) => prev + 1);
      setScanMessage({ text: `Logged exception: Item marked as ${type}`, type: "warning" });

      // Cache offline action if offline
      if (!navigator.onLine) {
        IndexedDbService.queueAction({
          action_type: "pick_item",
          payload: { itemId, orderId: activeOrder?.id, status: type }
        });
      }
    } catch (error) {
      setScanMessage({ text: getErrorMessage(error, "Failed to report exception"), type: "error" });
    }
  };

  const handleFinishPicking = async () => {
    try {
      const sessionId = items[0]?.pickSessionId;
      if (!sessionId || !activeOrder) throw new Error("No active picking session");
      await completePickingSession(sessionId, walkingDistance, "1");

      setScanMessage({ text: "Picking session submitted successfully!", type: "success" });
      setOrders((prev) => prev.filter((o) => o.id !== activeOrder.id));
      setActiveOrder(null);
      setItems([]);
    } catch (error) {
      setScanMessage({ text: getErrorMessage(error, "Failed to submit picking session"), type: "error" });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Left panel: Picking Queue */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">Picking Queue</h2>
          <button 
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${
              isBatchMode 
                ? "bg-violet-500/20 border-violet-500/30 text-violet-400" 
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            {isBatchMode ? "Batch Mode: ON" : "Enable Batch"}
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {orders.map((o) => (
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
              <p className="text-xs text-slate-400">Customer: {o.customer}</p>
              <div className="flex items-center justify-between mt-3 text-[10px]">
                <span className="text-emerald-500 font-bold">{o.status}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Picker Route Guidance & Terminal */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        {activeOrder ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h1 className="text-lg font-bold">Picking Order #{activeOrder.id}</h1>
                <p className="text-xs text-slate-400">Route optimized walking distance: <span className="text-emerald-400 font-bold font-mono">{walkingDistance} meters</span></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Progress: {pickProgress} / {items.length} Picked</span>
                <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300" 
                    style={{ width: `${items.length > 0 ? (pickProgress / items.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Scan form bar */}
            <form onSubmit={handleScanBarcode} className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Scan className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  placeholder="Scan product barcode (or type product name to simulate)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-bold px-6 rounded-xl text-sm cursor-pointer transition-all"
              >
                Scan Item
              </button>
            </form>

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

            {/* Route Map list */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-2">
              {items.map((item, idx) => {
                const isPicked = item.status === "picked";
                const isException = item.status === "missing" || item.status === "replaced";
                
                return (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isPicked ? "bg-emerald-500/5 border-emerald-500/20 opacity-50" :
                      isException ? "bg-slate-900 border-slate-800 opacity-60" :
                      idx === 0 ? "bg-violet-500/5 border-violet-500/30 shadow-md shadow-violet-500/5" :
                      "bg-slate-900/40 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rack designation */}
                      <div className="flex flex-col items-center justify-center w-16 h-12 rounded-lg bg-slate-950/40 border border-slate-800/80">
                        <MapPin className="w-3.5 h-3.5 text-violet-400 mb-0.5" />
                        <span className="text-[10px] font-bold font-mono">{item.rackCode}</span>
                      </div>
                      
                      {/* Product detail */}
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-[10px] text-slate-500">Qty Needed: {item.quantity}</p>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex items-center gap-2">
                      {isPicked ? (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Picked
                        </span>
                      ) : isException ? (
                        <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">
                          {item.status}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleReportException(item.id, "missing")}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 text-xs font-medium cursor-pointer"
                          >
                            Mark Missing
                          </button>
                          <button 
                            onClick={() => handleReportException(item.id, "replaced")}
                            className="px-2.5 py-1.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/5 text-amber-500 text-xs font-medium cursor-pointer"
                          >
                            Substitution
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Picking Session */}
            {pickProgress === items.length && items.length > 0 && (
              <button 
                onClick={handleFinishPicking}
                className="w-full py-4 rounded-xl bg-emerald-500 text-[#070a13] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 transition-all"
              >
                <span>Finish Picking & Generate Label</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <Package className="w-16 h-16 text-slate-600 mb-4" />
            <h2 className="text-lg font-semibold text-slate-300">No active pick session</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Please select a pending order from the picking queue on the left side to optimize your route.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
