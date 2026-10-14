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
  Search,
  UploadCloud,
  Package,
  Heart,
  Tag,
  Copy,
  Layers,
  Palette,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  FlavourFestConfig,
  FlavourFestShowcaseItem,
  FlavourFestCard,
  DEFAULT_FLAVOUR_FEST_CONFIG,
} from "@/types/flavour-fest";

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

const QUICK_EMOJIS = ["🍰", "🍨", "🎂", "🍓", "🍪", "🍩", "🍫", "☕", "🧁", "🍮", "🧋", "🍕", "🍔", "🍟", "🌮", "🥐"];

function getDisplayImageUrl(imgUrl?: string): string {
  if (!imgUrl) return "";
  const trimmed = imgUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/BuggyDm")) {
    return trimmed;
  }
  if (trimmed.startsWith("BuggyDm/")) {
    return "/" + trimmed;
  }
  if (trimmed.startsWith("/storage/") || trimmed.startsWith("storage/")) {
    const clean = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    return "/BuggyDm" + clean;
  }
  if (trimmed.startsWith("assets/") || trimmed.startsWith("/assets/")) {
    const clean = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    return "/BuggyDm" + clean;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export default function FlavourFestAdminPage() {
  const [config, setConfig] = useState<FlavourFestConfig>(DEFAULT_FLAVOUR_FEST_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"showcase" | "cards" | "mascots" | "tabs">("showcase");
  const [filterTabFilter, setFilterTabFilter] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Catalog Product Search Modal state
  // "NEW" means adding as a new item, or a string ID representing an existing item to update
  const [catalogPickerTargetId, setCatalogPickerTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // File Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingItemIdx, setUploadingItemIdx] = useState<number | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCardIdx, setUploadingCardIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/flavour-fest");
        if (!res.ok) {
          res = await fetch("/api/grocery/flavour-fest");
        }
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setConfig({
              ...DEFAULT_FLAVOUR_FEST_CONFIG,
              ...json.data,
              showcaseItems: Array.isArray(json.data.showcaseItems) && json.data.showcaseItems.length > 0
                ? json.data.showcaseItems
                : DEFAULT_FLAVOUR_FEST_CONFIG.showcaseItems,
              filterTabs: Array.isArray(json.data.filterTabs) && json.data.filterTabs.length > 0
                ? json.data.filterTabs
                : DEFAULT_FLAVOUR_FEST_CONFIG.filterTabs,
              cards: Array.isArray(json.data.cards) && json.data.cards.length > 0
                ? json.data.cards
                : DEFAULT_FLAVOUR_FEST_CONFIG.cards,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load FlavourFest config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  async function saveConfigToServer(cfgToSave: FlavourFestConfig, successMessage?: string) {
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        ...cfgToSave,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to BuggyDM API
      let res = await fetch("/BuggyDm/api/grocery/flavour-fest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch("/api/grocery/flavour-fest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // 2. Also forward save to CXP if reachable
      try {
        await fetch("http://localhost:3001/BuggyCxp/api/grocery/flavour-fest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (_) {}

      const json = await res.json();
      if (json?.success) {
        setStatusMessage({
          type: "success",
          text: successMessage || "✅ Saved successfully! Mobile app will reflect changes in real-time.",
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({
          type: "error",
          text: "❌ Error: " + (json?.error || "Failed to save"),
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "❌ Network error: " + err?.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await saveConfigToServer(config);
  }

  function handleReset() {
    if (confirm("Reset FlavourFest showcase items and configuration to defaults?")) {
      setConfig(DEFAULT_FLAVOUR_FEST_CONFIG);
      setStatusMessage({ type: "success", text: "Reset to default configuration. Click Save to apply." });
    }
  }

  // --- Catalog Product Search ---
  async function searchCatalog(query: string) {
    setSearching(true);
    try {
      let res = await fetch(`/BuggyDm/api/admin/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}`);
      }
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error("Product search failed:", err);
    } finally {
      setSearching(false);
    }
  }

  function openCatalogPickerForExistingItem(itemId: string) {
    setCatalogPickerTargetId(itemId);
    setSearchQuery("");
    searchCatalog("");
  }

  function openCatalogPickerForNewItem() {
    setCatalogPickerTargetId("NEW");
    setSearchQuery("");
    searchCatalog("");
  }

  function selectProduct(product: SearchProduct) {
    if (!catalogPickerTargetId) return;

    const finalPrice = product.discountedPrice || product.price || 0;
    const finalBadge = `AT ₹${finalPrice}`;
    const finalImage = getDisplayImageUrl(product.image);

    let updated = [...config.showcaseItems];
    if (catalogPickerTargetId === "NEW") {
      // Add as a brand new showcase item
      const newItem: FlavourFestShowcaseItem = {
        id: `item_${Date.now()}`,
        name: product.name,
        price: finalPrice,
        badge: finalBadge,
        image: finalImage,
        emoji: "🍰",
        adBadge: true,
        tabId: filterTabFilter !== "all" ? filterTabFilter : "all",
        itemId: product.id,
        searchQuery: product.name,
      };
      updated = [...config.showcaseItems, newItem];
    } else {
      // Update existing item by its ID
      const targetIdx = updated.findIndex((i) => i.id === catalogPickerTargetId);
      if (targetIdx !== -1) {
        updated[targetIdx] = {
          ...updated[targetIdx],
          name: product.name,
          price: finalPrice,
          badge: finalBadge,
          image: finalImage,
          itemId: product.id,
          searchQuery: product.name,
        };
      }
    }

    const newConfig = { ...config, showcaseItems: updated };
    setConfig(newConfig);
    setCatalogPickerTargetId(null);
    setSearchQuery("");
    saveConfigToServer(newConfig, `✅ Added "${product.name}" from catalog and saved!`);
  }

  // --- Image Upload ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploadingItemIdx === null) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      let res = await fetch("/BuggyDm/api/grocery/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        res = await fetch("/api/grocery/upload", {
          method: "POST",
          body: formData,
        });
      }
      const json = await res.json();
      const uploadedUrl = json?.data?.url || json?.url || json?.relativeUrl;
      if (json?.success && uploadedUrl) {
        const updated = [...config.showcaseItems];
        if (uploadingItemIdx !== null && updated[uploadingItemIdx]) {
          updated[uploadingItemIdx] = {
            ...updated[uploadingItemIdx],
            image: uploadedUrl,
          };
          const newConfig = { ...config, showcaseItems: updated };
          setConfig(newConfig);
          saveConfigToServer(newConfig, "✅ Image uploaded and saved! Mobile app updated in real-time.");
        }
      } else {
        alert("Upload error: " + (json?.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Network upload error: " + err?.message);
    } finally {
      setUploadingItemIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // --- Card Image Upload ---
  async function handleCardFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploadingCardIdx === null) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      let res = await fetch("/BuggyDm/api/grocery/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        res = await fetch("/api/grocery/upload", {
          method: "POST",
          body: formData,
        });
      }
      const json = await res.json();
      const uploadedUrl = json?.data?.url || json?.url || json?.relativeUrl;
      if (json?.success && uploadedUrl) {
        const updated = [...config.cards];
        if (uploadingCardIdx !== null && updated[uploadingCardIdx]) {
          updated[uploadingCardIdx] = {
            ...updated[uploadingCardIdx],
            graphicType: "custom_image",
            customImage: uploadedUrl,
          };
          const newConfig = { ...config, cards: updated };
          setConfig(newConfig);
          saveConfigToServer(newConfig, `✅ Card #${uploadingCardIdx + 1} image uploaded and saved!`);
        }
      } else {
        alert("Upload error: " + (json?.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Network upload error: " + err?.message);
    } finally {
      setUploadingCardIdx(null);
      if (cardFileInputRef.current) cardFileInputRef.current.value = "";
    }
  }

  // --- Showcase Items CRUD ---
  function addShowcaseItem() {
    const newItem: FlavourFestShowcaseItem = {
      id: `item_${Date.now()}`,
      name: "New Gourmet Treat",
      price: 90,
      badge: "ITEMS\nAT ₹90",
      image: "",
      emoji: "🍰",
      adBadge: true,
      tabId: filterTabFilter !== "all" ? filterTabFilter : "all",
    };
    const newConfig = {
      ...config,
      showcaseItems: [...config.showcaseItems, newItem],
    };
    setConfig(newConfig);
    saveConfigToServer(newConfig, "✅ New showcase item added and saved!");
  }

  function updateShowcaseItem(idx: number, patch: Partial<FlavourFestShowcaseItem>) {
    const updated = [...config.showcaseItems];
    updated[idx] = { ...updated[idx], ...patch };
    setConfig({ ...config, showcaseItems: updated });
  }

  function duplicateShowcaseItem(idx: number) {
    const source = config.showcaseItems[idx];
    const clone: FlavourFestShowcaseItem = {
      ...source,
      id: `item_${Date.now()}`,
      name: `${source.name} (Copy)`,
    };
    const updated = [...config.showcaseItems];
    updated.splice(idx + 1, 0, clone);
    const newConfig = { ...config, showcaseItems: updated };
    setConfig(newConfig);
    saveConfigToServer(newConfig, "✅ Showcase item duplicated and saved!");
  }

  function deleteShowcaseItem(idx: number) {
    if (confirm("Delete this showcase item?")) {
      const updated = config.showcaseItems.filter((_, i) => i !== idx);
      const newConfig = { ...config, showcaseItems: updated };
      setConfig(newConfig);
      saveConfigToServer(newConfig, "✅ Showcase item deleted and saved!");
    }
  }

  // --- Quick Card Theme Presets ---
  function applyWhiteThemeToCards() {
    const updatedCards: FlavourFestCard[] = config.cards.map((c) => ({
      ...c,
      gradient: ["#FFFFFF", "#FFFFFF"],
      textColor: "#0F172A",
    }));
    setConfig({
      ...config,
      theme: {
        ...config.theme,
        cardDefaultGradient: ["#FFFFFF", "#FFFFFF"],
        cardBorderColor: "#E2E8F0",
      },
      cards: updatedCards,
    });
    setStatusMessage({
      type: "success",
      text: "⚪ White Theme applied to all banner cards! Remember to click Save Changes.",
    });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  function applyCrimsonThemeToCards() {
    const updatedCards: FlavourFestCard[] = config.cards.map((c) => ({
      ...c,
      gradient: ["#DC2626", "#B91C1C", "#7F1D1D"],
      textColor: "#FFFFFF",
    }));
    setConfig({
      ...config,
      theme: {
        ...config.theme,
        cardDefaultGradient: ["#DC2626", "#B91C1C", "#7F1D1D"],
        cardBorderColor: "#FF80AB66",
      },
      cards: updatedCards,
    });
    setStatusMessage({
      type: "success",
      text: "🔴 Crimson Festival theme applied to cards! Remember to click Save Changes.",
    });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  const filteredShowcaseItems = config.showcaseItems.filter((item) => {
    if (filterTabFilter === "all") return true;
    return item.tabId === filterTabFilter || item.tabId === "all" || !item.tabId;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex items-center gap-3 text-base font-semibold">
          <Sparkles className="h-6 w-6 animate-spin text-amber-500" />
          Loading FlavourFest Studio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header Bar */}
      <div className="mx-auto max-w-7xl mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-2xl text-amber-500 shadow-sm">
              🍰
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                FlavourFest Showcase Items & Studio
              </h1>
              <p className="text-sm text-slate-500">
                Manage showcase items, badges, filter tabs, and cards with clean white card theme.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes to BuggyDM"}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`mx-auto max-w-7xl mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-medium shadow-sm transition ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mx-auto max-w-7xl mb-6 flex border-b border-slate-200/90 gap-2">
        <button
          onClick={() => setActiveTab("showcase")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "showcase"
              ? "border-amber-500 text-amber-600 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          <span className="text-base">🍰</span>
          Showcase Items ({config.showcaseItems.length})
        </button>
        <button
          onClick={() => setActiveTab("tabs")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "tabs"
              ? "border-amber-500 text-amber-600 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter Tabs ({config.filterTabs.length})
        </button>
        <button
          onClick={() => setActiveTab("cards")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "cards"
              ? "border-amber-500 text-amber-600 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          <Layers className="h-4 w-4" />
          Banner Offer Cards ({config.cards.length})
        </button>
        <button
          onClick={() => setActiveTab("mascots")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "mascots"
              ? "border-amber-500 text-amber-600 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Header, Mascots & Colors
        </button>
      </div>

      {/* TAB 1: SHOWCASE ITEMS MANAGER */}
      {activeTab === "showcase" && (
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Controls Bar - White Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Filter by Tab:
              </span>
              <button
                onClick={() => setFilterTabFilter("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                  filterTabFilter === "all"
                    ? "bg-amber-500 text-white shadow-amber-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                All Tabs ({config.showcaseItems.length})
              </button>
              {config.filterTabs.map((tab) => {
                const count = config.showcaseItems.filter(
                  (i) => i.tabId === tab.id || i.tabId === "all"
                ).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTabFilter(tab.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                      filterTabFilter === tab.id
                        ? "bg-amber-500 text-white shadow-amber-500/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCatalogPickerForNewItem}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Package className="h-4 w-4" />
                + Pick & Add Catalog Item
              </button>
              <button
                onClick={addShowcaseItem}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Blank Item
              </button>
            </div>
          </div>

          {/* Items Grid - Pure White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowcaseItems.map((item) => {
              const originalIdx = config.showcaseItems.findIndex((i) => i.id === item.id);
              const displayImg = getDisplayImageUrl(item.image);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition space-y-4"
                >
                  {/* Card Header & Preview */}
                  <div className="flex items-start gap-4">
                    {/* Live Mobile Card Simulation */}
                    <div className="relative w-28 h-36 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm group">
                      {/* Item Image / Emoji */}
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-4xl">
                          {item.emoji || "🍰"}
                        </div>
                      )}

                      {/* Favorite Heart Top-Right */}
                      <div className="absolute top-2 right-2 rounded-full bg-black/10 p-1 backdrop-blur-xs">
                        <Heart className="h-3.5 w-3.5 text-slate-700 fill-none" />
                      </div>

                      {/* Gradient overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/75 to-transparent" />

                      {/* Badge Bottom-Left */}
                      <div className="absolute bottom-2 left-2 rounded bg-black/85 px-1.5 py-0.5 text-[8.5px] font-black leading-tight text-white tracking-wide border border-white/10">
                        {item.badge.replace("\n", " ")}
                      </div>

                      {/* AD Badge Bottom-Right */}
                      {item.adBadge !== false && (
                        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1 py-0.5 text-[7px] font-bold text-white/90">
                          AD
                        </div>
                      )}
                    </div>

                    {/* Quick Info & Actions */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          {config.filterTabs.find((t) => t.id === item.tabId)?.label || "All Tabs"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateShowcaseItem(originalIdx)}
                            title="Duplicate"
                            className="p-1 text-slate-400 hover:text-slate-700 transition"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteShowcaseItem(originalIdx)}
                            title="Delete"
                            className="p-1 text-rose-500 hover:text-rose-700 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-emerald-600 font-bold">₹{item.price}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Badge: <span className="text-slate-800 font-semibold">{item.badge.replace("\n", " ")}</span>
                      </p>

                      {/* Pick from Store Catalog Button */}
                      <button
                        type="button"
                        onClick={() => openCatalogPickerForExistingItem(item.id)}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs transition cursor-pointer"
                      >
                        <Package className="h-3.5 w-3.5 text-amber-600" />
                        Pick Catalog Item
                      </button>
                    </div>
                  </div>

                  {/* Edit Form Fields */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateShowcaseItem(originalIdx, { name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateShowcaseItem(originalIdx, { price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Badge (e.g. AT ₹90)
                        </label>
                        <input
                          type="text"
                          value={item.badge}
                          onChange={(e) => updateShowcaseItem(originalIdx, { badge: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Assigned Filter Tab
                        </label>
                        <select
                          value={item.tabId || "all"}
                          onChange={(e) => updateShowcaseItem(originalIdx, { tabId: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-amber-500 focus:outline-none transition"
                        >
                          <option value="all">All Tabs</option>
                          {config.filterTabs.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`ad_${item.id}`}
                          checked={item.adBadge !== false}
                          onChange={(e) =>
                            updateShowcaseItem(originalIdx, { adBadge: e.target.checked })
                          }
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <label htmlFor={`ad_${item.id}`} className="text-slate-700 font-medium select-none cursor-pointer">
                          Show &quot;AD&quot; Badge
                        </label>
                      </div>
                    </div>

                    {/* Image URL & Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Custom Image URL
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingItemIdx(originalIdx);
                            fileInputRef.current?.click();
                          }}
                          className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="h-3 w-3" /> Upload File
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="https://... or /BuggyDm/storage/..."
                        value={item.image || ""}
                        onChange={(e) => updateShowcaseItem(originalIdx, { image: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                      />
                    </div>

                    {/* Fallback Emoji */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Fallback Emoji (when image is empty or loading)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => updateShowcaseItem(originalIdx, { emoji })}
                            className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center transition ${
                              item.emoji === emoji
                                ? "bg-amber-100 border border-amber-500 text-amber-900 scale-110 shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FILTER TABS MANAGER */}
      {activeTab === "tabs" && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Filter Tabs (Switcher Bar)</h3>
                <p className="text-xs text-slate-500">
                  Configure the pill switcher tabs (e.g. &quot;TOP RATED&quot; and &quot;FOOD IN 15 MINS&quot;).
                </p>
              </div>
              <button
                onClick={() => {
                  const newTab = {
                    id: `tab_${Date.now()}`,
                    label: "NEW FILTER",
                    filterType: "popular",
                  };
                  setConfig({ ...config, filterTabs: [...config.filterTabs, newTab] });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Tab
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {config.filterTabs.map((tab, idx) => (
                <div
                  key={tab.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs"
                >
                  <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Tab Label
                    </label>
                    <input
                      type="text"
                      value={tab.label}
                      onChange={(e) => {
                        const updated = [...config.filterTabs];
                        updated[idx].label = e.target.value.toUpperCase();
                        setConfig({ ...config, filterTabs: updated });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-48">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Filter Category Type
                    </label>
                    <select
                      value={tab.filterType}
                      onChange={(e) => {
                        const updated = [...config.filterTabs];
                        updated[idx].filterType = e.target.value;
                        setConfig({ ...config, filterTabs: updated });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="popular">Popular / Top Rated</option>
                      <option value="discounted">Discounted / 15 Mins</option>
                      <option value="trending">Trending Treats</option>
                      <option value="offers">Special Offers</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (config.filterTabs.length <= 1) {
                        alert("At least one tab is required.");
                        return;
                      }
                      const updated = config.filterTabs.filter((_, i) => i !== idx);
                      setConfig({ ...config, filterTabs: updated });
                    }}
                    className="mt-4 p-2 text-rose-500 hover:text-rose-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANNER OFFER CARDS */}
      {activeTab === "cards" && (
        <div className="mx-auto max-w-5xl space-y-6">
          <input
            ref={cardFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCardFileUpload}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Banner Offer Cards ({config.cards.length})</h3>
                <p className="text-xs text-slate-500">
                  Manage headline, subtitle (e.g. UP TO ₹120, ON ₹199+), badges, coupon graphics, and custom images.
                </p>
              </div>

              {/* Quick Card Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={applyWhiteThemeToCards}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                  title="Set all cards to crisp white theme"
                >
                  <span className="h-3 w-3 rounded-full bg-white border border-slate-400 inline-block shadow-xs" />
                  Apply White Theme
                </button>
                <button
                  type="button"
                  onClick={applyCrimsonThemeToCards}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-100 transition cursor-pointer"
                >
                  <span className="h-3 w-3 rounded-full bg-rose-600 inline-block" />
                  Crimson Red
                </button>
                <button
                  onClick={() => {
                    const newCard: FlavourFestCard = {
                      id: `card_${Date.now()}`,
                      title: "New\nSpecial Offer",
                      subtitle: "LIMITED TIME",
                      searchQuery: "offers",
                      graphicType: "badge150",
                      customImage: "",
                      customEmoji: "",
                      gradient: ["#FFFFFF", "#FFFFFF"],
                      textColor: "#0F172A",
                    };
                    setConfig({ ...config, cards: [...config.cards, newCard] });
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-sm transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Offer Card
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 pt-2">
              {config.cards.map((card, idx) => {
                const isWhiteTheme =
                  card.gradient &&
                  card.gradient[0]?.toUpperCase() === "#FFFFFF" &&
                  (card.gradient[1]?.toUpperCase() === "#FFFFFF" || !card.gradient[1]);
                const graphicType = card.graphicType || "coupon";

                return (
                  <div
                    key={card.id || `card_${idx}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    {/* Header bar with Card #, Reordering, Duplicate & Delete */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-slate-100">
                          Card #{idx + 1}
                        </span>
                        {isWhiteTheme && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            White Theme
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const updated = [...config.cards];
                            const temp = updated[idx - 1];
                            updated[idx - 1] = updated[idx];
                            updated[idx] = temp;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Left / Earlier"
                        >
                          ◀
                        </button>
                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === config.cards.length - 1}
                          onClick={() => {
                            if (idx === config.cards.length - 1) return;
                            const updated = [...config.cards];
                            const temp = updated[idx + 1];
                            updated[idx + 1] = updated[idx];
                            updated[idx] = temp;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Right / Later"
                        >
                          ▶
                        </button>
                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => {
                            const clone: FlavourFestCard = {
                              ...card,
                              id: `card_${Date.now()}`,
                              title: `${card.title} (Copy)`,
                            };
                            const updated = [...config.cards];
                            updated.splice(idx + 1, 0, clone);
                            setConfig({ ...config, cards: updated });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title="Duplicate Card"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = config.cards.filter((_, i) => i !== idx);
                            setConfig({ ...config, cards: updated });
                          }}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Delete Card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Realistic Visual Preview (matching Flutter Card) */}
                    <div className="flex justify-center py-1">
                      <div
                        className="rounded-2xl p-2.5 border shadow-sm flex flex-col items-center justify-between w-32 h-40 text-center select-none"
                        style={{
                          background:
                            card.gradient?.length > 1
                              ? `linear-gradient(180deg, ${card.gradient[0]}, ${card.gradient[card.gradient.length - 1]})`
                              : card.gradient?.[0] || "#FFFFFF",
                          borderColor: isWhiteTheme ? "#E2E8F0" : "rgba(255, 64, 129, 0.4)",
                          color: card.textColor || (isWhiteTheme ? "#0F172A" : "#FFFFFF"),
                        }}
                      >
                        {/* Title */}
                        <div className="text-[12px] font-extrabold leading-tight whitespace-pre-line">
                          {card.title || "Special\nOffer"}
                        </div>

                        {/* Graphic */}
                        <div className="my-auto flex items-center justify-center">
                          {graphicType === "coupon" && (
                            <div className="flex items-center gap-1">
                              <div className="h-9 w-6 rounded bg-amber-400 flex items-center justify-center text-amber-900 font-extrabold text-[11px] shadow-xs">
                                %
                              </div>
                              <div className="h-9 w-6 rounded bg-amber-400 flex items-center justify-center text-amber-900 font-extrabold text-[11px] shadow-xs">
                                %
                              </div>
                            </div>
                          )}

                          {graphicType === "cupcake" && (
                            <div className="text-2xl flex items-center gap-0.5">
                              <span>🧁</span>
                              <span>🍰</span>
                            </div>
                          )}

                          {graphicType === "badge150" && (
                            <div className="h-13 w-13 rounded-full bg-linear-to-b from-amber-300 via-amber-500 to-amber-900 border-2 border-amber-200 flex flex-col items-center justify-center text-white shadow-xs p-1">
                              <span className="text-[7px] font-extrabold tracking-wider leading-none">MIN.</span>
                              <span className="text-[12px] font-black leading-none my-0.5">₹150</span>
                              <span className="text-[7px] font-extrabold tracking-wider leading-none">OFF</span>
                            </div>
                          )}

                          {graphicType === "priceCrash" && (
                            <div className="flex flex-col items-center">
                              <div className="rounded bg-rose-950 border border-rose-500 px-2 py-0.5 text-center shadow-xs">
                                <div className="text-[9px] font-extrabold text-white leading-none">PRICE</div>
                                <div className="text-[10px] font-black text-amber-300 leading-none">CRASH</div>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              </div>
                            </div>
                          )}

                          {graphicType === "custom_image" && (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                              {card.customImage ? (
                                <img
                                  src={getDisplayImageUrl(card.customImage)}
                                  alt="Card graphic"
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-xs text-slate-400">🖼️ No image</span>
                              )}
                            </div>
                          )}

                          {graphicType === "emoji" && (
                            <div className="text-2xl">
                              {card.customEmoji || "🏷️"}
                            </div>
                          )}
                        </div>

                        {/* Subtitle / Caption */}
                        <div className="text-[9px] font-semibold opacity-90 truncate max-w-full">
                          {card.subtitle || "LIMITED TIME"}
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Card Title <span className="text-slate-400 font-normal">(\n for newline)</span>
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          placeholder="e.g. Get\n70% OFF"
                          onChange={(e) => {
                            const updated = [...config.cards];
                            updated[idx].title = e.target.value;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Subtitle / Badge Caption
                        </label>
                        <input
                          type="text"
                          value={card.subtitle || ""}
                          placeholder="e.g. UP TO ₹120, ON ₹199+"
                          onChange={(e) => {
                            const updated = [...config.cards];
                            updated[idx].subtitle = e.target.value;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Graphic Type
                        </label>
                        <select
                          value={graphicType}
                          onChange={(e) => {
                            const updated = [...config.cards];
                            updated[idx].graphicType = e.target.value as any;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-rose-500 focus:outline-none"
                        >
                          <option value="coupon">🏷️ Yellow Coupon (% %)</option>
                          <option value="cupcake">🧁 Sweet Treats (Cupcake/Cake)</option>
                          <option value="badge150">🎖️ Gold Badge (MIN. ₹150 OFF)</option>
                          <option value="priceCrash">⚡ Price Crash Badge</option>
                          <option value="custom_image">🖼️ Custom Uploaded Image / URL</option>
                          <option value="emoji">😃 Custom Emoji</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Search Query / Action
                        </label>
                        <input
                          type="text"
                          value={card.searchQuery}
                          placeholder="e.g. 70% off, offers"
                          onChange={(e) => {
                            const updated = [...config.cards];
                            updated[idx].searchQuery = e.target.value;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Conditional Graphic Controls */}
                    {graphicType === "custom_image" && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Custom Card Image
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={card.customImage || ""}
                            placeholder="https://... or /storage/..."
                            onChange={(e) => {
                              const updated = [...config.cards];
                              updated[idx].customImage = e.target.value;
                              setConfig({ ...config, cards: updated });
                            }}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadingCardIdx(idx);
                              cardFileInputRef.current?.click();
                            }}
                            className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Upload File
                          </button>
                        </div>
                        {card.customImage && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] text-slate-500">Preview:</span>
                            <img
                              src={getDisplayImageUrl(card.customImage)}
                              alt="Custom preview"
                              className="h-7 w-7 rounded object-contain border border-slate-200 bg-white"
                            />
                            <span className="text-[10px] text-slate-600 truncate max-w-xs">{card.customImage}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {graphicType === "emoji" && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Custom Emoji
                        </label>
                        <input
                          type="text"
                          value={card.customEmoji || ""}
                          placeholder="e.g. 🍕"
                          onChange={(e) => {
                            const updated = [...config.cards];
                            updated[idx].customEmoji = e.target.value;
                            setConfig({ ...config, cards: updated });
                          }}
                          className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-center text-slate-900 focus:border-rose-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {["🏷️", "🧁", "🍰", "🎂", "🍕", "🍔", "🎁", "⚡", "🔥", "🎉", "🍹", "🍩"].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => {
                                const updated = [...config.cards];
                                updated[idx].customEmoji = em;
                                setConfig({ ...config, cards: updated });
                              }}
                              className="h-7 w-7 rounded border border-slate-200 bg-white text-sm hover:bg-slate-100 flex items-center justify-center cursor-pointer transition"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Theme Presets for this card */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-600">Card Theme:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.cards];
                            updated[idx].gradient = ["#FFFFFF", "#FFFFFF"];
                            updated[idx].textColor = "#0F172A";
                            setConfig({ ...config, cards: updated });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            isWhiteTheme
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          ⚪ White Theme
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.cards];
                            updated[idx].gradient = ["#DC2626", "#B91C1C", "#7F1D1D"];
                            updated[idx].textColor = "#FFFFFF";
                            setConfig({ ...config, cards: updated });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                        >
                          🔴 Crimson
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.cards];
                            updated[idx].gradient = ["#8B5CF6", "#6D28D9", "#4C1D95"];
                            updated[idx].textColor = "#FFFFFF";
                            setConfig({ ...config, cards: updated });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                        >
                          🟣 Purple
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.cards];
                            updated[idx].gradient = ["#F97316", "#EA580C", "#C2410C"];
                            updated[idx].textColor = "#FFFFFF";
                            setConfig({ ...config, cards: updated });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                        >
                          🟠 Orange
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HEADER, MASCOTS & THEME */}
      {activeTab === "mascots" && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Header Banner & Mascots
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Banner Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={config.orderButtonText}
                  onChange={(e) => setConfig({ ...config, orderButtonText: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Left Mascot (Emoji or Image)
                </label>
                <input
                  type="text"
                  value={config.leftMascot?.value || "🍟🎷"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      leftMascot: { ...config.leftMascot, value: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Right Mascot (Emoji or Image)
                </label>
                <input
                  type="text"
                  value={config.rightMascot?.value || "🍔🎉"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rightMascot: { ...config.rightMascot, value: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG PRODUCT PICKER MODAL */}
      {catalogPickerTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {catalogPickerTargetId === "NEW"
                    ? "Add Product from Store Catalog"
                    : "Replace Showcase Item with Catalog Product"}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a product to immediately load its name, price, badge, and image into the card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatalogPickerTargetId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                autoFocus
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchCatalog(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition"
              />
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  Searching catalog products...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No products found. Try typing a different search keyword.
                </div>
              ) : (
                searchResults.map((p) => {
                  const pImg = getDisplayImageUrl(p.image);
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-amber-50/70 hover:border-amber-300 p-3 cursor-pointer transition shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {pImg ? (
                          <img
                            src={pImg}
                            alt={p.name}
                            className="h-11 w-11 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-emerald-600 font-bold">
                            ₹{p.discountedPrice || p.price}
                            {p.discount > 0 && (
                              <span className="ml-1 text-[10px] text-slate-400 line-through">
                                ₹{p.price}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectProduct(p);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition shrink-0 cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
