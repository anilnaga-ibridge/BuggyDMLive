"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Store,
  UploadCloud,
  Check,
  Package,
  Layers,
  Upload,
  Search,
  ChevronDown,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  StealDealsConfig,
  StealProductItem,
  DEFAULT_STEAL_DEALS_CONFIG,
} from "@/types/steal-deals";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountType: string;
  discountedPrice: number;
  image: string;
}

export default function StealDealsManagerPage() {
  const [config, setConfig] = useState<StealDealsConfig>(DEFAULT_STEAL_DEALS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Uploading state
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Catalog Product Browser State
  // Active target is e.g. "row1-0", "row1-1", "row2-0", etc.
  const [activePickerTarget, setActivePickerTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const row1FileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const row2FileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tabFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const catFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/steal-deals");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/steal-deals");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Steal Deals config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const fetchCatalogProducts = async (q: string = "") => {
    setSearching(true);
    try {
      let res = await fetch(`/BuggyDm/api/admin/products/search?q=${encodeURIComponent(q)}`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`);
      }
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error("Product search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const openProductPicker = (targetKey: string) => {
    if (activePickerTarget === targetKey) {
      setActivePickerTarget(null);
    } else {
      setActivePickerTarget(targetKey);
      setSearchQuery("");
      void fetchCatalogProducts("");
    }
  };

  // Debounced search when user types in the catalog search input
  useEffect(() => {
    if (!activePickerTarget) return;

    const timer = setTimeout(async () => {
      await fetchCatalogProducts(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activePickerTarget]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/steal-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/steal-deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({ type: "success", text: "Steal Deals configuration saved and live in User App!" });
      } else {
        setMessage({ type: "error", text: "Failed to save Steal Deals configuration." });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Network error saving configuration." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to default Steal Deals configuration?")) {
      setConfig({ ...DEFAULT_STEAL_DEALS_CONFIG });
      setMessage({ type: "success", text: "Reset to default. Click 'Save & Publish' to persist." });
    }
  };

  const handleFileUpload = async (
    file: File,
    targetKey: string,
    onSuccess: (url: string) => void
  ) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image file too large (max 10MB)." });
      return;
    }

    setUploadingTarget(targetKey);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      let res = await fetch("/BuggyDm/api/grocery/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/upload", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        onSuccess(data.url);
        setMessage({ type: "success", text: "Image uploaded and applied successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image." });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Network error while uploading image." });
    } finally {
      setUploadingTarget(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const selectProductFromBackend = (
    rowKey: "row1Products" | "row2Products",
    index: number,
    prod: SearchProduct
  ) => {
    const originalPrice = prod.price || 0;
    const discountedPrice = prod.discountedPrice || prod.price;
    const diff = originalPrice - discountedPrice;
    const discountText = diff > 0 ? `₹${diff} OFF` : "DEAL";

    setConfig((prev) => {
      const copy = [...prev[rowKey]];
      copy[index] = {
        ...copy[index],
        id: prod.id,
        title: prod.name,
        price: `₹${discountedPrice}`,
        mrp: `₹${originalPrice}`,
        discount: discountText,
        image: prod.image || copy[index].image,
      };
      return { ...prev, [rowKey]: copy };
    });

    setActivePickerTarget(null);
    setSearchQuery("");
    setMessage({
      type: "success",
      text: `Selected "${prod.name}" (ID #${prod.id}) from catalog!`,
    });
    setTimeout(() => setMessage(null), 3500);
  };

  const unlinkProduct = (rowKey: "row1Products" | "row2Products", index: number) => {
    setConfig((prev) => {
      const copy = [...prev[rowKey]];
      copy[index] = { ...copy[index], id: null };
      return { ...prev, [rowKey]: copy };
    });
  };

  const updateProduct = (
    rowKey: "row1Products" | "row2Products",
    index: number,
    field: keyof StealProductItem,
    value: string
  ) => {
    setConfig((prev) => {
      const copy = [...prev[rowKey]];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [rowKey]: copy };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19] text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mr-3" />
        Loading Steal Deals Configuration...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080b11] text-slate-200">
      {/* Top Bar Header */}
      <div className="h-16 px-6 bg-[#0b0f19]/90 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Steal Deals Manager
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live In App
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Browse existing catalog products, select from backend dropdown & upload images
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save & Publish
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-3 text-sm animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              : "bg-rose-950/40 border-rose-500/30 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content: Split Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Live Mobile Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              Live Mobile User App Preview
            </span>
            <span className="text-[11px] text-slate-500">Exact Pixel Match</span>
          </div>

          {/* Simulator Phone Frame */}
          <div className="bg-white rounded-3xl p-4 border-4 border-slate-800 shadow-2xl sticky top-24 text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={config.lightningIcon}
                  alt=""
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-none">
                    {config.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {config.subtitle}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold flex items-center gap-1">
                {config.viewAllLinkText} &gt;
              </div>
            </div>

            {/* Store Tabs */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {config.storeTabs.map((tab, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 rounded-2xl p-2 h-16 flex items-center ${
                    tab.isTrending
                      ? "w-28 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex-col justify-center"
                      : "w-24 bg-slate-50 border border-slate-200 justify-between"
                  }`}
                >
                  {tab.isTrending ? (
                    <>
                      <div className="flex items-center gap-1 font-bold text-xs">
                        <span>🔥</span> {tab.title}
                      </div>
                      <div className="w-6 h-0.5 bg-white/80 rounded mt-1" />
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 leading-none">
                          {tab.price}
                        </div>
                        <div className="text-[10px] text-slate-500">{tab.label}</div>
                      </div>
                      {tab.icon && (
                        <img src={tab.icon} alt="" className="w-8 h-8 object-contain" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Category Chips */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {config.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    cat.isAll
                      ? "bg-rose-50 border-rose-500 text-rose-600"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {cat.isAll ? (
                    <span className="text-[10px]">⊞</span>
                  ) : (
                    cat.icon && (
                      <img src={cat.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                    )
                  )}
                  {cat.name}
                </div>
              ))}
            </div>

            {/* Row 1 3-Column Product Grid */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {config.row1Products.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-1.5 border border-slate-100 shadow-sm flex flex-col"
                >
                  <div className="rounded-lg overflow-hidden bg-slate-50 aspect-[1.22] flex items-center justify-center">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="bg-[#00875A] text-white text-[9.5px] font-extrabold px-1 rounded">
                      {p.price}
                    </span>
                    <span className="text-[9.5px] text-slate-400 line-through">
                      {p.mrp}
                    </span>
                  </div>
                  <div className="text-[9.5px] font-extrabold text-[#00875A] mt-0.5">
                    {p.discount}
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-800 line-clamp-2 mt-0.5 leading-tight">
                    {p.title}
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-auto">{p.unit}</div>
                </div>
              ))}
            </div>

            {/* Row 2 3-Column Product Grid */}
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {config.row2Products.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-1.5 border border-slate-100 shadow-sm flex flex-col"
                >
                  <div className="rounded-lg overflow-hidden bg-slate-50 aspect-[1.22] flex items-center justify-center">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="bg-[#00875A] text-white text-[9.5px] font-extrabold px-1 rounded">
                      {p.price}
                    </span>
                    <span className="text-[9.5px] text-slate-400 line-through">
                      {p.mrp}
                    </span>
                  </div>
                  <div className="text-[9.5px] font-extrabold text-[#00875A] mt-0.5">
                    {p.discount}
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-800 line-clamp-2 mt-0.5 leading-tight">
                    {p.title}
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-auto">{p.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Header Titles */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Zap className="w-4 h-4 text-rose-400" />
              1. Section Header & Badges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Row 1 Products */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Package className="w-4 h-4 text-emerald-400" />
              2. Row 1 Products (Browse Catalog & Image Uploads)
            </h3>

            <div className="space-y-4">
              {config.row1Products.map((p, idx) => {
                const targetKey = `row1-${idx}`;
                const isUploadingThis = uploadingTarget === targetKey;
                const isPickerOpen = activePickerTarget === targetKey;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 relative"
                  >
                    {/* Card Header with Linked Badge & Browse Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400">
                          Product #{idx + 1}
                        </span>
                        {p.id ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                            <Check className="w-3 h-3" />
                            <span>Catalog ID #{p.id}</span>
                            <button
                              type="button"
                              onClick={() => unlinkProduct("row1Products", idx)}
                              className="text-slate-400 hover:text-rose-400 ml-1 underline cursor-pointer"
                              title="Unlink from catalog"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Custom Item</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isPickerOpen ? "Close Catalog" : "Browse Existing Products"}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isPickerOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Catalog Dropdown Combobox Modal (Hero Fest Style) */}
                    {isPickerOpen && (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 animate-fade-in z-30">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            Browse Existing Catalog Products
                          </span>
                          <button
                            type="button"
                            onClick={() => setActivePickerTarget(null)}
                            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                            title="Close"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Type to search existing products (e.g. Ghee, Milk, Maggi)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          {searching && (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 pr-1">
                          {searchResults.length === 0 ? (
                            <div className="py-5 text-center text-xs text-slate-500">
                              {searching ? "Searching catalog products..." : "No products found."}
                            </div>
                          ) : (
                            searchResults.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => selectProductFromBackend("row1Products", idx, prod)}
                                className="w-full text-left px-2.5 py-2 hover:bg-slate-800/90 rounded-lg flex items-center justify-between text-xs transition cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt=""
                                      className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0 border border-slate-700"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <span className="font-medium text-slate-200 block truncate group-hover:text-emerald-400">
                                      {prod.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500">ID #{prod.id}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                  <span className="line-through text-slate-500 text-[11px] mr-1.5">
                                    ₹{prod.price}
                                  </span>
                                  <span className="font-bold text-amber-400 text-xs">
                                    ₹{prod.discountedPrice}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Product Image Box with Direct Upload Trigger */}
                      <div className="sm:col-span-3 flex flex-col items-center gap-1.5">
                        <div
                          onClick={() => row1FileRefs.current[idx]?.click()}
                          className="relative w-20 h-18 rounded-lg overflow-hidden border-2 border-dashed border-slate-700 hover:border-rose-500 cursor-pointer group bg-slate-950 flex items-center justify-center transition"
                          title="Click to upload custom image"
                        >
                          <img
                            src={p.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-40 transition"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                            <Upload className="w-4 h-4" />
                            <span className="text-[9px] font-bold mt-0.5">Change</span>
                          </div>
                          {isUploadingThis && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          ref={(el) => {
                            row1FileRefs.current[idx] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, targetKey, (url) => {
                                updateProduct("row1Products", idx, "image", url);
                              });
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => row1FileRefs.current[idx]?.click()}
                          disabled={isUploadingThis}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                        >
                          <UploadCloud className="w-3 h-3 text-rose-400" />
                          Upload
                        </button>
                      </div>

                      {/* Product Name & Unit */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">
                            Product Display Name
                          </label>
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) =>
                              updateProduct("row1Products", idx, "title", e.target.value)
                            }
                            placeholder="e.g. Aaha Tiramisu | Rich Coffee Dessert"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">
                            Unit / Pack Size
                          </label>
                          <input
                            type="text"
                            value={p.unit}
                            onChange={(e) =>
                              updateProduct("row1Products", idx, "unit", e.target.value)
                            }
                            placeholder="e.g. 80 g, 1 pack (237 g)"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      {/* Price, MRP & Discount Tag */}
                      <div className="sm:col-span-4 grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Price</label>
                          <input
                            type="text"
                            value={p.price}
                            onChange={(e) =>
                              updateProduct("row1Products", idx, "price", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">MRP</label>
                          <input
                            type="text"
                            value={p.mrp}
                            onChange={(e) =>
                              updateProduct("row1Products", idx, "mrp", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 focus:outline-none focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Tag</label>
                          <input
                            type="text"
                            value={p.discount}
                            onChange={(e) =>
                              updateProduct("row1Products", idx, "discount", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Row 2 Products */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Package className="w-4 h-4 text-emerald-400" />
              3. Row 2 Products (Browse Catalog & Image Uploads)
            </h3>

            <div className="space-y-4">
              {config.row2Products.map((p, idx) => {
                const targetKey = `row2-${idx}`;
                const isUploadingThis = uploadingTarget === targetKey;
                const isPickerOpen = activePickerTarget === targetKey;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 relative"
                  >
                    {/* Card Header with Linked Badge & Browse Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400">
                          Product #{idx + 4}
                        </span>
                        {p.id ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                            <Check className="w-3 h-3" />
                            <span>Catalog ID #{p.id}</span>
                            <button
                              type="button"
                              onClick={() => unlinkProduct("row2Products", idx)}
                              className="text-slate-400 hover:text-rose-400 ml-1 underline cursor-pointer"
                              title="Unlink from catalog"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Custom Item</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isPickerOpen ? "Close Catalog" : "Browse Existing Products"}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isPickerOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Catalog Dropdown Combobox Modal (Hero Fest Style) */}
                    {isPickerOpen && (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 animate-fade-in z-30">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            Browse Existing Catalog Products
                          </span>
                          <button
                            type="button"
                            onClick={() => setActivePickerTarget(null)}
                            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                            title="Close"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Type to search existing products (e.g. Ghee, Milk, Maggi)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          {searching && (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 pr-1">
                          {searchResults.length === 0 ? (
                            <div className="py-5 text-center text-xs text-slate-500">
                              {searching ? "Searching catalog products..." : "No products found."}
                            </div>
                          ) : (
                            searchResults.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => selectProductFromBackend("row2Products", idx, prod)}
                                className="w-full text-left px-2.5 py-2 hover:bg-slate-800/90 rounded-lg flex items-center justify-between text-xs transition cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt=""
                                      className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0 border border-slate-700"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <span className="font-medium text-slate-200 block truncate group-hover:text-emerald-400">
                                      {prod.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500">ID #{prod.id}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                  <span className="line-through text-slate-500 text-[11px] mr-1.5">
                                    ₹{prod.price}
                                  </span>
                                  <span className="font-bold text-amber-400 text-xs">
                                    ₹{prod.discountedPrice}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Product Image Box with Direct Upload Trigger */}
                      <div className="sm:col-span-3 flex flex-col items-center gap-1.5">
                        <div
                          onClick={() => row2FileRefs.current[idx]?.click()}
                          className="relative w-20 h-18 rounded-lg overflow-hidden border-2 border-dashed border-slate-700 hover:border-rose-500 cursor-pointer group bg-slate-950 flex items-center justify-center transition"
                          title="Click to upload custom image"
                        >
                          <img
                            src={p.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-40 transition"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                            <Upload className="w-4 h-4" />
                            <span className="text-[9px] font-bold mt-0.5">Change</span>
                          </div>
                          {isUploadingThis && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          ref={(el) => {
                            row2FileRefs.current[idx] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, targetKey, (url) => {
                                updateProduct("row2Products", idx, "image", url);
                              });
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => row2FileRefs.current[idx]?.click()}
                          disabled={isUploadingThis}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                        >
                          <UploadCloud className="w-3 h-3 text-rose-400" />
                          Upload
                        </button>
                      </div>

                      {/* Product Name & Unit */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">
                            Product Display Name
                          </label>
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) =>
                              updateProduct("row2Products", idx, "title", e.target.value)
                            }
                            placeholder="e.g. Lakme Absolute Glow Toner"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">
                            Unit / Pack Size
                          </label>
                          <input
                            type="text"
                            value={p.unit}
                            onChange={(e) =>
                              updateProduct("row2Products", idx, "unit", e.target.value)
                            }
                            placeholder="e.g. 100 ml, 400 g"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      {/* Price, MRP & Discount Tag */}
                      <div className="sm:col-span-4 grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Price</label>
                          <input
                            type="text"
                            value={p.price}
                            onChange={(e) =>
                              updateProduct("row2Products", idx, "price", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">MRP</label>
                          <input
                            type="text"
                            value={p.mrp}
                            onChange={(e) =>
                              updateProduct("row2Products", idx, "mrp", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 focus:outline-none focus:border-slate-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium">Tag</label>
                          <input
                            type="text"
                            value={p.discount}
                            onChange={(e) =>
                              updateProduct("row2Products", idx, "discount", e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Store Tabs & Icons Upload */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Store className="w-4 h-4 text-amber-400" />
              4. Store Tabs (3D Icons & Price Badges)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.storeTabs.map((tab, idx) => {
                const targetKey = `tab-${idx}`;
                const isUploadingThis = uploadingTarget === targetKey;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        onClick={() => !tab.isTrending && tabFileRefs.current[idx]?.click()}
                        className={`w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden relative ${
                          !tab.isTrending ? "cursor-pointer hover:border-amber-500" : ""
                        }`}
                        title={tab.isTrending ? "Trending icon" : "Upload 3D Icon"}
                      >
                        {tab.icon ? (
                          <img src={tab.icon} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        )}
                        {isUploadingThis && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      {!tab.isTrending && (
                        <input
                          ref={(el) => {
                            tabFileRefs.current[idx] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, targetKey, (url) => {
                                setConfig((prev) => {
                                  const copy = [...prev.storeTabs];
                                  copy[idx] = { ...copy[idx], icon: url };
                                  return { ...prev, storeTabs: copy };
                                });
                              });
                            }
                          }}
                        />
                      )}

                      <div>
                        {tab.isTrending ? (
                          <div className="text-xs font-bold text-white">Trending Tab</div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tab.price || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConfig((prev) => {
                                  const copy = [...prev.storeTabs];
                                  copy[idx] = { ...copy[idx], price: val };
                                  return { ...prev, storeTabs: copy };
                                });
                              }}
                              className="w-14 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold"
                            />
                            <span className="text-xs text-slate-400">Store</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!tab.isTrending && (
                      <button
                        type="button"
                        onClick={() => tabFileRefs.current[idx]?.click()}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <UploadCloud className="w-3 h-3 text-amber-400" />
                        Icon
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Category Filter Chips & Icons Upload */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-4 h-4 text-sky-400" />
              5. Category Filter Chips (Icons & Names)
            </h3>

            <div className="space-y-2.5">
              {config.categories.map((cat, idx) => {
                const targetKey = `cat-${idx}`;
                const isUploadingThis = uploadingTarget === targetKey;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <div
                        onClick={() => !cat.isAll && catFileRefs.current[idx]?.click()}
                        className={`w-9 h-9 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden relative shrink-0 ${
                          !cat.isAll ? "cursor-pointer hover:border-sky-500" : ""
                        }`}
                        title={cat.isAll ? "ALL category grid" : "Upload Category Icon"}
                      >
                        {cat.isAll ? (
                          <span className="text-rose-500 text-xs font-bold">⊞</span>
                        ) : cat.icon ? (
                          <img src={cat.icon} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                        {isUploadingThis && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      {!cat.isAll && (
                        <input
                          ref={(el) => {
                            catFileRefs.current[idx] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, targetKey, (url) => {
                                setConfig((prev) => {
                                  const copy = [...prev.categories];
                                  copy[idx] = { ...copy[idx], icon: url };
                                  return { ...prev, categories: copy };
                                });
                              });
                            }
                          }}
                        />
                      )}

                      <input
                        type="text"
                        value={cat.name}
                        disabled={cat.isAll}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig((prev) => {
                            const copy = [...prev.categories];
                            copy[idx] = { ...copy[idx], name: val };
                            return { ...prev, categories: copy };
                          });
                        }}
                        placeholder="Category Name"
                        className={`px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white flex-1 focus:outline-none focus:border-sky-500 ${
                          cat.isAll ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    {!cat.isAll && (
                      <button
                        type="button"
                        onClick={() => catFileRefs.current[idx]?.click()}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700 shrink-0"
                      >
                        <UploadCloud className="w-3 h-3 text-sky-400" />
                        Icon
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
