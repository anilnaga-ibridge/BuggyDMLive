"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Crown,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  UploadCloud,
  Upload,
  Check,
  Package,
  Layers,
  Tag,
  Percent,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
  ChevronDown,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  HomeFeaturedOffersConfig,
  FeaturedCategoryCard,
  TodaysOfferCard,
  CouponCard,
  DEFAULT_FEATURED_OFFERS_CONFIG,
} from "@/types/featured-offers";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function FeaturedOffersManagerPage() {
  const [config, setConfig] = useState<HomeFeaturedOffersConfig>(
    DEFAULT_FEATURED_OFFERS_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"featured" | "offers" | "coupons">(
    "featured"
  );

  // Uploading state
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Catalog Browser State
  const [activePickerTarget, setActivePickerTarget] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Input Refs
  const featCardFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const offerCardFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/featured-offers");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/featured-offers");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Featured & Offers config:", err);
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

  const openProductPicker = (targetKey: string) => {
    if (activePickerTarget === targetKey) {
      setActivePickerTarget(null);
    } else {
      setActivePickerTarget(targetKey);
      setSearchQuery("");
      void fetchCatalogProducts("");
    }
  };

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
      let res = await fetch("/BuggyDm/api/grocery/featured-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/featured-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Featured, Offers & Coupons configuration saved and live in User App!",
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
    if (confirm("Reset to default configuration?")) {
      setConfig({ ...DEFAULT_FEATURED_OFFERS_CONFIG });
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

  // Featured Category Card helpers
  const updateFeatCard = (
    idx: number,
    field: keyof FeaturedCategoryCard,
    value: string
  ) => {
    setConfig((prev) => {
      const copy = [...prev.featured.cards];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, featured: { ...prev.featured, cards: copy } };
    });
  };

  // Today's Offers helpers
  const updateOfferCard = (
    idx: number,
    field: keyof TodaysOfferCard,
    value: string
  ) => {
    setConfig((prev) => {
      const copy = [...prev.todaysOffers.offers];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, todaysOffers: { ...prev.todaysOffers, offers: copy } };
    });
  };

  const addOfferCard = () => {
    setConfig((prev) => ({
      ...prev,
      todaysOffers: {
        ...prev.todaysOffers,
        offers: [
          ...prev.todaysOffers.offers,
          {
            id: `offer_${Date.now()}`,
            title: "Special Deal",
            subtitle: "On Selected Items",
            image: "assets/image/offer_fruits_veg.png",
            searchKeyword: "Special Deal",
          },
        ],
      },
    }));
  };

  const removeOfferCard = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      todaysOffers: {
        ...prev.todaysOffers,
        offers: prev.todaysOffers.offers.filter((_, i) => i !== idx),
      },
    }));
  };

  // Coupons helpers
  const updateCouponCard = (
    idx: number,
    field: keyof CouponCard,
    value: string
  ) => {
    setConfig((prev) => {
      const copy = [...prev.coupons.coupons];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, coupons: { ...prev.coupons, coupons: copy } };
    });
  };

  const addCouponCard = () => {
    setConfig((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        coupons: [
          ...prev.coupons.coupons,
          {
            id: `coupon_${Date.now()}`,
            discountText: "FLAT\n₹50",
            offText: "OFF",
            codeText: "USE CODE: NEW50",
            bgColor: "#D1FAE5",
            borderColor: "#A7F3D0",
          },
        ],
      },
    }));
  };

  const removeCouponCard = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        coupons: prev.coupons.coupons.filter((_, i) => i !== idx),
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19] text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mr-3" />
        Loading Featured & Offers Configuration...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080b11] text-slate-200">
      {/* Header */}
      <div className="h-16 px-6 bg-[#0b0f19]/90 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Featured & Offers Manager
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live In App
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage Featured Category Arches (10 cards), Today's Offers & Coupons
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
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
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
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Live Mobile User App Preview
            </span>
            <span className="text-[11px] text-slate-500">Exact Pixel Match</span>
          </div>

          {/* Simulator Phone Frame */}
          <div className="bg-white rounded-3xl p-4 border-4 border-slate-800 shadow-2xl sticky top-24 text-slate-900 space-y-5">
            {/* Section 1: Featured Arches */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-100 text-amber-600 text-sm">
                    👑
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-none">
                      {config.featured.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {config.featured.subtitle}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  {config.featured.topCategoriesText} →
                </div>
              </div>

              {/* 10 Arches: 2 rows of 5 cards */}
              <div className="mt-3 overflow-x-auto pb-1 no-scrollbar space-y-2">
                {/* Row 1 (cards 0..4) */}
                <div className="flex gap-2 min-w-max">
                  {config.featured.cards.slice(0, 5).map((card, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-center p-0.5"
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>

                {/* Row 2 (cards 5..9) */}
                <div className="flex gap-2 min-w-max">
                  {config.featured.cards.slice(5, 10).map((card, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-center p-0.5"
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Today's Offers */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 leading-none">
                  {config.todaysOffers.title}
                </h3>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-0.5">
                  {config.todaysOffers.viewAllText} →
                </div>
              </div>

              {/* Horizontal Banners */}
              <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {config.todaysOffers.offers.map((offer, idx) => (
                  <div
                    key={idx}
                    className="shrink-0 w-48 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative"
                  >
                    <img
                      src={offer.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Coupons & Offers */}
            <div>
              <h3 className="text-base font-black text-slate-900 leading-none">
                {config.coupons.title}
              </h3>

              {/* Horizontal Coupon Strips */}
              <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {config.coupons.coupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: coupon.bgColor || "#D1FAE5",
                      borderColor: coupon.borderColor || "#A7F3D0",
                    }}
                    className="shrink-0 w-36 p-2 rounded-xl border flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      %
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-900 leading-tight">
                        {coupon.discountText.replace("\n", " ")}
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium truncate">
                        {coupon.codeText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section Selector Tabs */}
          <div className="flex gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("featured")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "featured"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              1. Featured (10 Arches)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("offers")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "offers"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              2. Today's Offers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("coupons")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "coupons"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              3. Coupons & Offers
            </button>
          </div>

          {/* TAB 1: Featured Arches */}
          {activeTab === "featured" && (
            <div className="space-y-4">
              {/* Header Settings */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Featured Arches Header
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={config.featured.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          featured: {
                            ...config.featured,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.featured.subtitle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          featured: {
                            ...config.featured,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Pill Button Text
                    </label>
                    <input
                      type="text"
                      value={config.featured.topCategoriesText}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          featured: {
                            ...config.featured,
                            topCategoriesText: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 10 Category Cards Grid */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    10 Featured Category Arches (Squircle Cards)
                  </span>
                  <span className="text-xs text-slate-400">
                    Row 1: 5 Cards • Row 2: 5 Cards
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.featured.cards.map((card, idx) => {
                    const targetKey = `feat-${idx}`;
                    const isUploadingThis = uploadingTarget === targetKey;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3 relative"
                      >
                        {/* Image Preview & Upload Trigger */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            onClick={() =>
                              featCardFileRefs.current[idx]?.click()
                            }
                            className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-500 overflow-hidden relative cursor-pointer flex items-center justify-center group transition"
                            title="Upload Category Image"
                          >
                            <img
                              src={card.image}
                              alt={card.name}
                              className="w-full h-full object-contain group-hover:opacity-40 transition"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                              <Upload className="w-3.5 h-3.5" />
                            </div>
                            {isUploadingThis && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>

                          {/* Hidden File Input */}
                          <input
                            ref={(el) => {
                              featCardFileRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, targetKey, (url) => {
                                  updateFeatCard(idx, "image", url);
                                });
                              }
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              featCardFileRefs.current[idx]?.click()
                            }
                            disabled={isUploadingThis}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9.5px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                          >
                            <UploadCloud className="w-2.5 h-2.5 text-amber-400" />
                            Upload
                          </button>
                        </div>

                        {/* Title & Search Keyword */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400">
                              #{idx + 1}{" "}
                              {idx < 5 ? "(Row 1)" : "(Row 2)"}
                            </span>
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-400 block">
                              Category Name
                            </label>
                            <input
                              type="text"
                              value={card.name}
                              onChange={(e) =>
                                updateFeatCard(idx, "name", e.target.value)
                              }
                              placeholder="e.g. Grocery"
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-400 block">
                              Search Target / Keyword
                            </label>
                            <input
                              type="text"
                              value={card.searchKeyword}
                              onChange={(e) =>
                                updateFeatCard(
                                  idx,
                                  "searchKeyword",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Grocery"
                              className="w-full px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Today's Offers */}
          {activeTab === "offers" && (
            <div className="space-y-4">
              {/* Header Settings */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Today's Offers Header
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={config.todaysOffers.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          todaysOffers: {
                            ...config.todaysOffers,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      View All Text
                    </label>
                    <input
                      type="text"
                      value={config.todaysOffers.viewAllText}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          todaysOffers: {
                            ...config.todaysOffers,
                            viewAllText: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Offer Cards List */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Offer Banners
                  </h3>
                  <button
                    type="button"
                    onClick={addOfferCard}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Offer Banner
                  </button>
                </div>

                <div className="space-y-3">
                  {config.todaysOffers.offers.map((offer, idx) => {
                    const targetKey = `offer-${idx}`;
                    const isUploadingThis = uploadingTarget === targetKey;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4 relative"
                      >
                        {/* Banner Image Preview & Upload */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            onClick={() =>
                              offerCardFileRefs.current[idx]?.click()
                            }
                            className="w-28 h-16 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500 overflow-hidden relative cursor-pointer flex items-center justify-center group transition"
                            title="Upload Offer Banner"
                          >
                            <img
                              src={offer.image}
                              alt=""
                              className="w-full h-full object-cover group-hover:opacity-40 transition"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white">
                              <Upload className="w-4 h-4" />
                            </div>
                            {isUploadingThis && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>

                          <input
                            ref={(el) => {
                              offerCardFileRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, targetKey, (url) => {
                                  updateOfferCard(idx, "image", url);
                                });
                              }
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              offerCardFileRefs.current[idx]?.click()
                            }
                            disabled={isUploadingThis}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium flex items-center gap-1 cursor-pointer border border-slate-700"
                          >
                            <UploadCloud className="w-3 h-3 text-emerald-400" />
                            Upload
                          </button>
                        </div>

                        {/* Title, Subtitle & Keyword */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Headline / Offer Tag
                            </label>
                            <input
                              type="text"
                              value={offer.title}
                              onChange={(e) =>
                                updateOfferCard(idx, "title", e.target.value)
                              }
                              placeholder="e.g. Up to 50% OFF"
                              className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Subtitle Text
                            </label>
                            <input
                              type="text"
                              value={offer.subtitle}
                              onChange={(e) =>
                                updateOfferCard(idx, "subtitle", e.target.value)
                              }
                              placeholder="e.g. Fresh Fruits & Vegetables"
                              className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Search Target
                            </label>
                            <input
                              type="text"
                              value={offer.searchKeyword}
                              onChange={(e) =>
                                updateOfferCard(
                                  idx,
                                  "searchKeyword",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Fruits Vegetables"
                              className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        {config.todaysOffers.offers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOfferCard(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remove Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Coupons & Offers */}
          {activeTab === "coupons" && (
            <div className="space-y-4">
              {/* Header Settings */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Percent className="w-4 h-4 text-sky-400" />
                  Coupons & Offers Header
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={config.coupons.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        coupons: {
                          ...config.coupons,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Coupons List */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-sky-400" />
                    Promo Coupon Cards
                  </h3>
                  <button
                    type="button"
                    onClick={addCouponCard}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Coupon
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.coupons.coupons.map((coupon, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">
                          Coupon #{idx + 1}
                        </span>
                        {config.coupons.coupons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCouponCard(idx)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                            title="Remove Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Discount Text
                          </label>
                          <input
                            type="text"
                            value={coupon.discountText}
                            onChange={(e) =>
                              updateCouponCard(
                                idx,
                                "discountText",
                                e.target.value
                              )
                            }
                            placeholder="e.g. FLAT\n₹50"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Badge Text
                          </label>
                          <input
                            type="text"
                            value={coupon.offText}
                            onChange={(e) =>
                              updateCouponCard(idx, "offText", e.target.value)
                            }
                            placeholder="e.g. OFF"
                            className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-400 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Promo Code Text
                        </label>
                        <input
                          type="text"
                          value={coupon.codeText}
                          onChange={(e) =>
                            updateCouponCard(idx, "codeText", e.target.value)
                          }
                          placeholder="e.g. USE CODE: BUGGY50"
                          className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Bg Color
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={coupon.bgColor || "#D1FAE5"}
                              onChange={(e) =>
                                updateCouponCard(idx, "bgColor", e.target.value)
                              }
                              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={coupon.bgColor || "#D1FAE5"}
                              onChange={(e) =>
                                updateCouponCard(idx, "bgColor", e.target.value)
                              }
                              className="w-full px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Border Color
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={coupon.borderColor || "#A7F3D0"}
                              onChange={(e) =>
                                updateCouponCard(
                                  idx,
                                  "borderColor",
                                  e.target.value
                                )
                              }
                              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={coupon.borderColor || "#A7F3D0"}
                              onChange={(e) =>
                                updateCouponCard(
                                  idx,
                                  "borderColor",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
