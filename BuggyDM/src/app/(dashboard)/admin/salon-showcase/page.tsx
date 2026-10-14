"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Scissors,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  UploadCloud,
  Upload,
  Check,
  Package,
  Sparkles,
  Search,
  ChevronDown,
  X,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import {
  HomeSalonShowcaseConfig,
  SalonMiniCard,
  DEFAULT_SALON_SHOWCASE_CONFIG,
} from "@/types/salon-showcase";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function SalonShowcaseManagerPage() {
  const [config, setConfig] = useState<HomeSalonShowcaseConfig>(
    DEFAULT_SALON_SHOWCASE_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Target for Catalog Search or Upload
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Input Refs
  const heroDealFileRef = useRef<HTMLInputElement>(null);
  const miniCardFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bloomBannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/salon-showcase");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/salon-showcase");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Salon Showcase config:", err);
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
      console.error("Product search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const openProductPicker = () => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
    } else {
      setIsPickerOpen(true);
      setSearchQuery("");
      void fetchCatalogProducts("");
    }
  };

  useEffect(() => {
    if (!isPickerOpen) return;
    const timer = setTimeout(async () => {
      await fetchCatalogProducts(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isPickerOpen]);

  const selectProductForDealsCorner = (prod: SearchProduct) => {
    setConfig((prev) => ({
      ...prev,
      salon: {
        ...prev.salon,
        heroDeal: {
          ...prev.salon.heroDeal,
          itemId: prod.id,
          itemName: prod.name,
          originalPrice: prod.price,
          discountedPrice: prod.discountedPrice || prod.price,
          itemImage: prod.image || prev.salon.heroDeal.itemImage,
        },
      },
    }));

    setIsPickerOpen(false);
    setMessage({
      type: "success",
      text: `Selected "${prod.name}" (ID #${prod.id}) for Deals Corner!`,
    });
    setTimeout(() => setMessage(null), 3500);
  };

  const unlinkHeroDeal = () => {
    setConfig((prev) => ({
      ...prev,
      salon: {
        ...prev.salon,
        heroDeal: {
          ...prev.salon.heroDeal,
          itemId: null,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/salon-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/salon-showcase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Salon & Bloom configuration saved and live in User App!",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to save configuration.",
        });
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
    if (confirm("Reset to default Salon at Home configuration?")) {
      setConfig({ ...DEFAULT_SALON_SHOWCASE_CONFIG });
      setMessage({
        type: "success",
        text: "Reset to default. Click 'Save & Publish' to persist.",
      });
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
        setMessage({
          type: "success",
          text: "Image uploaded and applied successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload image.",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Network error while uploading image." });
    } finally {
      setUploadingTarget(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const updateMiniCard = (
    idx: number,
    field: keyof SalonMiniCard,
    value: string
  ) => {
    setConfig((prev) => {
      const copy = [...prev.salon.miniCards];
      copy[idx] = { ...copy[idx], [field]: value };
      return {
        ...prev,
        salon: { ...prev.salon, miniCards: copy },
      };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19] text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mr-3" />
        Loading Salon & Bloom Configuration...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080b11] text-slate-200">
      {/* Top Bar Header */}
      <div className="h-16 px-6 bg-[#0b0f19]/90 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Salon at Home & Bloom Manager
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live In App
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage Salon Showcase, Deals Corner Hero & Bloom Promotional Banner
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
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
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
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              Live Mobile User App Preview
            </span>
            <span className="text-[11px] text-slate-500">Exact Pixel Match</span>
          </div>

          {/* Phone Frame */}
          <div className="bg-white rounded-3xl p-4 border-4 border-slate-800 shadow-2xl sticky top-24 text-slate-900 space-y-4">
            {/* 1. Salon at Home Card Container */}
            <div className="rounded-2xl p-3 bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-white border border-sky-100 shadow-sm space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sky-500 text-xs font-bold">✦</span>
                    <h2 className="text-xl font-black text-sky-950 italic tracking-tight font-serif">
                      {config.salon.title}
                    </h2>
                    <span className="text-sky-500 text-xs font-bold">✦</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <span>{config.salon.sponsorText}</span>
                    <span className="font-bold px-1.5 py-0.2 rounded bg-white text-slate-900 border border-slate-200">
                      {config.salon.sponsorName}
                    </span>
                  </div>
                </div>

                {/* Hero Header Products Silhouette */}
                <div className="w-20 h-12 bg-white/60 rounded-lg p-1 flex items-center justify-center border border-sky-100">
                  <img
                    src="assets/image/salon_at_home_card.png"
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Card Grid Body: Left Deals Corner + Right 2x2 Mini Cards */}
              <div className="grid grid-cols-12 gap-2">
                {/* Left: Deals Corner Hero Card (4 cols) */}
                <div className="col-span-4 bg-white rounded-xl p-2 border border-sky-100 shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <div className="text-[10px] font-extrabold text-sky-950 uppercase tracking-wider">
                    DEALS Corner
                  </div>
                  <div className="w-16 h-20 my-1 flex items-center justify-center">
                    <img
                      src={config.salon.heroDeal.itemImage}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  {/* Price Tag Circle */}
                  <div className="w-full bg-[#0284C7] text-white py-1 px-1.5 rounded-lg">
                    <div className="text-[9px] line-through opacity-80 leading-none">
                      ₹{config.salon.heroDeal.originalPrice}
                    </div>
                    <div className="text-xs font-black leading-none mt-0.5">
                      ₹{config.salon.heroDeal.discountedPrice}
                    </div>
                  </div>
                </div>

                {/* Right: 2x2 Mini Deal Cards (8 cols) */}
                <div className="col-span-8 grid grid-cols-2 gap-2">
                  {config.salon.miniCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-1.5 border border-sky-100 shadow-xs flex flex-col justify-between"
                    >
                      <div className="text-[9.5px] font-bold text-slate-900 leading-tight line-clamp-2 h-7">
                        {card.title}
                      </div>
                      <div className="w-full h-10 my-1 flex items-center justify-center">
                        <img
                          src={card.image}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="w-full bg-[#0284C7] text-white text-center py-0.5 px-1 rounded text-[9px] font-extrabold tracking-tight">
                        {card.badgeText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Bloom Promotional Banner */}
            {config.bloom.enabled && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
                <img
                  src={config.bloom.image}
                  alt={config.bloom.title}
                  className="w-full aspect-[751/277] object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Salon at Home Header */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Scissors className="w-4 h-4 text-sky-400" />
              1. Salon at Home Header & Brand Sponsor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={config.salon.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      salon: { ...config.salon, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Sponsor Brand Name
                </label>
                <input
                  type="text"
                  value={config.salon.sponsorName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      salon: { ...config.salon, sponsorName: e.target.value },
                    })
                  }
                  placeholder="e.g. L'ORÉAL"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Deals Corner Hero Product */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" />
                2. Deals Corner Hero Product
              </h3>

              <div className="flex items-center gap-2">
                {config.salon.heroDeal.itemId ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                    <Check className="w-3 h-3" />
                    <span>Catalog ID #{config.salon.heroDeal.itemId}</span>
                    <button
                      type="button"
                      onClick={unlinkHeroDeal}
                      className="text-slate-400 hover:text-rose-400 ml-1 underline cursor-pointer"
                    >
                      Unlink
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={openProductPicker}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>
                    {isPickerOpen
                      ? "Close Catalog"
                      : "Browse Existing Products"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Catalog Dropdown Picker */}
            {isPickerOpen && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 animate-fade-in z-30">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    Browse Existing Catalog Products
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
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
                    placeholder="Type to search existing products (e.g. Shampoo, L'Oreal, Hair)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                  {searching && (
                    <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 pr-1">
                  {searchResults.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-500">
                      {searching
                        ? "Searching catalog products..."
                        : "No products found."}
                    </div>
                  ) : (
                    searchResults.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => selectProductForDealsCorner(prod)}
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
                            <span className="font-medium text-slate-200 block truncate group-hover:text-sky-400">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ID #{prod.id}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="line-through text-slate-500 text-[11px] mr-1.5">
                            ₹{prod.price}
                          </span>
                          <span className="font-bold text-sky-400 text-xs">
                            ₹{prod.discountedPrice}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Product Edit Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Product Image */}
              <div className="sm:col-span-3 flex flex-col items-center gap-1.5">
                <div
                  onClick={() => heroDealFileRef.current?.click()}
                  className="relative w-22 h-22 rounded-xl overflow-hidden border-2 border-dashed border-slate-700 hover:border-sky-500 cursor-pointer group bg-slate-950 flex items-center justify-center transition"
                  title="Click to upload custom image"
                >
                  <img
                    src={config.salon.heroDeal.itemImage}
                    alt=""
                    className="w-full h-full object-contain group-hover:opacity-40 transition p-1"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">Change</span>
                  </div>
                  {uploadingTarget === "heroDeal" && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <input
                  ref={heroDealFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, "heroDeal", (url) => {
                        setConfig((prev) => ({
                          ...prev,
                          salon: {
                            ...prev.salon,
                            heroDeal: {
                              ...prev.salon.heroDeal,
                              itemImage: url,
                            },
                          },
                        }));
                      });
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => heroDealFileRef.current?.click()}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <UploadCloud className="w-3 h-3 text-sky-400" />
                  Upload
                </button>
              </div>

              {/* Product Details */}
              <div className="sm:col-span-9 space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={config.salon.heroDeal.itemName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        salon: {
                          ...config.salon,
                          heroDeal: {
                            ...config.salon.heroDeal,
                            itemName: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={config.salon.heroDeal.originalPrice}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          salon: {
                            ...config.salon,
                            heroDeal: {
                              ...config.salon.heroDeal,
                              originalPrice: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">
                      Deal Price (₹)
                    </label>
                    <input
                      type="number"
                      value={config.salon.heroDeal.discountedPrice}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          salon: {
                            ...config.salon,
                            heroDeal: {
                              ...config.salon.heroDeal,
                              discountedPrice: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-sky-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={config.salon.heroDeal.unit || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          salon: {
                            ...config.salon,
                            heroDeal: {
                              ...config.salon.heroDeal,
                              unit: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g. 300 ml"
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 4 2x2 Mini Deal Cards */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-sky-400" />
              3. 4 Mini Category Deal Cards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.salon.miniCards.map((card, idx) => {
                const targetKey = `mini-${idx}`;
                const isUploadingThis = uploadingTarget === targetKey;

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3 relative"
                  >
                    {/* Image Preview & Upload */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        onClick={() => miniCardFileRefs.current[idx]?.click()}
                        className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 hover:border-sky-500 overflow-hidden relative cursor-pointer flex items-center justify-center group transition"
                        title="Upload Card Image"
                      >
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-contain group-hover:opacity-40 transition p-1"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                        {isUploadingThis && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <input
                        ref={(el) => {
                          miniCardFileRefs.current[idx] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, targetKey, (url) => {
                              updateMiniCard(idx, "image", url);
                            });
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => miniCardFileRefs.current[idx]?.click()}
                        disabled={isUploadingThis}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9.5px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <UploadCloud className="w-2.5 h-2.5 text-sky-400" />
                        Upload
                      </button>
                    </div>

                    {/* Card Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        <label className="text-[9.5px] text-slate-400 block">
                          Title
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) =>
                            updateMiniCard(idx, "title", e.target.value)
                          }
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9.5px] text-slate-400 block">
                            Badge
                          </label>
                          <input
                            type="text"
                            value={card.badgeText}
                            onChange={(e) =>
                              updateMiniCard(idx, "badgeText", e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-sky-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-400 block">
                            Keyword
                          </label>
                          <input
                            type="text"
                            value={card.searchKeyword}
                            onChange={(e) =>
                              updateMiniCard(
                                idx,
                                "searchKeyword",
                                e.target.value
                              )
                            }
                            className="w-full px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Bloom Fresh Fruits Promotional Banner (Supports Image & Video) */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                4. Bloom Fresh Fruits Promotional Banner (Image & Video)
              </h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bloom.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bloom: { ...config.bloom, enabled: e.target.checked },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs text-slate-300">Visible in App</span>
              </label>
            </div>

            <div className="space-y-4">
              {/* Media Format Selector: Image vs Video */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      bloom: { ...prev.bloom, mediaType: "image" },
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    (config.bloom.mediaType || "image") === "image"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image Banner
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      bloom: { ...prev.bloom, mediaType: "video" },
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    config.bloom.mediaType === "video"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Video Banner (MP4 / WebM)
                </button>
              </div>

              {/* Media Preview Box */}
              <div className="relative w-full aspect-[751/277] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group shadow-inner">
                {config.bloom.mediaType === "video" && config.bloom.videoUrl ? (
                  <video
                    src={config.bloom.videoUrl}
                    autoPlay={config.bloom.autoPlay ?? true}
                    loop={config.bloom.loop ?? true}
                    muted={config.bloom.muted ?? true}
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={config.bloom.image || "assets/image/bloom_fruit_banner.png"}
                    alt=""
                    className="w-full h-full object-cover group-hover:opacity-40 transition"
                  />
                )}

                <div
                  onClick={() => bloomBannerFileRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer backdrop-blur-[2px]"
                >
                  <Upload className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold mt-1.5">
                    {config.bloom.mediaType === "video"
                      ? "Upload Promotional Video (MP4 / WebM)"
                      : "Upload New Banner Image (JPG, PNG, WebP)"}
                  </span>
                  <span className="text-[10px] text-slate-300 mt-0.5">
                    Supports up to 50MB
                  </span>
                </div>

                {uploadingTarget === "bloom" && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-emerald-400 font-semibold">
                      Uploading Media...
                    </span>
                  </div>
                )}
              </div>

              {/* Hidden File Input supporting Images and Videos */}
              <input
                ref={bloomBannerFileRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const isVideo =
                      file.type.startsWith("video/") ||
                      file.name.endsWith(".mp4") ||
                      file.name.endsWith(".webm") ||
                      file.name.endsWith(".mov");

                    handleFileUpload(file, "bloom", (url) => {
                      if (isVideo) {
                        setConfig((prev) => ({
                          ...prev,
                          bloom: {
                            ...prev.bloom,
                            mediaType: "video",
                            videoUrl: url,
                            image: url,
                          },
                        }));
                      } else {
                        setConfig((prev) => ({
                          ...prev,
                          bloom: {
                            ...prev.bloom,
                            mediaType: "image",
                            image: url,
                          },
                        }));
                      }
                    });
                  }
                }}
              />

              {/* Upload Action Buttons & URLs */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => bloomBannerFileRef.current?.click()}
                  disabled={uploadingTarget === "bloom"}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Image / Video
                </button>

                {config.bloom.mediaType === "video" && (
                  <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.bloom.autoPlay ?? true}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            bloom: { ...prev.bloom, autoPlay: e.target.checked },
                          }))
                        }
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 w-3.5 h-3.5"
                      />
                      AutoPlay
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.bloom.loop ?? true}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            bloom: { ...prev.bloom, loop: e.target.checked },
                          }))
                        }
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 w-3.5 h-3.5"
                      />
                      Loop
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.bloom.muted ?? true}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            bloom: { ...prev.bloom, muted: e.target.checked },
                          }))
                        }
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 w-3.5 h-3.5"
                      />
                      Muted
                    </label>
                  </div>
                )}
              </div>

              {/* Direct Media URLs Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={config.bloom.image || ""}
                    placeholder="assets/image/bloom_fruit_banner.png or /BuggyDm/uploads/..."
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        bloom: { ...prev.bloom, image: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Video URL (MP4 / WebM / Stream)
                  </label>
                  <input
                    type="text"
                    value={config.bloom.videoUrl || ""}
                    placeholder="https://... or /BuggyDm/uploads/video.mp4"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        bloom: { ...prev.bloom, videoUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Title & Route Keyword */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    value={config.bloom.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bloom: { ...config.bloom, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Search Keyword / Route Target
                  </label>
                  <input
                    type="text"
                    value={config.bloom.searchKeyword}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bloom: { ...config.bloom, searchKeyword: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
