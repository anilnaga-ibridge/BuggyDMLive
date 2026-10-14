"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderSync, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  Trash2, 
  ShieldCheck,
  HardDrive
} from "lucide-react";
import { IndexedDbService, OfflineAction } from "@/lib/indexeddb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflinePage() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState("");

  const loadQueue = async () => {
    try {
      const list = await IndexedDbService.getActionQueue();
      setQueue(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void IndexedDbService.getActionQueue()
      .then((list) => {
        if (!cancelled) setQueue(list);
      })
      .catch((error: unknown) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      setSyncStatus("Cannot sync: Connection still offline.");
      return;
    }

    setSyncStatus("Server reconciliation is not configured yet. Queue retained safely.");
  };

  const handleClearQueue = async () => {
    for (const item of queue) {
      if (item.id) {
        await IndexedDbService.removeAction(item.id);
      }
    }
    setSyncStatus("Offline action queue cleared.");
    loadQueue();
    setTimeout(() => setSyncStatus(""), 3000);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Network & storage status console */}
      <div className="col-span-4 glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-5">Offline Sync status</h1>
          
          <div className="space-y-4">
            {/* Status indicator */}
            <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-300">Connection Status</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                  <Wifi className="w-3.5 h-3.5" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-500 text-xs font-bold font-mono animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" /> Offline Mode
                </span>
              )}
            </div>

            {/* Storage space */}
            <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-300">IndexedDB Storage</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300 text-xs font-bold font-mono">
                <HardDrive className="w-3.5 h-3.5 text-violet-400" /> Initialized
              </span>
            </div>

            {/* Total items pending */}
            <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-300">Pending Sync Items</span>
              <span className="text-xs font-bold font-mono text-emerald-400">{queue.length} actions</span>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="space-y-3">
          <button 
            onClick={handleForceSync}
            disabled={queue.length === 0}
            className="w-full py-3.5 bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <FolderSync className="w-4 h-4" />
            Force Reconcile Sync
          </button>

          <button 
            onClick={handleClearQueue}
            disabled={queue.length === 0}
            className="w-full py-3 border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Discard Queue
          </button>
        </div>
      </div>

      {/* Sync Queue item details */}
      <div className="col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 mb-5">Pending Sync Queue Details</h2>

        {syncStatus && (
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-xl mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{syncStatus}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {queue.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-400 tracking-wider uppercase">{item.action_type}</span>
                <p className="text-xs text-slate-300 mt-1">Payload: {JSON.stringify(item.payload)}</p>
                <p className="text-[10px] text-slate-500 mt-1.5 font-mono">Timestamp: {new Date(item.timestamp).toLocaleString()}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Pending
              </span>
            </div>
          ))}
          {queue.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center opacity-60 py-20">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <h3 className="font-bold text-sm text-slate-200">System reconciled</h3>
              <p className="text-xs text-slate-500 mt-1">No offline actions currently queued for sync.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
