"use client";

import React, { useEffect, useState } from "react";
import { 
  Check, 
  X, 
  Scan, 
  AlertTriangle, 
  PackageCheck,
  ShieldCheck
} from "lucide-react";
import { getAwaitingQcPackages, submitQualityCheck } from "@/app/actions/ops";
import { getErrorMessage } from "@/lib/errors";

type QcPackage = Awaited<ReturnType<typeof getAwaitingQcPackages>>[number];
type QcChecklist = {
  correctProducts: boolean;
  correctQuantity: boolean;
  sealChecked: boolean;
  labelPrinted: boolean;
  tempItemsChecked: boolean;
  fragileItemsChecked: boolean;
};

const emptyChecklist: QcChecklist = {
  correctProducts: false,
  correctQuantity: false,
  sealChecked: false,
  labelPrinted: false,
  tempItemsChecked: false,
  fragileItemsChecked: false,
};

export default function QcPage() {
  const [packages, setPackages] = useState<QcPackage[]>([]);
  const [activePackage, setActivePackage] = useState<QcPackage | null>(null);
  const [barcode, setBarcode] = useState("");
  const [checklist, setChecklist] = useState<QcChecklist>(emptyChecklist);
  const [notes, setNotes] = useState("");
  const [scanMessage, setScanMessage] = useState({ text: "", type: "" });

  // Load QC Queue on mount
  useEffect(() => {
    let cancelled = false;
    void getAwaitingQcPackages()
      .then((queue) => {
        if (cancelled) return;
        setPackages(queue || []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to load QC queue:", error);
        setScanMessage({
          text: getErrorMessage(error, "Failed to load QC queue"),
          type: "error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectPackage = (pkg: QcPackage) => {
    setActivePackage(pkg);
    setChecklist(emptyChecklist);
    setNotes("");
    setScanMessage({ text: "", type: "" });
  };

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const matched = packages.find((p) => p.id === barcode);
    if (matched) {
      handleSelectPackage(matched);
      setScanMessage({ text: `Package ${barcode} scanned. Complete checklists below.`, type: "success" });
    } else {
      setScanMessage({ text: `Package with barcode "${barcode}" not found in QC queue`, type: "error" });
    }
    setBarcode("");
  };

  const handleApprove = async () => {
    if (!activePackage) return;
    try {
      setScanMessage({ text: "Submitting approval...", type: "info" });
      await submitQualityCheck({
        packageId: activePackage.id,
        status: "approved",
        notes,
        checklist
      });

      setScanMessage({ text: `Package ${activePackage.id} approved and moved to dispatch staging.`, type: "success" });
      setPackages((current) => current.filter((p) => p.id !== activePackage.id));
      setActivePackage(null);
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to submit QC"), type: "error" });
    }
  };

  const handleReject = async () => {
    if (!activePackage) return;
    try {
      setScanMessage({ text: "Submitting rejection...", type: "info" });
      await submitQualityCheck({
        packageId: activePackage.id,
        status: "rejected",
        notes,
        checklist
      });

      setScanMessage({ text: `Package ${activePackage.id} rejected. Sent back to packing workstation.`, type: "warning" });
      setPackages((current) => current.filter((p) => p.id !== activePackage.id));
      setActivePackage(null);
    } catch (error) {
      console.error(error);
      setScanMessage({ text: getErrorMessage(error, "Failed to submit QC"), type: "error" });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Left panel: QC Queue */}
      <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-4">QC Queue</h2>
        
        {/* Scan package trigger */}
        <form onSubmit={handleScanBarcode} className="relative mb-5">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Scan className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Scan package barcode..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 text-white"
          />
        </form>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {packages.length > 0 ? (
            packages.map((p) => (
              <div 
                key={p.id}
                onClick={() => handleSelectPackage(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activePackage?.id === p.id
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 text-slate-300"
                }`}
              >
                <span className="font-mono text-xs font-bold">{p.id}</span>
                <p className="text-[10px] text-slate-400 mt-1">Order ID: #{p.orderId}</p>
                <div className="flex justify-between items-center mt-3 text-[10px]">
                  <span className="text-amber-500 font-bold">{p.status}</span>
                  <span className="text-slate-550 font-mono">{p.weight} KG</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-65 py-10">
              <PackageCheck className="w-10 h-10 text-slate-650 mb-3" />
              <p className="text-xs text-slate-400">No packages in QC queue</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: QC inspection desk */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        {activePackage ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h1 className="text-lg font-bold">QC Verification Station</h1>
                <p className="text-xs text-slate-400">Verifying Package ID: <span className="font-mono text-violet-400">{activePackage.id}</span></p>
              </div>
            </div>

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

            {/* Checklist selections */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Fulfillment Checklist</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(checklist).map(([key, val]) => (
                  <div 
                    key={key} 
                    onClick={() => setChecklist((current) => ({
                      ...current,
                      [key]: !current[key as keyof QcChecklist],
                    }))}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      val 
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5" 
                        : "bg-slate-900/50 border-slate-850 text-slate-450 hover:border-slate-800"
                    }`}
                  >
                    <span className="text-xs font-semibold capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      val ? "bg-emerald-500 border-emerald-500 text-[#070a13]" : "border-slate-700 bg-slate-900/60"
                    }`}>
                      {val && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* QC Exceptions note */}
              <div className="space-y-1.5 pt-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Verification Notes / Exceptions Details</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter rejection reasons (e.g. 'damaged eggs, replacement package required' or 'missing item milk')"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Verification decision buttons */}
            <div className="flex gap-4">
              <button 
                onClick={handleReject}
                className="flex-1 py-4 rounded-xl border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
                Reject Package
              </button>
              <button 
                onClick={handleApprove}
                disabled={!Object.values(checklist).every(Boolean)}
                className="flex-2 py-4 rounded-xl bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 text-black font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                Approve & Seal Package
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <PackageCheck className="w-16 h-16 text-slate-650 mb-4" />
            <h2 className="text-lg font-semibold text-slate-300">No package scanned</h2>
            <p className="text-xs text-slate-505 mt-1 max-w-sm">
              Scan a package barcode or select an entry in the QC queue to start validation inspections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
