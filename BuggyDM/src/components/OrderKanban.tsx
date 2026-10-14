"use client";

import React, { useCallback, useState, useEffect } from "react";
import { OrderData, updateOrderStatus } from "@/app/actions/orders";
import { 
  Clock, 
  User, 
  DollarSign,
  ArrowRight,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

interface OrderKanbanProps {
  initialOrders: OrderData[];
}

interface Column {
  id: string;
  title: string;
  color: string;
  statuses: string[];
  nextStatus: string | null;
  buttonLabel: string | null;
}

const COLUMNS: Column[] = [
  { 
    id: "accepting", 
    title: "Accepting", 
    color: "border-t-amber-500 bg-amber-500/5", 
    statuses: ["pending", "accepted"],
    nextStatus: "confirmed",
    buttonLabel: "Confirm Order"
  },
  { 
    id: "running", 
    title: "Running", 
    color: "border-t-indigo-500 bg-indigo-500/5", 
    statuses: ["confirmed"],
    nextStatus: "processing",
    buttonLabel: "Start Prep"
  },
  { 
    id: "inprogress", 
    title: "In Progress", 
    color: "border-t-sky-500 bg-sky-500/5", 
    statuses: ["processing"],
    nextStatus: "handover",
    buttonLabel: "Mark Packed"
  },
  { 
    id: "packing", 
    title: "Packing", 
    color: "border-t-purple-500 bg-purple-500/5", 
    statuses: ["handover"],
    nextStatus: "picked_up",
    buttonLabel: "Assign Delivery"
  },
  { 
    id: "delivering", 
    title: "Delivering", 
    color: "border-t-emerald-500 bg-emerald-500/5", 
    statuses: ["picked_up"],
    nextStatus: "delivered",
    buttonLabel: "Complete Delivery"
  }
];

export default function OrderKanban({ initialOrders }: OrderKanbanProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Time elapsed updater
  const [timeNow, setTimeNow] = useState(0);
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setTimeNow(Date.now()), 0);
    const timer = setInterval(() => setTimeNow(Date.now()), 10000);
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const getElapsedTime = (createdAtStr: string) => {
    if (timeNow === 0) return "—";
    const elapsedMs = timeNow - new Date(createdAtStr).getTime();
    const elapsedMins = Math.floor(elapsedMs / 1000 / 60);
    if (elapsedMins < 1) return "Just now";
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const elapsedHours = Math.floor(elapsedMins / 60);
    return `${elapsedHours}h ago`;
  };

  // Status updates handler
  const handleMoveOrder = async (orderId: string, targetStatus: string) => {
    setLoading(true);
    // Optimistic UI update
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: targetStatus } : o))
    );

    const result = await updateOrderStatus(orderId, targetStatus);
    if (!result.success) {
      // Revert if error
      setOrders(previousOrders);
      alert(`Error updating order status: ${result.error}`);
    }
    setLoading(false);
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    const column = COLUMNS.find((c) => c.id === colId);
    if (!column || !orderId) return;

    // Use the first status in the column config as the drop target status
    const targetStatus = column.statuses[0];
    const order = orders.find((o) => o.id === orderId);

    // Only allow logical progression or drag modifications if valid
    if (order && order.order_status !== targetStatus) {
      await handleMoveOrder(orderId, targetStatus);
    }
  };

  // Real-Time Simulator/Refresher (simulates new orders dropping in database)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In production, this fetches from API or triggers via Firebase listener hook
    // Let's call the reload directly
    try {
      const response = await fetch("/BuggyDm/api/orders");
      if (response.ok) {
        const freshOrders: OrderData[] = await response.json();
        
        // Detect new orders for glow animation
        const currentIds = new Set(orders.map((o) => o.id));
        const addedIds: string[] = [];
        freshOrders.forEach((o) => {
          if (!currentIds.has(o.id)) {
            addedIds.push(o.id);
          }
        });

        if (addedIds.length > 0) {
          setNewOrderIds(new Set(addedIds));
          // Clear glow after 5 seconds
          setTimeout(() => setNewOrderIds(new Set()), 5000);
        }

        setOrders(freshOrders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [orders]);

  // Poll for updates every 15 seconds to simulate Firebase real-time listeners fallback
  useEffect(() => {
    const pollInterval = setInterval(handleRefresh, 15000);
    return () => clearInterval(pollInterval);
  }, [handleRefresh]);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* Top Banner Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Operations Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time order monitoring and dispatch dashboard</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-h-[500px]">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => col.statuses.includes(o.order_status));

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border-t-2 border-slate-800/80 bg-slate-950/20 p-4 min-w-[220px] ${col.color} border border-slate-800/50`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/40">
                <span className="font-semibold text-sm text-white">{col.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-xl text-slate-600 text-xs">
                    <ShoppingBag className="w-5 h-5 mb-2 opacity-50" />
                    <span>No orders</span>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isNew = newOrderIds.has(order.id);
                    return (
                      <div
                        key={order.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        className={`glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700/80 cursor-grab active:cursor-grabbing transition-all duration-300 relative ${
                          isNew ? "border-emerald-500 glow-active bg-emerald-500/5" : ""
                        }`}
                      >
                        {/* Order Header info */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-white">#{order.id}</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/40">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{getElapsedTime(order.created_at)}</span>
                          </div>
                        </div>

                        {/* Items & Price */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[11px] text-slate-400">
                            {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400 flex items-center">
                            <DollarSign className="w-3 h-3" />
                            {order.order_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Rider details */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 py-1.5 px-2 bg-slate-900/40 rounded-lg border border-slate-800/50 mb-4">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{order.riderName}</span>
                        </div>

                        {/* Quick Action Button */}
                        {col.nextStatus && (
                          <button
                            onClick={() => handleMoveOrder(order.id, col.nextStatus!)}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-[10px] font-bold text-[#070a13] cursor-pointer disabled:opacity-50 transition-all duration-150"
                          >
                            <span>{col.buttonLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
