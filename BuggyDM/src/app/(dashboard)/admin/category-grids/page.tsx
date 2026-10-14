"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  UploadCloud,
  Upload,
  Sparkles,
  Search,
  ChevronDown,
  X,
  Tag,
  Image as ImageIcon,
  Utensils,
  Coffee,
  ArrowUp,
  ArrowRight,
  Package,
} from "lucide-react";
import {
  CategoryGridsConfig,
  CategoryCardItem,
  ShowcaseBannerItem,
  DEFAULT_CATEGORY_GRIDS_CONFIG,
} from "@/types/category-grids";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function CategoryGridsManagerPage() {
  const [config, setConfig] = useState<CategoryGridsConfig>(
    DEFAULT_CATEGORY_GRIDS_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Target for Catalog Search or Upload
  // target format: "gk-hero", "gk-r1-0", "gk-r2-0", "sd-banner-0", "sd-card-0"
  const [activePickerTarget, setActivePickerTarget] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Input Refs
  const gkHeroFileRef = useRef<HTMLInputElement>(null);
  const gkRow1FileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const gkRow2FileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sdBannerFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sdCardFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/category-grids");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/category-grids");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig({
              ...DEFAULT_CATEGORY_GRIDS_CONFIG,
              ...json.data,
              groceryKitchen: {
                ...DEFAULT_CATEGORY_GRIDS_CONFIG.groceryKitchen,
                ...(json.data.groceryKitchen || {}),
                enabled:
                  json.data.groceryKitchen?.enabled !== undefined
                    ? Boolean(json.data.groceryKitchen.enabled)
                    : true,
              },
              snacksDrinks: {
                ...DEFAULT_CATEGORY_GRIDS_CONFIG.snacksDrinks,
                ...(json.data.snacksDrinks || {}),
                enabled:
                  json.data.snacksDrinks?.enabled !== undefined
                    ? Boolean(json.data.snacksDrinks.enabled)
                    : true,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Category Grids config:", err);
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

  const selectCatalogItem = (product: SearchProduct) => {
    if (!activePickerTarget) return;

    if (activePickerTarget === "gk-hero") {
      setConfig((prev) => ({
        ...prev,
        groceryKitchen: {
          ...prev.groceryKitchen,
          heroBanner: {
            ...prev.groceryKitchen.heroBanner,
            image: product.image || prev.groceryKitchen.heroBanner.image,
            searchKeyword: product.name,
          },
        },
      }));
    } else if (activePickerTarget.startsWith("gk-r1-")) {
      const idx = parseInt(activePickerTarget.replace("gk-r1-", ""), 10);
      setConfig((prev) => {
        const row = [...prev.groceryKitchen.row1Cards];
        if (row[idx]) {
          row[idx] = {
            ...row[idx],
            title: product.name,
            searchKeyword: product.name,
            image: product.image || row[idx].image,
          };
        }
        return {
          ...prev,
          groceryKitchen: { ...prev.groceryKitchen, row1Cards: row },
        };
      });
    } else if (activePickerTarget.startsWith("gk-r2-")) {
      const idx = parseInt(activePickerTarget.replace("gk-r2-", ""), 10);
      setConfig((prev) => {
        const row = [...prev.groceryKitchen.row2Cards];
        if (row[idx]) {
          row[idx] = {
            ...row[idx],
            title: product.name,
            searchKeyword: product.name,
            image: product.image || row[idx].image,
          };
        }
        return {
          ...prev,
          groceryKitchen: { ...prev.groceryKitchen, row2Cards: row },
        };
      });
    } else if (activePickerTarget.startsWith("sd-banner-")) {
      const idx = parseInt(activePickerTarget.replace("sd-banner-", ""), 10);
      setConfig((prev) => {
        const banners = [...prev.snacksDrinks.banners];
        if (banners[idx]) {
          banners[idx] = {
            ...banners[idx],
            title: product.name,
            searchKeyword: product.name,
            image: product.image || banners[idx].image,
          };
        }
        return {
          ...prev,
          snacksDrinks: { ...prev.snacksDrinks, banners },
        };
      });
    } else if (activePickerTarget.startsWith("sd-card-")) {
      const idx = parseInt(activePickerTarget.replace("sd-card-", ""), 10);
      setConfig((prev) => {
        const bottomCards = [...prev.snacksDrinks.bottomCards];
        if (bottomCards[idx]) {
          bottomCards[idx] = {
            ...bottomCards[idx],
            title: product.name,
            searchKeyword: product.name,
            image: product.image || bottomCards[idx].image,
          };
        }
        return {
          ...prev,
          snacksDrinks: { ...prev.snacksDrinks, bottomCards },
        };
      });
    }

    setActivePickerTarget(null);
    setMessage({
      type: "success",
      text: `Selected "${product.name}" from catalog!`,
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/category-grids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/category-grids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Grocery & Kitchen & Snacks Grids saved and live in User App!",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to save configuration.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({
        type: "error",
        text: "An error occurred while saving.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleFileUpload = async (
    file: File,
    targetKey: string,
    onSuccess: (url: string) => void
  ) => {
    setUploadingTarget(targetKey);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "grocery");

    try {
      let res = await fetch("/BuggyDm/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onSuccess(data.url);
          setMessage({
            type: "success",
            text: "Image uploaded successfully!",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: "Image upload failed.",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({
        type: "error",
        text: "Error uploading image.",
      });
    } finally {
      setUploadingTarget(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Grocery Kitchen Row 1 & Row 2 helpers
  const updateGkRow1Card = (
    index: number,
    field: keyof CategoryCardItem,
    value: string
  ) => {
    setConfig((prev) => {
      const row = [...prev.groceryKitchen.row1Cards];
      row[index] = { ...row[index], [field]: value };
      return {
        ...prev,
        groceryKitchen: { ...prev.groceryKitchen, row1Cards: row },
      };
    });
  };

  const updateGkRow2Card = (
    index: number,
    field: keyof CategoryCardItem,
    value: string
  ) => {
    setConfig((prev) => {
      const row = [...prev.groceryKitchen.row2Cards];
      row[index] = { ...row[index], [field]: value };
      return {
        ...prev,
        groceryKitchen: { ...prev.groceryKitchen, row2Cards: row },
      };
    });
  };

  // Snacks & Drinks Showcase Banners & Shelf Cards helpers
  const updateSdBanner = (
    index: number,
    field: keyof ShowcaseBannerItem,
    value: string
  ) => {
    setConfig((prev) => {
      const banners = [...prev.snacksDrinks.banners];
      banners[index] = { ...banners[index], [field]: value };
      return {
        ...prev,
        snacksDrinks: { ...prev.snacksDrinks, banners },
      };
    });
  };

  const updateSdCard = (
    index: number,
    field: keyof CategoryCardItem,
    value: string
  ) => {
    setConfig((prev) => {
      const cards = [...prev.snacksDrinks.bottomCards];
      cards[index] = { ...cards[index], [field]: value };
      return {
        ...prev,
        snacksDrinks: { ...prev.snacksDrinks, bottomCards: cards },
      };
    });
  };

  const addSdCard = () => {
    setConfig((prev) => {
      const newCard: CategoryCardItem = {
        id: `sd_c_${Date.now()}`,
        title: "New Category",
        image: "assets/image/sdMunchies.png",
        searchKeyword: "Snacks",
      };
      return {
        ...prev,
        snacksDrinks: {
          ...prev.snacksDrinks,
          bottomCards: [...prev.snacksDrinks.bottomCards, newCard],
        },
      };
    });
  };

  const removeSdCard = (index: number) => {
    setConfig((prev) => {
      const cards = [...prev.snacksDrinks.bottomCards];
      cards.splice(index, 1);
      return {
        ...prev,
        snacksDrinks: { ...prev.snacksDrinks, bottomCards: cards },
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm gap-2">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading Category Grids Settings...
      </div>
    );
  }

  // Reusable inline combobox dropdown component
  const renderCatalogPicker = (targetKey: string) => {
    if (activePickerTarget !== targetKey) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 animate-in fade-in duration-150 z-30 my-2 w-full">
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
            className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            autoFocus
          />
          {searching && (
            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
          )}
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 pr-1">
          {searchResults.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-500">
              {searching
                ? "Searching catalog products..."
                : 'No products found.'}
            </div>
          ) : (
            searchResults.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => selectCatalogItem(prod)}
                className="w-full text-left px-2.5 py-2 hover:bg-slate-800/90 rounded-lg flex items-center justify-between text-xs transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {prod.image ? (
                    <img
                      src={resolveImgSrc(prod.image)}
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
                    <span className="text-[10px] text-slate-500">
                      ID #{prod.id}
                    </span>
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
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Live Module Config
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Grid className="w-7 h-7 text-emerald-400" />
            Grocery & Kitchen + Snacks & Drinks Grids
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage the Farm Fresh Hero Banner, 8 Category Squircle Cards (Row 1 & Row 2), 2 Side-by-Side Showcase Banners, and Bottom Scrollable Snack Cards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig(DEFAULT_CATEGORY_GRIDS_CONFIG)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save & Publish
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs border ${
            message.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 1: GROCERY & KITCHEN MANAGER */}
      {/* =================================================================== */}
      <div className="bg-[#0b0f19] border border-emerald-900/40 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                1. Grocery & Kitchen Section
                <span className="text-xs font-normal text-slate-400">
                  (Hero Banner + 8 Squircle Category Cards)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure banner image, 4 cards in Row 1 and 4 cards in Row 2
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={config.groceryKitchen.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  groceryKitchen: {
                    ...config.groceryKitchen,
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
            />
            <span className="text-xs text-slate-300 font-semibold">
              Visible in App
            </span>
          </label>
        </div>

        {/* Section Title & Subtitle Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={config.groceryKitchen.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  groceryKitchen: {
                    ...config.groceryKitchen,
                    title: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={config.groceryKitchen.subtitle}
              onChange={(e) =>
                setConfig({
                  ...config,
                  groceryKitchen: {
                    ...config.groceryKitchen,
                    subtitle: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Pill Button Label
            </label>
            <input
              type="text"
              value={config.groceryKitchen.backToTopText}
              onChange={(e) =>
                setConfig({
                  ...config,
                  groceryKitchen: {
                    ...config.groceryKitchen,
                    backToTopText: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-emerald-400 font-semibold"
            />
          </div>
        </div>

        {/* 1.1 Hero Banner (Farm Fresh Fruits and Veg) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              Grocery & Kitchen Hero Banner
            </h3>
            <span className="text-[10px] text-slate-400">Aspect Ratio 662/206</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Banner Preview & Upload */}
            <div className="lg:col-span-6 relative aspect-[662/206] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group shadow-inner">
              <img
                src={resolveImgSrc(config.groceryKitchen.heroBanner.image)}
                alt=""
                className="w-full h-full object-cover group-hover:opacity-40 transition"
              />
              <div
                onClick={() => gkHeroFileRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer"
              >
                <Upload className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold mt-1">Upload New Hero Banner</span>
              </div>
              {uploadingTarget === "gk-hero" && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={gkHeroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file, "gk-hero", (url) => {
                    setConfig((prev) => ({
                      ...prev,
                      groceryKitchen: {
                        ...prev.groceryKitchen,
                        heroBanner: {
                          ...prev.groceryKitchen.heroBanner,
                          image: url,
                        },
                      },
                    }));
                  });
                }
              }}
            />

            {/* Banner Controls & Target Route */}
            <div className="lg:col-span-6 space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Search Keyword / Route Target
                </label>
                <input
                  type="text"
                  value={config.groceryKitchen.heroBanner.searchKeyword}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      groceryKitchen: {
                        ...prev.groceryKitchen,
                        heroBanner: {
                          ...prev.groceryKitchen.heroBanner,
                          searchKeyword: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  value={config.groceryKitchen.heroBanner.image}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      groceryKitchen: {
                        ...prev.groceryKitchen,
                        heroBanner: {
                          ...prev.groceryKitchen.heroBanner,
                          image: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => gkHeroFileRef.current?.click()}
                  disabled={uploadingTarget === "gk-hero"}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => openProductPicker("gk-hero")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-xs text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer border border-emerald-800/60"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  Browse Catalog
                </button>
              </div>
            </div>
          </div>

          {/* Inline Catalog Picker for Hero Banner */}
          {renderCatalogPicker("gk-hero")}
        </div>

        {/* 1.2 Row 1: 4 Category Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            Row 1 Category Cards (4 Cards)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.groceryKitchen.row1Cards.map((card, idx) => {
              const targetKey = `gk-r1-${idx}`;
              const isUploadingThis = uploadingTarget === targetKey;

              return (
                <div
                  key={card.id || idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between"
                >
                  {/* Card Preview */}
                  <div className="relative aspect-[161/156] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center group shadow-inner">
                    <img
                      src={resolveImgSrc(card.image)}
                      alt={card.title}
                      className="w-full h-full object-contain group-hover:opacity-40 transition p-1"
                    />
                    <div
                      onClick={() => gkRow1FileRefs.current[idx]?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-1">Upload</span>
                    </div>
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      gkRow1FileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, targetKey, (url) => {
                          updateGkRow1Card(idx, "image", url);
                        });
                      }
                    }}
                  />

                  {/* Card Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Title #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) =>
                          updateGkRow1Card(idx, "title", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Search Keyword
                      </label>
                      <input
                        type="text"
                        value={card.searchKeyword}
                        onChange={(e) =>
                          updateGkRow1Card(idx, "searchKeyword", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
                      />
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => gkRow1FileRefs.current[idx]?.click()}
                        disabled={isUploadingThis}
                        className="flex-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3 text-emerald-400" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="flex-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Package className="w-3 h-3" />
                        Catalog
                      </button>
                    </div>

                    {/* Inline Catalog Picker */}
                    {renderCatalogPicker(targetKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1.3 Row 2: 4 Category Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            Row 2 Category Cards (4 Cards)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.groceryKitchen.row2Cards.map((card, idx) => {
              const targetKey = `gk-r2-${idx}`;
              const isUploadingThis = uploadingTarget === targetKey;

              return (
                <div
                  key={card.id || idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between"
                >
                  {/* Card Preview */}
                  <div className="relative aspect-[161/156] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center group shadow-inner">
                    <img
                      src={resolveImgSrc(card.image)}
                      alt={card.title}
                      className="w-full h-full object-contain group-hover:opacity-40 transition p-1"
                    />
                    <div
                      onClick={() => gkRow2FileRefs.current[idx]?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-1">Upload</span>
                    </div>
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      gkRow2FileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, targetKey, (url) => {
                          updateGkRow2Card(idx, "image", url);
                        });
                      }
                    }}
                  />

                  {/* Card Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Title #{idx + 5}
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) =>
                          updateGkRow2Card(idx, "title", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Search Keyword
                      </label>
                      <input
                        type="text"
                        value={card.searchKeyword}
                        onChange={(e) =>
                          updateGkRow2Card(idx, "searchKeyword", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
                      />
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => gkRow2FileRefs.current[idx]?.click()}
                        disabled={isUploadingThis}
                        className="flex-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3 text-emerald-400" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="flex-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Package className="w-3 h-3" />
                        Catalog
                      </button>
                    </div>

                    {/* Inline Catalog Picker */}
                    {renderCatalogPicker(targetKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 2: SNACKS & DRINKS MANAGER */}
      {/* =================================================================== */}
      <div className="bg-[#0b0f19] border border-orange-900/40 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-700/40 flex items-center justify-center text-orange-400">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                2. Snacks & Drinks Section
                <span className="text-xs font-normal text-slate-400">
                  (2 Side-by-Side Banners + Bottom Shelf Cards)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure cafe/ice cream showcase banners & horizontal scrollable snack cards
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={config.snacksDrinks.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  snacksDrinks: {
                    ...config.snacksDrinks,
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-0 w-4 h-4"
            />
            <span className="text-xs text-slate-300 font-semibold">
              Visible in App
            </span>
          </label>
        </div>

        {/* Section Title & Subtitle Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Title Part 1
            </label>
            <input
              type="text"
              value={config.snacksDrinks.title1}
              onChange={(e) =>
                setConfig({
                  ...config,
                  snacksDrinks: {
                    ...config.snacksDrinks,
                    title1: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Title Part 2 (Accent)
            </label>
            <input
              type="text"
              value={config.snacksDrinks.title2}
              onChange={(e) =>
                setConfig({
                  ...config,
                  snacksDrinks: {
                    ...config.snacksDrinks,
                    title2: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-orange-400 font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={config.snacksDrinks.subtitle}
              onChange={(e) =>
                setConfig({
                  ...config,
                  snacksDrinks: {
                    ...config.snacksDrinks,
                    subtitle: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              View All Keyword
            </label>
            <input
              type="text"
              value={config.snacksDrinks.viewAllKeyword}
              onChange={(e) =>
                setConfig({
                  ...config,
                  snacksDrinks: {
                    ...config.snacksDrinks,
                    viewAllKeyword: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-rose-400 font-semibold"
            />
          </div>
        </div>

        {/* 2.1 Side-by-Side Showcase Banners (Cafe Specials & Ice Creams) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
            2 Side-by-Side Showcase Banners (Aspect Ratio 321/161)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.snacksDrinks.banners.map((banner, idx) => {
              const targetKey = `sd-banner-${idx}`;
              const isUploadingThis = uploadingTarget === targetKey;

              return (
                <div
                  key={banner.id || idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="relative aspect-[321/161] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center group shadow-inner">
                    <img
                      src={resolveImgSrc(banner.image)}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:opacity-40 transition"
                    />
                    <div
                      onClick={() => sdBannerFileRefs.current[idx]?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-orange-400" />
                      <span className="text-xs font-bold mt-1">Upload Banner</span>
                    </div>
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      sdBannerFileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, targetKey, (url) => {
                          updateSdBanner(idx, "image", url);
                        });
                      }
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Banner Title
                      </label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) =>
                          updateSdBanner(idx, "title", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Target Keyword
                      </label>
                      <input
                        type="text"
                        value={banner.searchKeyword}
                        onChange={(e) =>
                          updateSdBanner(idx, "searchKeyword", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => sdBannerFileRefs.current[idx]?.click()}
                      disabled={isUploadingThis}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-orange-400 font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => openProductPicker(targetKey)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Catalog
                    </button>
                  </div>

                  {/* Inline Catalog Picker */}
                  {renderCatalogPicker(targetKey)}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2.2 Bottom Category Shelf Cards (Horizontal Scrollable Shelf) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-orange-400" />
              Snacks & Drinks Shelf Cards ({config.snacksDrinks.bottomCards.length} Cards)
            </h3>
            <button
              type="button"
              onClick={addSdCard}
              className="px-3 py-1 rounded-lg bg-orange-950/80 hover:bg-orange-900 text-xs text-orange-300 font-bold flex items-center gap-1 border border-orange-800/60 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Snack Card
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {config.snacksDrinks.bottomCards.map((card, idx) => {
              const targetKey = `sd-card-${idx}`;
              const isUploadingThis = uploadingTarget === targetKey;

              return (
                <div
                  key={card.id || idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 space-y-2 flex flex-col justify-between relative group"
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeSdCard(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-950 border border-rose-700/60 rounded-full text-rose-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                    title="Remove Card"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Card Preview */}
                  <div className="relative aspect-[109/136] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center group shadow-inner">
                    <img
                      src={resolveImgSrc(card.image)}
                      alt={card.title}
                      className="w-full h-full object-contain group-hover:opacity-40 transition p-1"
                    />
                    <div
                      onClick={() => sdCardFileRefs.current[idx]?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/60 text-white cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold mt-0.5">Upload</span>
                    </div>
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      sdCardFileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, targetKey, (url) => {
                          updateSdCard(idx, "image", url);
                        });
                      }
                    }}
                  />

                  {/* Card Fields */}
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[9.5px] text-slate-400 block">
                        Title #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) =>
                          updateSdCard(idx, "title", e.target.value)
                        }
                        className="w-full px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[11px] text-white font-bold"
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
                          updateSdCard(idx, "searchKeyword", e.target.value)
                        }
                        className="w-full px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10.5px] text-slate-300"
                      />
                    </div>

                    <div className="flex gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => sdCardFileRefs.current[idx]?.click()}
                        disabled={isUploadingThis}
                        className="flex-1 px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9.5px] text-slate-300 font-medium flex items-center justify-center gap-0.5 border border-slate-700 cursor-pointer"
                      >
                        <UploadCloud className="w-2.5 h-2.5 text-orange-400" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9.5px] text-amber-400 font-medium flex items-center justify-center border border-slate-700 cursor-pointer"
                      >
                        <Package className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Inline Catalog Picker */}
                    {renderCatalogPicker(targetKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
