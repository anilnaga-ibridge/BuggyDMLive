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
  X,
  Package,
  Crown,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  CuratedProductsConfig,
  CuratedProductItem,
  DEFAULT_CURATED_PRODUCTS_CONFIG,
} from "@/types/curated-products";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function CuratedProductsManagerPage() {
  const [config, setConfig] = useState<CuratedProductsConfig>(
    DEFAULT_CURATED_PRODUCTS_CONFIG
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Target for Catalog Search or Upload (e.g. "curated-0")
  const [activePickerTarget, setActivePickerTarget] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Input Refs
  const productFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/curated-products");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/curated-products");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig({
              ...DEFAULT_CURATED_PRODUCTS_CONFIG,
              ...json.data,
              enabled:
                json.data.enabled !== undefined
                  ? Boolean(json.data.enabled)
                  : true,
              products:
                Array.isArray(json.data.products) && json.data.products.length > 0
                  ? json.data.products
                  : DEFAULT_CURATED_PRODUCTS_CONFIG.products,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Curated Products config:", err);
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

    if (activePickerTarget.startsWith("curated-")) {
      const idx = parseInt(activePickerTarget.replace("curated-", ""), 10);
      updateProduct(idx, {
        name: product.name,
        searchQuery: product.name,
        price: product.discountedPrice || product.price,
        originalPrice: product.price,
        image: product.image || config.products[idx]?.image || "",
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
      let res = await fetch("/BuggyDm/api/grocery/curated-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/curated-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Curated for you products saved and live in User App!",
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

  const updateProduct = (
    index: number,
    partial: Partial<CuratedProductItem>
  ) => {
    setConfig((prev) => {
      const list = [...prev.products];
      list[index] = { ...list[index], ...partial };
      return { ...prev, products: list };
    });
  };

  const addProduct = () => {
    setConfig((prev) => {
      const newProd: CuratedProductItem = {
        id: `curated_${Date.now()}`,
        name: "New Handpicked Item",
        unit: "1 kg",
        price: 100,
        originalPrice: 120,
        image: "assets/image/curated_tomato.png",
        searchQuery: "Fresh Groceries",
      };
      return {
        ...prev,
        products: [...prev.products, newProd],
      };
    });
  };

  const removeProduct = (index: number) => {
    setConfig((prev) => {
      const list = [...prev.products];
      list.splice(index, 1);
      return { ...prev, products: list };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm gap-2">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        Loading Curated For You Settings...
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
            className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            autoFocus
          />
          {searching && (
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
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
                    <span className="font-medium text-slate-200 block truncate group-hover:text-amber-400">
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
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-800/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Live Module Config
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Crown className="w-7 h-7 text-amber-400" />
            Curated For You Section
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage the 3-Column "Curated for you" product grid in the Grocery Module. Configure handpicked products, prices, discount rates, pack units, and search routes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig(DEFAULT_CURATED_PRODUCTS_CONFIG)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-amber-900/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
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

      {/* Main Controls Box */}
      <div className="bg-[#0b0f19] border border-amber-900/40 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Curated Products Grid Settings
                <span className="text-xs font-normal text-slate-400">
                  ({config.products.length} Products Configured)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Display 3 products per row with compact prices and ADD cart buttons
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  enabled: e.target.checked,
                })
              }
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
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
              Section Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  title: e.target.value,
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
              value={config.subtitle}
              onChange={(e) =>
                setConfig({
                  ...config,
                  subtitle: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              View All Label
            </label>
            <input
              type="text"
              value={config.viewAllText}
              onChange={(e) =>
                setConfig({
                  ...config,
                  viewAllText: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-emerald-400 font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              View All Query
            </label>
            <input
              type="text"
              value={config.viewAllQuery}
              onChange={(e) =>
                setConfig({
                  ...config,
                  viewAllQuery: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
            />
          </div>
        </div>

        {/* Products Grid Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              Curated Products List ({config.products.length})
            </h3>
            <button
              type="button"
              onClick={addProduct}
              className="px-3.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-xs text-amber-300 font-bold flex items-center gap-1.5 border border-amber-800/60 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Curated Product
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {config.products.map((prod, idx) => {
              const targetKey = `curated-${idx}`;
              const isUploadingThis = uploadingTarget === targetKey;

              return (
                <div
                  key={prod.id || idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between relative group"
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeProduct(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-950 border border-rose-700/60 rounded-full text-rose-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                    title="Remove Product"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Product Image Preview */}
                  <div className="relative aspect-[238/235] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center group/img shadow-inner">
                    <img
                      src={resolveImgSrc(prod.image)}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover/img:opacity-40 transition p-2"
                    />
                    <div
                      onClick={() => productFileRefs.current[idx]?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition bg-black/60 text-white cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold mt-1">Upload Image</span>
                    </div>
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      productFileRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, targetKey, (url) => {
                          updateProduct(idx, { image: url });
                        });
                      }
                    }}
                  />

                  {/* Product Details Form */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Product Name #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) =>
                          updateProduct(idx, { name: e.target.value })
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[9.5px] text-slate-400 block mb-0.5">
                          Unit / Size
                        </label>
                        <input
                          type="text"
                          value={prod.unit}
                          onChange={(e) =>
                            updateProduct(idx, { unit: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400 block mb-0.5">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={prod.price}
                          onChange={(e) =>
                            updateProduct(idx, {
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-emerald-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400 block mb-0.5">
                          Orig Price
                        </label>
                        <input
                          type="number"
                          value={prod.originalPrice}
                          onChange={(e) =>
                            updateProduct(idx, {
                              originalPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-slate-400 block mb-0.5">
                        Search Query
                      </label>
                      <input
                        type="text"
                        value={prod.searchQuery}
                        onChange={(e) =>
                          updateProduct(idx, { searchQuery: e.target.value })
                        }
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => productFileRefs.current[idx]?.click()}
                        disabled={isUploadingThis}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductPicker(targetKey)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
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
    </div>
  );
}
