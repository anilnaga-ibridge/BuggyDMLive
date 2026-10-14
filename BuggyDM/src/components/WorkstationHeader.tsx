"use client";

import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  MapPin, 
  Smartphone, 
  ShieldAlert
} from "lucide-react";
import { IndexedDbService } from "@/lib/indexeddb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function WorkstationHeader() {
  const isOnline = useOnlineStatus();
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftTime, setShiftTime] = useState("00:00:00");
  const [deviceId] = useState("DEV-OPS-001");
  const [syncCount, setSyncCount] = useState(0);

  // Sync count checker
  useEffect(() => {
    const checkSyncQueue = () => {
      void IndexedDbService.getActionQueue()
        .then((queue) => setSyncCount(queue.length))
        .catch((error: unknown) => console.error(error));
    };
    const initialTimer = window.setTimeout(checkSyncQueue, 0);
    const interval = setInterval(checkSyncQueue, 5000);
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Shift Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (shiftActive) {
      const startTime = Date.now();
      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const hrs = String(Math.floor(elapsed / 3600000)).padStart(2, "0");
        const mins = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, "0");
        const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
        setShiftTime(`${hrs}:${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [shiftActive]);

  const handleShiftToggle = () => {
    if (shiftActive) setShiftTime("00:00:00");
    setShiftActive((current) => !current);
  };

  return (
    <header className="h-16 px-6 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between z-20 shadow-md">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          BuggyOPS
        </div>
        <span className="text-slate-400 text-sm">|</span>
        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          <span>Store: DarkStore-01</span>
        </div>
      </div>

      {/* Operational Plugin Header Widgets */}
      <div className="flex items-center gap-5">
        {/* Shift log tracker */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
          <Clock className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">{shiftTime}</span>
          <button
            onClick={handleShiftToggle}
            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-all ${
              shiftActive 
                ? "bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30" 
                : "bg-emerald-500 hover:bg-emerald-600 text-black"
            }`}
          >
            {shiftActive ? "End Shift" : "Start Shift"}
          </button>
        </div>

        {/* Device identifier */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Smartphone className="w-3.5 h-3.5" />
          <span className="font-mono">{deviceId}</span>
        </div>

        {/* Network Connection status */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
              <Wifi className="w-3 h-3" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-500/20 animate-pulse">
              <WifiOff className="w-3 h-3" />
              Offline Mode
            </span>
          )}

          {syncCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-500/20 animate-bounce">
              <ShieldAlert className="w-3 h-3" />
              {syncCount} Synced Q
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
