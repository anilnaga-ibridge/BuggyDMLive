"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Sliders, 
  Check, 
  X, 
  RefreshCw,
  Search,
} from "lucide-react";
import IconResolver from "@/components/common/IconResolver";
import { useActionQuery } from "@/hooks/useActionQuery";

interface NavItem {
  id: number;
  parent_id: number | null;
  title: string;
  slug: string;
  route: string;
  icon: string;
  description: string;
  category: string;
  display_order: number;
  badge_provider: string | null;
  badge_refresh_interval: number;
  feature_flag: string | null;
  minimum_role: number;
  permissions: string | null;
  supports_offline: boolean;
  platform: string;
  is_enabled: boolean;
  is_visible: boolean;
}

const AVAILABLE_ICONS = [
  "Layers", "Package", "Grid", "User", "BarChart3", "ShoppingBag", 
  "LayoutDashboard", "TrendingUp", "Users", "MapPin", "Database", 
  "Truck", "Megaphone", "DollarSign", "Sparkles", "FileText", 
  "Eye", "Scan", "RotateCcw", "WifiOff", "Boxes", "ClipboardCheck", "Warehouse", "Settings"
];

const AVAILABLE_BADGES = [
  { value: "", label: "None" },
  { value: "orders_waiting", label: "Orders Waiting (Pick Desk)" },
  { value: "packing_queue", label: "Packing Queue" },
  { value: "pending_qc", label: "Pending QC Station" },
  { value: "dispatch_ready", label: "Ready for Dispatch" },
  { value: "critical_orders", label: "Critical Priority Orders" },
  { value: "returns_pending", label: "Pending Returns" },
  { value: "inventory_alert", label: "Low Inventory Alert" },
  { value: "offline_queue", label: "Offline Queue Actions" },
];

const AVAILABLE_FEATURE_FLAGS = [
  { value: "", label: "None (Always Active)" },
  { value: "inventory_v2", label: "Inventory V2" },
  { value: "returns_v3", label: "Returns V3" },
  { value: "fleet", label: "Rider Fleet Management" },
  { value: "warehouse_ai", label: "Warehouse AI Optimization" },
  { value: "dark_store", label: "Dark Store Engine" },
  { value: "offline_sync", label: "Offline Sync Engine" },
  { value: "analytics_dashboard", label: "Analytics Dashboard" },
];

type NavigationResponse = {
  success: boolean;
  data?: NavItem[];
  error?: string;
};

async function fetchNavigationItems(): Promise<NavItem[]> {
  let response = await fetch("/BuggyDm/api/admin/navigation");
  if (!response.ok) response = await fetch("/api/admin/navigation");
  const payload = (await response.json()) as NavigationResponse;
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Failed to load navigation items");
  }
  return payload.data;
}

export default function AdminNavigationPage() {
  const { data: items = [], isLoading: loading, refetch } = useActionQuery(
    "admin-navigation",
    fetchNavigationItems,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<NavItem> | null>(null);

  const handleCreateNew = () => {
    setEditingItem({
      title: "",
      slug: "",
      route: "",
      icon: "Package",
      description: "",
      category: "Operations",
      display_order: items.length + 1,
      badge_provider: "",
      badge_refresh_interval: 30,
      feature_flag: "",
      minimum_role: 0,
      permissions: "",
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
      parent_id: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: NavItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this navigation item?")) return;
    try {
      let res = await fetch(`/BuggyDm/api/admin/navigation?id=${id}`, { method: "DELETE" });
      if (!res.ok) res = await fetch(`/api/admin/navigation?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        void refetch();
      } else {
        alert("Failed to delete: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const method = editingItem.id ? "PUT" : "POST";
      let res = await fetch("/BuggyDm/api/admin/navigation", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (!res.ok) {
        res = await fetch("/api/admin/navigation", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingItem),
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setEditingItem(null);
        void refetch();
      } else {
        alert("Failed to save: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.route.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-emerald-400" />
            Admin Navigation Management Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure dynamic database-driven navigation routes, roles, permissions, badges, and feature flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-lg shadow-emerald-500/10 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Menu Item
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search menu items or routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Order</th>
              <th className="py-3.5 px-4">Menu Item</th>
              <th className="py-3.5 px-4">Route</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Badge Provider</th>
              <th className="py-3.5 px-4">Feature Flag</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No navigation items found matching criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">#{item.display_order}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/50">
                        <IconResolver name={item.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-[10px] text-slate-500">{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{item.route}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.badge_provider ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                        {item.badge_provider}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.feature_flag ? (
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono text-[10px]">
                        {item.feature_flag}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.is_enabled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] border border-rose-500/20">
                        <X className="w-3 h-3" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors border border-rose-500/20"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                {editingItem.id ? "Edit Navigation Item" : "Create New Navigation Item"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.slug || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Route *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.route || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, route: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={editingItem.category || "Operations"}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  >
                    <option value="Main">Main</option>
                    <option value="Operations">Operations</option>
                    <option value="Business Intelligence">Business Intelligence</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Icon</label>
                  <select
                    value={editingItem.icon || "Package"}
                    onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingItem.display_order ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Provider</label>
                  <select
                    value={editingItem.badge_provider || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, badge_provider: e.target.value || null })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  >
                    {AVAILABLE_BADGES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Feature Flag</label>
                  <select
                    value={editingItem.feature_flag || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, feature_flag: e.target.value || null })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                  >
                    {AVAILABLE_FEATURE_FLAGS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_enabled ?? true}
                    onChange={(e) => setEditingItem({ ...editingItem, is_enabled: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Is Enabled</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.is_visible ?? true}
                    onChange={(e) => setEditingItem({ ...editingItem, is_visible: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Is Visible</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.supports_offline ?? true}
                    onChange={(e) => setEditingItem({ ...editingItem, supports_offline: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Supports Offline Cache</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold cursor-pointer transition-all"
                >
                  Save Navigation Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
