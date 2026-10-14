"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Flame,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Package,
  Layers,
  Heart,
  PlusCircle,
} from "lucide-react";
import {
  FlashDealsConfig,
  FlashDealItem,
  DEFAULT_FLASH_DEALS_CONFIG,
} from "@/types/flash-deals";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountType: string;
  discountedPrice: number;
  image?: string;
}

export default function FlashDealsAdminPage() {
  const [config, setConfig] = useState<FlashDealsConfig>(
    DEFAULT_FLASH_DEALS_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Search & Picker State
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Inputs Dictionary
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/flash-deals");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/flash-deals");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig({
              ...DEFAULT_FLASH_DEALS_CONFIG,
              ...json.data,
              enabled:
                json.data.enabled !== undefined
                  ? Boolean(json.data.enabled)
                  : true,
              deals:
                Array.isArray(json.data.deals) && json.data.deals.length > 0
                  ? json.data.deals
                  : DEFAULT_FLASH_DEALS_CONFIG.deals,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Flash Deals config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const fetchCatalogProducts = async (q: string = "") => {
    setSearching(true);
    try {
      let res = await fetch(
        `/BuggyDm/api/admin/products/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok && res.status === 404) {
        res = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(q)}`
        );
      }
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error("Failed to search catalog:", err);
    } finally {
      setSearching(false);
    }
  };

  const openProductPicker = (index: number) => {
    if (activePickerIndex === index) {
      setActivePickerIndex(null);
    } else {
      setActivePickerIndex(index);
      setSearchQuery("");
      void fetchCatalogProducts("");
    }
  };

  const updateDeal = (index: number, updates: Partial<FlashDealItem>) => {
    setConfig((prev) => {
      const deals = [...prev.deals];
      if (deals[index]) {
        deals[index] = { ...deals[index], ...updates };
        return { ...prev, deals };
      }
      return prev;
    });
  };

  const selectCatalogProduct = (index: number, prod: SearchProduct) => {
    const originalPrice = prod.price || 0;
    const discountedPrice = prod.discountedPrice || prod.price;

    updateDeal(index, {
      title: prod.name,
      price: `₹${discountedPrice}`,
      mrp: `₹${originalPrice}`,
      searchKeyword: prod.name,
      ...(prod.image ? { image: prod.image } : {}),
    });
    setActivePickerIndex(null);
  };

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);

      let res = await fetch("/BuggyDm/api/admin/hero-fest/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok && res.status === 404) {
        res = await fetch("/api/admin/hero-fest/upload", {
          method: "POST",
          body: formData,
        });
      }

      if (res.ok) {
        const json = await res.json();
        updateDeal(index, { image: json.url });
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploadingIndex(null);
    }
  };

  const addDeal = () => {
    const newDeal: FlashDealItem = {
      id: `flash_${Date.now()}`,
      title: "New Flash Deal",
      unit: "1 pack (500 g)",
      price: "₹99",
      mrp: "₹149",
      image: "assets/image/crop_flash_yogabar.png",
      hasSelectBadge: false,
      searchKeyword: "New Flash Deal",
    };
    setConfig((prev) => ({
      ...prev,
      deals: [...prev.deals, newDeal],
    }));
  };

  const removeDeal = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      deals: prev.deals.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/flash-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/flash-deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Flash Deals successfully saved and live in User App!",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to save configuration.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      confirm("Are you sure you want to reset Flash Deals to default items?")
    ) {
      setConfig(DEFAULT_FLASH_DEALS_CONFIG);
      setMessage({
        type: "success",
        text: "Reset to default layout. Click 'Save Configuration' to commit changes.",
      });
    }
  };

  const resolveImgSrc = (src: string) => {
    if (!src) return "";
    const trimmed = src.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/BuggyDm")) return trimmed;
    if (trimmed.startsWith("BuggyDm/")) return `/${trimmed}`;
    if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
      const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      return `/BuggyDm${clean}`;
    }
    if (trimmed.startsWith("/storage/") || trimmed.startsWith("storage/")) {
      const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      return `/BuggyDm${clean}`;
    }
    if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
      const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      return `/BuggyDm${clean}`;
    }
    const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `/BuggyDm${clean}`;
  };

  const PreviewImg = ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => {
    const [hasError, setHasError] = useState(false);
    const resolved = resolveImgSrc(src);

    useEffect(() => {
      setHasError(false);
    }, [src]);

    if (hasError || !resolved) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
          <Package className="h-4 w-4 opacity-40" />
        </div>
      );
    }

    return (
      <img
        src={resolved}
        alt={alt}
        className={className || "h-full w-full object-contain"}
        onError={() => setHasError(true)}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Loading Flash Deals settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-8 text-white shadow-xl md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Flame className="h-5 w-5 text-amber-200" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Quick Commerce Dynamic Module
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Flash Deals : All Time Low
          </h1>
          <p className="max-w-xl text-xs text-amber-100/90 sm:text-sm">
            Customize promotional deal cards, select badges, pricing, unit packaging, and live product search queries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-2.5 text-xs font-bold text-slate-900 shadow-lg transition hover:bg-amber-50 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            ) : (
              <Save className="h-4 w-4 text-amber-600" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-semibold shadow-sm transition ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Phone Preview Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Controls & Card List (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Global Section Settings */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                Section Header & Visibility
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Visible in User App
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none font-bold"
                  placeholder="Flash Deals: All Time Low"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="Limited Time Deals"
                />
              </div>
            </div>
          </div>

          {/* Deals Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                Flash Deal Products ({config.deals.length})
              </h3>
              <button
                type="button"
                onClick={addDeal}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition border border-amber-200"
              >
                <Plus className="h-4 w-4" />
                Add Flash Deal
              </button>
            </div>

            <div className="space-y-4">
              {config.deals.map((deal, idx) => {
                const isUploadingThis = uploadingIndex === idx;

                return (
                  <div
                    key={deal.id || idx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 relative group hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {deal.title || "Untitled Deal"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDeal(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Remove Deal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Browse Catalog Combobox */}
                    <div className="relative">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Browse Existing Catalog Products
                      </label>
                      <button
                        type="button"
                        onClick={() => openProductPicker(idx)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-sm hover:border-amber-400 transition"
                      >
                        <span className="truncate">
                          {activePickerIndex === idx
                            ? "Searching catalog products..."
                            : "Type to search catalog (e.g. Muesli, Ketchup, Honey)..."}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      </button>

                      {activePickerIndex === idx && (
                        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                void fetchCatalogProducts(e.target.value);
                              }}
                              placeholder="Type to search existing products..."
                              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-1.5">
                            {searching ? (
                              <p className="py-4 text-center text-xs text-slate-400">
                                Searching products...
                              </p>
                            ) : searchResults.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate-400">
                                No products found. Try another search.
                              </p>
                            ) : (
                              searchResults.map((prod) => (
                                <div
                                  key={prod.id}
                                  onClick={() =>
                                    selectCatalogProduct(idx, prod)
                                  }
                                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-amber-50 cursor-pointer"
                                >
                                  {prod.image ? (
                                    <img
                                      src={resolveImgSrc(prod.image)}
                                      alt={prod.name}
                                      className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-200"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                      <Package className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-800">
                                      {prod.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      ID #{prod.id} • ₹{prod.discountedPrice}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Product Title
                        </label>
                        <input
                          type="text"
                          value={deal.title}
                          onChange={(e) =>
                            updateDeal(idx, { title: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none font-bold"
                          placeholder="Product Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Unit / Weight Package
                        </label>
                        <input
                          type="text"
                          value={deal.unit}
                          onChange={(e) =>
                            updateDeal(idx, { unit: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                          placeholder="1 pack (1 kg)"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Flash Deal Price (Green Badge)
                        </label>
                        <input
                          type="text"
                          value={deal.price}
                          onChange={(e) =>
                            updateDeal(idx, { price: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none text-emerald-700 font-bold"
                          placeholder="₹454"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Original MRP (Strikethrough)
                        </label>
                        <input
                          type="text"
                          value={deal.mrp}
                          onChange={(e) =>
                            updateDeal(idx, { mrp: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none text-slate-400 font-medium"
                          placeholder="₹890"
                        />
                      </div>
                    </div>

                    {/* Search Keyword & Select Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Search Keyword / Tap Action
                        </label>
                        <input
                          type="text"
                          value={deal.searchKeyword}
                          onChange={(e) =>
                            updateDeal(idx, { searchKeyword: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                          placeholder="Search keyword on tap"
                        />
                      </div>
                      <div className="pt-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            type="checkbox"
                            checked={deal.hasSelectBadge}
                            onChange={(e) =>
                              updateDeal(idx, {
                                hasSelectBadge: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            Show "select &gt;" Badge
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Image URL & Upload */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Card Image (Upload or URL)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={deal.image}
                          onChange={(e) =>
                            updateDeal(idx, { image: e.target.value })
                          }
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                          placeholder="Image path or URL"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => {
                            fileInputRefs.current[idx] = el;
                          }}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              void handleFileUpload(idx, e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[idx]?.click()}
                          disabled={isUploadingThis}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                        >
                          {isUploadingThis ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                          ) : (
                            <UploadCloud className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {isUploadingThis ? "Uploading..." : "Upload"}
                        </button>
                      </div>

                      {/* Thumbnail Preview */}
                      {deal.image && (
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5">
                            <PreviewImg src={deal.image} alt={deal.title} />
                          </div>
                          <span className="text-[11px] text-slate-500 truncate flex-1 font-mono">
                            {deal.image}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live App Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-amber-500" />
              Live Mobile Preview
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Auto-Syncing
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="relative mx-auto w-full max-w-[340px] rounded-[44px] border-[8px] border-slate-800 bg-slate-900 p-2 shadow-2xl">
            {/* Speaker & Sensor bar */}
            <div className="absolute left-1/2 top-4 h-4 w-28 -translate-x-1/2 rounded-full bg-slate-800" />

            {/* Screen Canvas */}
            <div className="min-h-[580px] overflow-hidden rounded-[34px] bg-[#F8FAFC] pb-6 pt-7 text-slate-800">
              {/* App Status Bar Mockup */}
              <div className="flex items-center justify-between px-6 pb-3 text-[10px] font-bold text-slate-500">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <div className="h-2.5 w-3.5 rounded-sm border border-slate-400" />
                </div>
              </div>

              {/* Feed Content */}
              <div className="space-y-4">
                {/* Simulated search header */}
                <div className="px-4">
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-400 shadow-sm border border-slate-100">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px]">Search for flash deals, groceries...</span>
                  </div>
                </div>

                {/* The Flash Deals Section Preview */}
                <div className="space-y-3 pt-2">
                  {/* Section Title */}
                  <div className="px-4">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                      {config.title || "Flash Deals: All Time Low"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {config.subtitle || "Limited Time Deals"}
                    </p>
                  </div>

                  {/* Horizontal Scroll Shelf */}
                  <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                    {config.deals.map((deal, idx) => (
                      <div
                        key={deal.id || idx}
                        className="w-[136px] shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col justify-between"
                      >
                        {/* Image Canvas with Badges */}
                        <div className="relative h-[115px] w-full bg-[#FAFAFA] p-2 flex items-center justify-center">
                          {/* Image */}
                          <div className="h-full w-full flex items-center justify-center">
                            <PreviewImg
                              src={deal.image}
                              alt={deal.title}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          {/* Select Badge */}
                          {deal.hasSelectBadge && (
                            <div className="absolute left-1.5 top-1.5 rounded bg-[#78350F] px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-0.5">
                              <span>select</span>
                              <span>&gt;</span>
                            </div>
                          )}

                          {/* Favorite Heart */}
                          <div className="absolute right-1.5 top-1.5 rounded-full bg-white/80 p-1 shadow-sm">
                            <Heart className="h-3 w-3 text-rose-500" />
                          </div>

                          {/* Pink Add Button */}
                          <div className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500 bg-white shadow-sm text-rose-600">
                            <Plus className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-2 space-y-1 bg-white">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-[#16A34A] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {deal.price || "₹0"}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {deal.mrp || ""}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 truncate">
                            {deal.unit || ""}
                          </p>
                          <p className="text-[10px] font-bold text-slate-800 line-clamp-1">
                            {deal.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Next Feed Section */}
                <div className="mx-4 rounded-2xl bg-slate-100 p-4 border border-slate-200/60 text-center text-slate-400 text-xs">
                  Other Grocery Modules & Banners...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
