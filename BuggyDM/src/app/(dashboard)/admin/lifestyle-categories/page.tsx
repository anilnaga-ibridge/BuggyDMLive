"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Upload,
  Search,
  ChevronDown,
  X,
  Heart,
  Home,
  Palette,
  Package,
  Shirt,
  Smartphone,
  Layers,
} from "lucide-react";
import {
  LifestyleCategoriesConfig,
  FashionLifestyleCard,
  BeautyPersonalCareCard,
  HouseholdEssentialsCard,
  HobbiesInterestsCard,
  DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
} from "@/types/lifestyle-categories";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function LifestyleCategoriesManagerPage() {
  const [config, setConfig] = useState<LifestyleCategoriesConfig>(
    DEFAULT_LIFESTYLE_CATEGORIES_CONFIG
  );
  const [activeTab, setActiveTab] = useState<
    "fashion" | "beauty" | "household" | "hobbies" | "all_preview"
  >("fashion");
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Target for Catalog Search
  const [activePickerTarget, setActivePickerTarget] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // Generic File Input Ref Dictionary
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/lifestyle-categories");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/lifestyle-categories");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig({
              ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
              ...json.data,
              fashionLifestyle: {
                ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.fashionLifestyle,
                ...(json.data.fashionLifestyle || {}),
                enabled:
                  json.data.fashionLifestyle?.enabled !== undefined
                    ? Boolean(json.data.fashionLifestyle.enabled)
                    : true,
              },
              beautyPersonalCare: {
                ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.beautyPersonalCare,
                ...(json.data.beautyPersonalCare || {}),
                enabled:
                  json.data.beautyPersonalCare?.enabled !== undefined
                    ? Boolean(json.data.beautyPersonalCare.enabled)
                    : true,
              },
              householdEssentials: {
                ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.householdEssentials,
                ...(json.data.householdEssentials || {}),
                enabled:
                  json.data.householdEssentials?.enabled !== undefined
                    ? Boolean(json.data.householdEssentials.enabled)
                    : true,
              },
              hobbiesInterests: {
                ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.hobbiesInterests,
                ...(json.data.hobbiesInterests || {}),
                enabled:
                  json.data.hobbiesInterests?.enabled !== undefined
                    ? Boolean(json.data.hobbiesInterests.enabled)
                    : true,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Lifestyle Categories config:", err);
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

  const updateCardProperties = (
    targetKey: string,
    updates: { title?: string; image?: string; searchKeyword?: string }
  ) => {
    const parts = targetKey.split("-");
    const section = parts[0];
    const sub = parts[1];
    const index = parseInt(parts[2] || parts[1], 10);

    setConfig((prev) => {
      if (section === "fashion") {
        const cards = [...prev.fashionLifestyle.cards];
        if (cards[index]) {
          cards[index] = { ...cards[index], ...updates };
          return {
            ...prev,
            fashionLifestyle: { ...prev.fashionLifestyle, cards },
          };
        }
      } else if (section === "beauty") {
        if (sub === "r1") {
          const row1Cards = [...prev.beautyPersonalCare.row1Cards];
          if (row1Cards[index]) {
            row1Cards[index] = { ...row1Cards[index], ...updates };
            return {
              ...prev,
              beautyPersonalCare: { ...prev.beautyPersonalCare, row1Cards },
            };
          }
        } else if (sub === "r2") {
          const row2Cards = [...prev.beautyPersonalCare.row2Cards];
          if (row2Cards[index]) {
            row2Cards[index] = { ...row2Cards[index], ...updates };
            return {
              ...prev,
              beautyPersonalCare: { ...prev.beautyPersonalCare, row2Cards },
            };
          }
        } else if (sub === "r3") {
          const row3Cards = [...prev.beautyPersonalCare.row3Cards];
          if (row3Cards[index]) {
            row3Cards[index] = { ...row3Cards[index], ...updates };
            return {
              ...prev,
              beautyPersonalCare: { ...prev.beautyPersonalCare, row3Cards },
            };
          }
        }
      } else if (section === "household") {
        if (sub === "r1") {
          const row1Cards = [...prev.householdEssentials.row1Cards];
          if (row1Cards[index]) {
            row1Cards[index] = { ...row1Cards[index], ...updates };
            return {
              ...prev,
              householdEssentials: { ...prev.householdEssentials, row1Cards },
            };
          }
        } else if (sub === "r2") {
          const row2Cards = [...prev.householdEssentials.row2Cards];
          if (row2Cards[index]) {
            row2Cards[index] = { ...row2Cards[index], ...updates };
            return {
              ...prev,
              householdEssentials: { ...prev.householdEssentials, row2Cards },
            };
          }
        }
      } else if (section === "hobbies") {
        const cards = [...prev.hobbiesInterests.cards];
        if (cards[index]) {
          cards[index] = { ...cards[index], ...updates };
          return {
            ...prev,
            hobbiesInterests: { ...prev.hobbiesInterests, cards },
          };
        }
      }
      return prev;
    });
  };

  const updateCardField = (
    targetKey: string,
    field: "title" | "image" | "searchKeyword",
    value: string
  ) => {
    updateCardProperties(targetKey, { [field]: value });
  };

  const selectCatalogProduct = (
    targetKey: string,
    prod: SearchProduct
  ) => {
    updateCardProperties(targetKey, {
      title: prod.name,
      ...(prod.image ? { image: prod.image } : {}),
      searchKeyword: prod.name,
    });
    setActivePickerTarget(null);
  };

  const handleFileUpload = async (
    targetKey: string,
    file: File
  ) => {
    setUploadingTarget(targetKey);
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
        const uploadedUrl = json.url;
        updateCardProperties(targetKey, { image: uploadedUrl });
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/lifestyle-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/lifestyle-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Lifestyle & Specialty Categories configuration saved successfully! Changes are live in the app.",
        });
      } else {
        const json = await res.json();
        throw new Error(json.error || "Failed to save configuration");
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
      confirm(
        "Are you sure you want to reset all 4 lifestyle sections to defaults?"
      )
    ) {
      setConfig(DEFAULT_LIFESTYLE_CATEGORIES_CONFIG);
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

  // Reusable Card Editor with Catalog Search & Upload
  const renderCardEditor = (
    targetKey: string,
    card: { id?: string; title: string; image: string; searchKeyword: string },
    label: string,
    onDelete?: () => void
  ) => {
    const isUploadingThis = uploadingTarget === targetKey;

    return (
      <div
        key={targetKey}
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm space-y-3 relative group"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase text-slate-500">
            {label}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-slate-400 hover:text-rose-600 transition"
              title="Remove Card"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 1. Browse Catalog Products Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Browse Existing Catalog Products
          </label>
          <button
            type="button"
            onClick={() => openProductPicker(targetKey)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-sm hover:border-rose-400 transition"
          >
            <span className="truncate">
              {activePickerTarget === targetKey
                ? "Searching catalog products..."
                : "Type to search catalog (e.g. Shampoo, Shirt, Book)..."}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {activePickerTarget === targetKey && (
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
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none"
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
                      onClick={() => selectCatalogProduct(targetKey, prod)}
                      className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-rose-50 cursor-pointer"
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

        {/* 2. Title Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Title / Category Name
          </label>
          <input
            type="text"
            value={card.title}
            onChange={(e) =>
              updateCardField(targetKey, "title", e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none font-medium"
            placeholder="Category Title"
          />
        </div>

        {/* 3. Search Keyword Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Search Keyword / Query
          </label>
          <input
            type="text"
            value={card.searchKeyword}
            onChange={(e) =>
              updateCardField(targetKey, "searchKeyword", e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none"
            placeholder="Search query text"
          />
        </div>

        {/* 4. Image URL & Upload Button */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Card Image (Upload or URL)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={card.image}
              onChange={(e) =>
                updateCardField(targetKey, "image", e.target.value)
              }
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none"
              placeholder="Image path or URL"
            />
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                fileInputRefs.current[targetKey] = el;
              }}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  void handleFileUpload(targetKey, e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRefs.current[targetKey]?.click()}
              disabled={isUploadingThis}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              {isUploadingThis ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5 text-rose-500" />
              )}
              {isUploadingThis ? "Uploading..." : "Upload"}
            </button>
          </div>

          {/* Thumbnail preview */}
          {card.image && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5">
                <PreviewImg src={card.image} alt={card.title} />
              </div>
              <span className="text-[11px] text-slate-500 truncate flex-1">
                {card.image}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Loading Lifestyle & Specialty Categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Lifestyle & Specialty Categories
              </h1>
              <p className="text-sm text-slate-500">
                Manage Fashion & Style, Beauty & Personal Care, Household Essentials, and Hobbies & Interests
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              showLivePreview
                ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            {showLivePreview ? "Hide Live Preview" : "Show Live Preview"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-500 hover:to-amber-500 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("fashion")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "fashion"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Shirt className="h-4 w-4" />
            Fashion & Lifestyle
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {config.fashionLifestyle.cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("beauty")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "beauty"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Heart className="h-4 w-4" />
            Beauty & Personal Care
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {config.beautyPersonalCare.row1Cards.length +
                config.beautyPersonalCare.row2Cards.length +
                config.beautyPersonalCare.row3Cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("household")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "household"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Home className="h-4 w-4" />
            Household Essentials
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {config.householdEssentials.row1Cards.length +
                config.householdEssentials.row2Cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hobbies")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "hobbies"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Palette className="h-4 w-4" />
            Hobbies & Interests
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {config.hobbiesInterests.cards.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("all_preview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "all_preview"
              ? "bg-slate-900 text-white shadow-md"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Full App Feed Overview
        </button>
      </div>

      {/* Main Content Grid: Editor + Live Preview */}
      <div
        className={`grid gap-8 ${
          showLivePreview ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {/* LEFT COLUMN: EDITORS */}
        <div className={showLivePreview ? "lg:col-span-7 space-y-6" : "space-y-6"}>
          {/* ========================================================================= */}
          {/* 1. TAB: FASHION & LIFESTYLE */}
          {/* ========================================================================= */}
          {activeTab === "fashion" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-700">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Fashion & Lifestyle Section
                    </h2>
                    <p className="text-xs text-slate-500">
                      2 Side-by-Side Large Rounded Cards (Apparel, Jewellery, etc.)
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">
                    {config.fashionLifestyle.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.fashionLifestyle.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        fashionLifestyle: {
                          ...config.fashionLifestyle,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={config.fashionLifestyle.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      fashionLifestyle: {
                        ...config.fashionLifestyle,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none font-bold"
                  placeholder="Fashion & Lifestyle"
                />
              </div>

              {/* Cards List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Fashion Cards ({config.fashionLifestyle.cards.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newCard: FashionLifestyleCard = {
                        id: `fl_${Date.now()}`,
                        title: "New Category",
                        image: "assets/image/crop_apparel.png",
                        searchKeyword: "Fashion",
                      };
                      setConfig({
                        ...config,
                        fashionLifestyle: {
                          ...config.fashionLifestyle,
                          cards: [...config.fashionLifestyle.cards, newCard],
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Card
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.fashionLifestyle.cards.map((card, idx) =>
                    renderCardEditor(
                      `fashion-${idx}`,
                      card,
                      `Fashion Card #${idx + 1}`,
                      config.fashionLifestyle.cards.length > 1
                        ? () => {
                            const updated = config.fashionLifestyle.cards.filter(
                              (_, i) => i !== idx
                            );
                            setConfig({
                              ...config,
                              fashionLifestyle: {
                                ...config.fashionLifestyle,
                                cards: updated,
                              },
                            });
                          }
                        : undefined
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TAB: BEAUTY & PERSONAL CARE */}
          {/* ========================================================================= */}
          {activeTab === "beauty" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Beauty & Personal Care Section
                    </h2>
                    <p className="text-xs text-slate-500">
                      Row 1: Studio (Wide 2x) + Skincare + Makeup | Row 2: 4 Cards | Row 3: 4 Cards
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">
                    {config.beautyPersonalCare.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.beautyPersonalCare.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beautyPersonalCare: {
                          ...config.beautyPersonalCare,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={config.beautyPersonalCare.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      beautyPersonalCare: {
                        ...config.beautyPersonalCare,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none font-bold"
                  placeholder="Beauty & Personal Care"
                />
              </div>

              {/* Row 1 Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Row 1 Cards (Studio 2x Wide + Skincare + Makeup)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {config.beautyPersonalCare.row1Cards.map((card, idx) =>
                    renderCardEditor(
                      `beauty-r1-${idx}`,
                      card,
                      idx === 0 ? "Wide 2x Card (Studio)" : `Row 1 Card #${idx + 1}`
                    )
                  )}
                </div>
              </div>

              {/* Row 2 Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Row 2 Cards (Fragrance, Bath & Body, Haircare, Baby Care)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {config.beautyPersonalCare.row2Cards.map((card, idx) =>
                    renderCardEditor(
                      `beauty-r2-${idx}`,
                      card,
                      `Row 2 Card #${idx + 1}`
                    )
                  )}
                </div>
              </div>

              {/* Row 3 Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Row 3 Cards (Protein, Pharmacy, Feminine Hygiene, Sexual Wellness)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {config.beautyPersonalCare.row3Cards.map((card, idx) =>
                    renderCardEditor(
                      `beauty-r3-${idx}`,
                      card,
                      `Row 3 Card #${idx + 1}`
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. TAB: HOUSEHOLD ESSENTIALS */}
          {/* ========================================================================= */}
          {activeTab === "household" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Household Essentials Section
                    </h2>
                    <p className="text-xs text-slate-500">
                      Row 1: 2 Wide Cards (Home Needs, Kitchenware) | Row 2: 4 Cards
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">
                    {config.householdEssentials.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.householdEssentials.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        householdEssentials: {
                          ...config.householdEssentials,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={config.householdEssentials.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      householdEssentials: {
                        ...config.householdEssentials,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none font-bold"
                  placeholder="Household Essentials"
                />
              </div>

              {/* Row 1 Wide Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Row 1: Wide Cards (Home Needs & Kitchenware)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.householdEssentials.row1Cards.map((card, idx) =>
                    renderCardEditor(
                      `household-r1-${idx}`,
                      card,
                      `Wide Card #${idx + 1}`
                    )
                  )}
                </div>
              </div>

              {/* Row 2 Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Row 2 Cards (Cleaning, Electronics, Pet Care, Paan Corner)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {config.householdEssentials.row2Cards.map((card, idx) =>
                    renderCardEditor(
                      `household-r2-${idx}`,
                      card,
                      `Row 2 Card #${idx + 1}`
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. TAB: HOBBIES & INTERESTS */}
          {/* ========================================================================= */}
          {activeTab === "hobbies" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Hobbies & Interests Section
                    </h2>
                    <p className="text-xs text-slate-500">
                      4 Category Cards (Toys & Games, Stationery, Sports, Books)
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">
                    {config.hobbiesInterests.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.hobbiesInterests.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hobbiesInterests: {
                          ...config.hobbiesInterests,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={config.hobbiesInterests.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hobbiesInterests: {
                        ...config.hobbiesInterests,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none font-bold"
                  placeholder="Hobbies & Interests"
                />
              </div>

              {/* Hobbies Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Hobbies Cards ({config.hobbiesInterests.cards.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newCard: HobbiesInterestsCard = {
                        id: `hi_${Date.now()}`,
                        title: "New Category",
                        image: "assets/image/crop_toys_games.png",
                        searchKeyword: "Hobbies",
                      };
                      setConfig({
                        ...config,
                        hobbiesInterests: {
                          ...config.hobbiesInterests,
                          cards: [...config.hobbiesInterests.cards, newCard],
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Card
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {config.hobbiesInterests.cards.map((card, idx) =>
                    renderCardEditor(
                      `hobbies-${idx}`,
                      card,
                      `Hobbies Card #${idx + 1}`,
                      config.hobbiesInterests.cards.length > 1
                        ? () => {
                            const updated = config.hobbiesInterests.cards.filter(
                              (_, i) => i !== idx
                            );
                            setConfig({
                              ...config,
                              hobbiesInterests: {
                                ...config.hobbiesInterests,
                                cards: updated,
                              },
                            });
                          }
                        : undefined
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. TAB: ALL PREVIEW MODE OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === "all_preview" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Full Feed Lifestyle & Specialty Sections
              </h2>
              <p className="text-xs text-slate-500">
                This preview reflects the real-time layout in the Flutter mobile/web app as you update items across all 4 lifestyle categories.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl bg-pink-50 border border-pink-100 p-3 text-center">
                  <span className="text-xs font-bold text-pink-700">Fashion & Style</span>
                  <p className="text-[11px] text-pink-600 mt-0.5">
                    {config.fashionLifestyle.enabled ? "Active" : "Disabled"} • {config.fashionLifestyle.cards.length} cards
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                  <span className="text-xs font-bold text-rose-700">Beauty & Care</span>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    {config.beautyPersonalCare.enabled ? "Active" : "Disabled"} • 11 cards
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                  <span className="text-xs font-bold text-amber-700">Household</span>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    {config.householdEssentials.enabled ? "Active" : "Disabled"} • 6 cards
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-center">
                  <span className="text-xs font-bold text-purple-700">Hobbies</span>
                  <p className="text-[11px] text-purple-600 mt-0.5">
                    {config.hobbiesInterests.enabled ? "Active" : "Disabled"} • {config.hobbiesInterests.cards.length} cards
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE PHONE DEVICE MOCKUP PREVIEW */}
        {showLivePreview && (
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-slate-900 p-4 shadow-2xl space-y-3 text-white">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">
                    Live App Preview
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Grocery Feed
                </span>
              </div>

              {/* Device Frame */}
              <div className="rounded-[32px] border-4 border-slate-700 bg-white text-slate-900 p-3.5 shadow-inner max-h-[640px] overflow-y-auto space-y-5">
                {/* 1. Fashion & Lifestyle Section */}
                {config.fashionLifestyle.enabled && (
                  <div className="space-y-2.5">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">
                      {config.fashionLifestyle.title}
                    </h4>
                    <div className="flex gap-2.5">
                      {config.fashionLifestyle.cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="flex-1 rounded-2xl bg-[#F8FAFC] border border-slate-100 p-2 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-20 w-full rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1.5 text-[11px] font-bold text-slate-800 text-center truncate w-full">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Beauty & Personal Care Section */}
                {config.beautyPersonalCare.enabled && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">
                      {config.beautyPersonalCare.title}
                    </h4>

                    {/* Row 1: Studio 2x Wide + Skincare + Makeup */}
                    <div className="flex gap-2">
                      {config.beautyPersonalCare.row1Cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className={`${
                            idx === 0 ? "flex-[2]" : "flex-[1]"
                          } rounded-xl bg-[#F8FAFC] border border-slate-100 p-1.5 flex flex-col items-center shadow-sm`}
                        >
                          <div className="h-14 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[9.5px] font-semibold text-slate-800 text-center line-clamp-2 leading-tight">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Row 2: 4 Small Cards */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {config.beautyPersonalCare.row2Cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="rounded-xl bg-[#F8FAFC] border border-slate-100 p-1.5 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-12 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-semibold text-slate-800 text-center truncate w-full">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Row 3: 4 Small Cards */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {config.beautyPersonalCare.row3Cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="rounded-xl bg-[#F8FAFC] border border-slate-100 p-1.5 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-12 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-semibold text-slate-800 text-center truncate w-full">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Household Essentials Section */}
                {config.householdEssentials.enabled && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">
                      {config.householdEssentials.title}
                    </h4>

                    {/* Row 1: 2 Wide Cards */}
                    <div className="flex gap-2">
                      {config.householdEssentials.row1Cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="flex-1 rounded-xl bg-[#F8FAFC] border border-slate-100 p-2 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-16 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800 text-center line-clamp-1">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Row 2: 4 Small Cards */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {config.householdEssentials.row2Cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="rounded-xl bg-[#F8FAFC] border border-slate-100 p-1.5 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-12 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-semibold text-slate-800 text-center truncate w-full">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Hobbies & Interests Section */}
                {config.hobbiesInterests.enabled && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">
                      {config.hobbiesInterests.title}
                    </h4>
                    <div className="grid grid-cols-4 gap-1.5">
                      {config.hobbiesInterests.cards.map((card, idx) => (
                        <div
                          key={card.id || idx}
                          className="rounded-xl bg-[#F8FAFC] border border-slate-100 p-1.5 flex flex-col items-center shadow-sm"
                        >
                          <div className="h-12 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5">
                            <PreviewImg
                              src={card.image}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="mt-1 text-[9px] font-semibold text-slate-800 text-center truncate w-full">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
