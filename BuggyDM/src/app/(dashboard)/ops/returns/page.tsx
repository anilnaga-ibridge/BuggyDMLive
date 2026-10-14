"use client";

import React, { useState } from "react";
import { 
  Scan, 
  RotateCcw, 
  Camera, 
  Check, 
  AlertTriangle,
} from "lucide-react";
import { getReturnedOrderDetails, reconcileReturnedOrder } from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type ReturnedOrder = Awaited<ReturnType<typeof getReturnedOrderDetails>>;
type ReturnAction = "restock" | "damage" | "waste";
type UploadResponse = { success?: boolean; url?: string; error?: string };

export default function ReturnsPage() {
  const [barcode, setBarcode] = useState("");
  const [scannedReturn, setScannedReturn] = useState<ReturnedOrder | null>(null);
  const [reason, setReason] = useState("Customer rejected delivery");
  const [action, setAction] = useState<ReturnAction>("restock");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });
  const [logs, setLogs] = useState<string[]>([]);

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    setScanMessage({ text: "Searching return order details...", type: "info" });
    try {
      const details = await getReturnedOrderDetails(barcode);
      setScannedReturn(details);
      setScanMessage({ text: `Found returned order record. Select return actions below.`, type: "success" });
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Lookup failed"), type: "error" });
      setScannedReturn(null);
    }
    setBarcode("");
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadedImages.length >= 5) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      let response = await fetch("/BuggyDm/api/upload", { method: "POST", body: formData });
      if (response.status === 404) {
        response = await fetch("/api/upload", { method: "POST", body: formData });
      }
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || !result.success || !result.url) {
        throw new Error(result.error || "Image upload failed");
      }
      setUploadedImages((current) => [...current, result.url!]);
    } catch (error) {
      setScanMessage({ text: getErrorMessage(error, "Image upload failed"), type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!scannedReturn) return;

    setScanMessage({ text: "Submitting return reconciliation...", type: "info" });
    try {
      await reconcileReturnedOrder(
        scannedReturn.orderId,
        reason,
        action,
        scannedReturn.packageRecordId || undefined,
        uploadedImages,
      );

      setLogs((prev) => [
        ...prev, 
        `[Returns] Processed order #${scannedReturn.orderId} (${action.toUpperCase()}). Reason: ${reason}`
      ]);
      setScanMessage({ text: `Successfully processed returned order #${scannedReturn.orderId}`, type: "success" });
      setScannedReturn(null);
      setUploadedImages([]);
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to reconcile return"), type: "error" });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Return scanning workbench */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        <h1 className="text-lg font-bold mb-4">Returned Packages Processing</h1>

        {/* Scan package barcode */}
        <form onSubmit={handleScanBarcode} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
              <Scan className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Scan package barcode or type Order ID (e.g. 10425)..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
            />
          </div>
          <button 
            type="submit" 
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 rounded-xl text-sm cursor-pointer transition-all"
          >
            Scan Return
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

        {/* Processing Actions Form */}
        {scannedReturn ? (
          <div className="space-y-5 glass-panel p-5 border border-slate-800/80 rounded-xl">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Return Details</span>
                <h3 className="font-bold text-sm mt-1 text-slate-200">Order ID: #{scannedReturn.orderId}</h3>
                <p className="text-xs text-slate-400 mt-1">Package: {scannedReturn.packageId}</p>
                <p className="text-xs text-slate-400">Total value: <span className="font-mono text-emerald-400">${scannedReturn.amount.toFixed(2)}</span></p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Returned Items</span>
                <ul className="text-xs text-slate-450 list-disc list-inside mt-1 space-y-0.5">
                  {scannedReturn.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Return</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2.5 text-white focus:outline-none"
                >
                  <option>Customer rejected delivery</option>
                  <option>Rider could not contact customer</option>
                  <option>Damaged package reported by rider</option>
                  <option>Wrong products inside bag</option>
                </select>
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reconciled Action</label>
                <select 
                  value={action} 
                  onChange={(e) => setAction(e.target.value as ReturnAction)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg text-xs p-2.5 text-white focus:outline-none"
                >
                  <option value="restock">Restock to Inventory shelves</option>
                  <option value="damage">Log Damage (exception queue)</option>
                  <option value="waste">Discard (waste log)</option>
                </select>
              </div>
            </div>

            {/* Image upload simulator */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Camera proof upload</label>
              <div className="flex flex-wrap gap-2 items-center">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="w-16 h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    Proof_{idx+1}.jpg
                  </div>
                ))}
                <label className="w-16 h-16 rounded border border-dashed border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 hover:bg-slate-900/40 text-slate-550 hover:text-slate-400 cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadImage}
                    disabled={isUploading || uploadedImages.length >= 5}
                    className="sr-only"
                  />
                  <Camera className="w-4 h-4" />
                  <span className="text-[9px]">{isUploading ? "Uploading" : "Add proof"}</span>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSubmitReturn}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              Reconcile returned order
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
            <RotateCcw className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-xs text-slate-500">Scan returned package code to initialize reconciliation.</p>
          </div>
        )}
      </div>

      {/* Right panel: returns session logs logs */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-4">Reconciliation Logs</h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-500 pr-1">
          {logs.map((log, idx) => (
            <div key={idx} className="p-2 border border-slate-800/80 rounded bg-slate-950/20">{log}</div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs italic text-center py-10">No returned items processed in current session</p>
          )}
        </div>
      </div>
    </div>
  );
}
