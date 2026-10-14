"use client";

import React, { useState } from "react";
import { 
  Scan, 
  AlertTriangle,
  ArrowRightLeft
} from "lucide-react";
import { searchItemByBarcode, adjustInventoryItem } from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type InventoryItem = NonNullable<Awaited<ReturnType<typeof searchItemByBarcode>>>;

export default function InventoryPage() {
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [barcode, setBarcode] = useState("");
  const [targetRack, setTargetRack] = useState("");
  const [stockUpdate, setStockUpdate] = useState("");
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });
  const [inventoryLogs, setInventoryLogs] = useState<string[]>([]);

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    setScanMessage({ text: "Searching item in database...", type: "info" });
    try {
      const item = await searchItemByBarcode(barcode);
      if (item) {
        setScannedItem(item);
        setScanMessage({ text: `Item found: ${item.name}`, type: "success" });
        setStockUpdate(String(item.stock));
        setTargetRack(item.panel_item_racks?.rack_code || "");
      } else {
        setScanMessage({ text: `Barcode "${barcode}" not matching any product in catalogue`, type: "error" });
        setScannedItem(null);
      }
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Lookup failed"), type: "error" });
      setScannedItem(null);
    }
    setBarcode("");
  };

  const handleMoveRack = async () => {
    if (!scannedItem || !targetRack) return;

    setScanMessage({ text: "Updating rack placement...", type: "info" });
    try {
      const updatedRack = await adjustInventoryItem(
        scannedItem.id.toString(),
        scannedItem.stock ?? 0,
        targetRack,
      );
      const oldRack = scannedItem.panel_item_racks?.rack_code || "Unassigned";
      setScannedItem({
        ...scannedItem,
        panel_item_racks: updatedRack,
      });
      setScanMessage({ text: `Moved ${scannedItem.name} to ${targetRack}`, type: "success" });
      setInventoryLogs((prev) => [...prev, `[RackMove] ${scannedItem.name} moved from ${oldRack} to ${targetRack}`]);
    } catch (error) {
      setScanMessage({ text: getErrorMessage(error, "Rack update failed"), type: "error" });
    }
  };

  const handleUpdateStock = async () => {
    if (!scannedItem || !stockUpdate) return;

    const qty = parseInt(stockUpdate, 10) || 0;
    setScanMessage({ text: "Updating stock levels...", type: "info" });
    try {
      const updatedRack = await adjustInventoryItem(scannedItem.id.toString(), qty, targetRack);
      const oldStock = scannedItem.stock;
      setScannedItem({ ...scannedItem, stock: qty, panel_item_racks: updatedRack });
      setScanMessage({ text: `Updated stock count of ${scannedItem.name} to ${qty}`, type: "success" });
      setInventoryLogs((prev) => [...prev, `[StockUpdate] ${scannedItem.name} count updated from ${oldStock} to ${qty}`]);
    } catch (error) {
      setScanMessage({ text: getErrorMessage(error, "Stock update failed"), type: "error" });
    }
  };

  const handleLogDamage = () => {
    if (!scannedItem) return;
    setScanMessage({ text: `Logged damaged exception for ${scannedItem.name}`, type: "warning" });
    setInventoryLogs((prev) => [...prev, `[Damage] Reported 1x damaged unit of ${scannedItem.name}`]);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Scanner & product specs panel */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        <h1 className="text-lg font-bold mb-4">Inventory Operations & Cycle Counts</h1>
        
        {/* Scanner form input */}
        <form onSubmit={handleScanBarcode} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
              <Scan className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Scan item barcode (e.g. 1, 2, or DB Item ID)..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
            />
          </div>
          <button 
            type="submit" 
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 rounded-xl text-sm cursor-pointer transition-all"
          >
            Scan Barcode
          </button>
        </form>

        {scanMessage.text && (
          <div className={`p-3 rounded-lg mb-6 text-xs flex items-center gap-2 border ${
            scanMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            scanMessage.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-455" :
            "bg-amber-500/10 border-amber-500/20 text-amber-450"
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Selected Product Adjustments form */}
        {scannedItem ? (
          <div className="grid grid-cols-2 gap-6 glass-panel p-5 border border-slate-800/80 rounded-xl">
            {/* Spec info */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product details</span>
              <h2 className="text-base font-bold mt-1 text-slate-200">{scannedItem.name}</h2>
              <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                <p>Location: <span className="text-white font-semibold">{scannedItem.panel_item_racks?.rack_code || "Unassigned"}</span></p>
                <p>Available Stock: <span className="text-emerald-400 font-bold font-mono">{scannedItem.stock} units</span></p>
                <p>Catalog ID: <span className="font-mono text-slate-200">{scannedItem.id.toString()}</span></p>
              </div>
            </div>

            {/* Adjustments control drawer */}
            <div className="space-y-4">
              {/* Move Rack */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={targetRack} 
                  onChange={(e) => setTargetRack(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2 text-white flex-1 focus:outline-none" 
                  placeholder="Target Rack"
                />
                <button 
                  onClick={handleMoveRack}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3.5 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Move Rack
                </button>
              </div>

              {/* Adjust Stock counts */}
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={stockUpdate} 
                  onChange={(e) => setStockUpdate(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2 text-white flex-1 font-mono focus:outline-none" 
                  placeholder="Stock"
                />
                <button 
                  onClick={handleUpdateStock}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs px-3.5 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Set Stock
                </button>
              </div>

              {/* Damaged counts */}
              <button 
                onClick={handleLogDamage}
                className="w-full py-2 border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 font-bold text-xs rounded-lg cursor-pointer transition-all"
              >
                Log Damage / Expiry Exception
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
            <ArrowRightLeft className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-xs text-slate-500">Scan a physical barcode to access inventory adjustments.</p>
          </div>
        )}
      </div>

      {/* Right panel: Operations logs logs */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-4">Activity Audit Logs</h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-500 pr-1">
          {inventoryLogs.map((log, idx) => (
            <div key={idx} className="p-2 border border-slate-800/80 rounded bg-slate-950/20">{log}</div>
          ))}
          {inventoryLogs.length === 0 && (
            <p className="text-xs italic text-center py-10">No actions recorded in current session</p>
          )}
        </div>
      </div>
    </div>
  );
}
