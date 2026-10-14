"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Palette,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Tag,
  Smile,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Flame,
  Search,
  ArrowLeftRight,
  Wand2,
  Package,
  Copy,
} from "lucide-react";
import {
  DEFAULT_FLAVOUR_FEST_CONFIG,
  type FlavourFestConfig,
  type FlavourFestCard,
  type FlavourFestShowcaseItem,
  type FilterTab,
} from "@/lib/qcos/flavour-fest-config";

const THEME_PRESETS = [
  {
    name: "Clean White Cards & Dark Canvas",
    containerGradient: ["#2E0016", "#21000F", "#19000B"],
    cardGradient: ["#FFFFFF", "#FFFFFF"],
    titleColor: "#FFE500",
    buttonBorder: "#FF5200CC",
    cardTextColor: "#0F172A",
    cardBorderColor: "#E2E8F0",
  },
  {
    name: "Classic Magenta & Wine",
    containerGradient: ["#2E0016", "#21000F", "#19000B"],
    cardGradient: ["#E91E63", "#C2185B", "#880E4F"],
    titleColor: "#FFE500",
    buttonBorder: "#FF5200CC",
    cardTextColor: "#FFFFFF",
    cardBorderColor: "#FF80AB66",
  },
  {
    name: "Diwali Gold & Crimson",
    containerGradient: ["#2B0606", "#1E0303", "#140101"],
    cardGradient: ["#DC2626", "#B91C1C", "#7F1D1D"],
    titleColor: "#FBBF24",
    buttonBorder: "#F59E0BCC",
  },
  {
    name: "Royal Purple Glow",
    containerGradient: ["#1E0A2E", "#150622", "#0C0315"],
    cardGradient: ["#8B5CF6", "#6D28D9", "#4C1D95"],
    titleColor: "#A7F3D0",
    buttonBorder: "#A855F7CC",
  },
  {
    name: "Midnight Ocean Blue",
    containerGradient: ["#021B2B", "#01121E", "#000B14"],
    cardGradient: ["#0284C7", "#0369A1", "#075985"],
    titleColor: "#38BDF8",
    buttonBorder: "#0EA5E9CC",
  },
  {
    name: "Emerald Festive Feast",
    containerGradient: ["#032616", "#021A0F", "#01120A"],
    cardGradient: ["#059669", "#047857", "#064E3B"],
    titleColor: "#FDE047",
    buttonBorder: "#10B981CC",
  },
];

const MASCOT_PRESET_PAIRS = [
  { name: "Fries & Burger Party", left: "🍟🎷", right: "🍔🎉" },
  { name: "Pizza & Rocking Guitar", left: "🍕🎸", right: "🍹🎉" },
  { name: "Donut & Festive Confetti", left: "🍩🎊", right: "🧁🎈" },
  { name: "Drumstick & Trumpet", left: "🍗🎺", right: "🍻✨" },
  { name: "Tacos & Festive Maracas", left: "🌮🪇", right: "🌯🎉" },
  { name: "Diwali Diya & Sparkles", left: "🪔✨", right: "🎆🪔" },
  { name: "Morning Coffee & Croissant", left: "☕🥐", right: "🍳🥞" },
  { name: "Ice Cream & Sweet Balloon", left: "🍨🎈", right: "🍦🍰" },
  { name: "Bento & Chopsticks", left: "🍱🥢", right: "🍜✨" },
  { name: "Movie Popcorn & Clapper", left: "🍿🎬", right: "🥤🍫" },
];

const GLOW_COLOR_PRESETS = [
  { name: "Neon Pink", value: "#E91E634D", color: "#E91E63" },
  { name: "Warm Gold", value: "#FFB8004D", color: "#FFB800" },
  { name: "Sunset Orange", value: "#FF57224D", color: "#FF5722" },
  { name: "Royal Purple", value: "#9C27B04D", color: "#9C27B0" },
  { name: "Festive Green", value: "#00E6764D", color: "#00E676" },
  { name: "Midnight Wine", value: "#880E4F66", color: "#880E4F" },
];

const EMOJI_PALETTES = [
  {
    category: "Delicious Food",
    items: ["🍟", "🍔", "🍕", "🍩", "🍗", "🌮", "🌯", "🥐", "☕", "🍨", "🍦", "🍰", "🍓", "🍱", "🍿"],
  },
  {
    category: "Party & Festivities",
    items: ["🎷", "🎉", "🎊", "🎸", "🎺", "🪇", "🪔", "✨", "🎈", "🎬", "🍹", "🍻", "🔥", "⭐"],
  },
];

export default function FlavourFestAdminPage() {
  const [config, setConfig] = useState<FlavourFestConfig>(DEFAULT_FLAVOUR_FEST_CONFIG as unknown as FlavourFestConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"theme" | "borders_radius" | "cards" | "mascots" | "header" | "filters">("theme");
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [previewFilterIdx, setPreviewFilterIdx] = useState<number>(0);
  const [showcaseTabFilter, setShowcaseTabFilter] = useState<string>("all");
  const [leftMascotMode, setLeftMascotMode] = useState<"emoji" | "image">("emoji");
  const [rightMascotMode, setRightMascotMode] = useState<"emoji" | "image">("emoji");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const ts = Date.now();
      let res = await fetch(`/BuggyCxp/api/grocery/flavour-fest?_t=${ts}`, { cache: "no-store" });
      if (!res.ok) {
        res = await fetch(`/api/grocery/flavour-fest?_t=${ts}`, { cache: "no-store" });
      }
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          setConfig(json.data);
          if (json.data.leftMascot?.value?.startsWith("http")) setLeftMascotMode("image");
          if (json.data.rightMascot?.value?.startsWith("http")) setRightMascotMode("image");
        }
      }
    } catch {
      setStatusMessage("Failed to load config, loaded defaults.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/BuggyCxp/api/grocery/flavour-fest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json?.success) {
        setStatusMessage("✅ Saved successfully! Real Mobile App updates automatically within 3 seconds.");
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage("❌ Error saving: " + (json?.error || "Unknown"));
      }
    } catch (e: any) {
      setStatusMessage("❌ Network error: " + e?.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (confirm("Reset FlavourFest banner and cards to factory defaults?")) {
      setConfig(DEFAULT_FLAVOUR_FEST_CONFIG as unknown as FlavourFestConfig);
      setSelectedCardIdx(0);
    }
  }

  function applyPreset(preset: typeof THEME_PRESETS[0]) {
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        containerGradient: preset.containerGradient,
        cardDefaultGradient: preset.cardGradient,
        titleColor: preset.titleColor,
        buttonBorderColor: preset.buttonBorder,
        cardBorderColor: (preset as any).cardBorderColor || prev.theme.cardBorderColor,
      },
      cards: prev.cards.map((c) => ({
        ...c,
        gradient: preset.cardGradient,
        textColor: (preset as any).cardTextColor || c.textColor || "#FFFFFF",
      })),
    }));
  }

  function updateShowcaseItem(idx: number, patch: Partial<FlavourFestShowcaseItem>) {
    setConfig((prev) => {
      const copy = [...(prev.showcaseItems || [])];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, showcaseItems: copy };
    });
  }

  function addShowcaseItem() {
    const newItem: FlavourFestShowcaseItem = {
      id: `item_${Date.now()}`,
      name: "New Gourmet Treat",
      price: 90,
      badge: "ITEMS\nAT ₹90",
      image: "assets/image/steal_tiramisu.png",
      emoji: "🍰",
      adBadge: true,
      tabId: "tab_1",
    };
    setConfig((prev) => ({
      ...prev,
      showcaseItems: [...(prev.showcaseItems || []), newItem],
    }));
  }

  function duplicateShowcaseItem(idx: number) {
    setConfig((prev) => {
      const copy = [...(prev.showcaseItems || [])];
      const target = copy[idx];
      const dup: FlavourFestShowcaseItem = {
        ...target,
        id: `item_${Date.now()}`,
        name: `${target.name} (Copy)`,
      };
      copy.splice(idx + 1, 0, dup);
      return { ...prev, showcaseItems: copy };
    });
  }

  function deleteShowcaseItem(idx: number) {
    if (confirm("Delete this showcase item?")) {
      setConfig((prev) => {
        const copy = [...(prev.showcaseItems || [])];
        copy.splice(idx, 1);
        return { ...prev, showcaseItems: copy };
      });
    }
  }

  function updateCard(idx: number, patch: Partial<FlavourFestCard>) {
    setConfig((prev) => {
      const copy = [...prev.cards];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, cards: copy };
    });
  }

  function addCard() {
    const newId = `card_${Date.now()}`;
    const newCard: FlavourFestCard = {
      id: newId,
      title: "New\nSpecial Offer",
      subtitle: "LIMITED TIME",
      searchQuery: "offers",
      graphicType: "badge150",
      gradient: config.theme.cardDefaultGradient || ["#E91E63", "#C2185B", "#880E4F"],
      textColor: "#FFFFFF",
    };
    setConfig((prev) => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));
    setSelectedCardIdx(config.cards.length);
  }

  function deleteCard(idx: number) {
    if (config.cards.length <= 1) {
      alert("At least one card is required.");
      return;
    }
    setConfig((prev) => {
      const copy = prev.cards.filter((_, i) => i !== idx);
      return { ...prev, cards: copy };
    });
    if (selectedCardIdx >= config.cards.length - 1) {
      setSelectedCardIdx(Math.max(0, config.cards.length - 2));
    }
  }

  function moveCard(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= config.cards.length) return;
    setConfig((prev) => {
      const copy = [...prev.cards];
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return { ...prev, cards: copy };
    });
    setSelectedCardIdx(target);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="mr-2 h-6 w-6 animate-spin text-indigo-400" />
        <span>Loading FlavourFest configurations...</span>
      </div>
    );
  }

  const currentCard = config.cards[selectedCardIdx] || config.cards[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                FlavourFest & Festive Cards Studio
                <span className="rounded-md bg-pink-500/10 px-2 py-0.5 text-xs font-semibold text-pink-400 border border-pink-500/20">
                  CXP Dynamic SDUI
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Manage all card texts, colors, gradients, mascots, graphics, and filters in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes to CXP
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs font-medium text-indigo-200">
          {statusMessage}
        </div>
      )}

      {/* Main Grid: Left Editor & Right Live Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "theme"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> Color Theme & Presets
            </button>
            <button
              onClick={() => setActiveTab("borders_radius")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "borders_radius"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" /> Radius & Borders
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "cards"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Tag className="h-3.5 w-3.5" /> Offer Cards ({config.cards.length})
            </button>
            <button
              onClick={() => setActiveTab("mascots")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "mascots"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Smile className="h-3.5 w-3.5" /> Mascots & Icons
              <span className="rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300">
                {config.leftMascot?.value || "🍟🎷"} {config.rightMascot?.value || "🍔🎉"}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("header")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "header"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Type className="h-3.5 w-3.5" /> Header & CTA
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "filters"
                  ? "border-pink-500 text-pink-400 bg-pink-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" /> Filter Pills
            </button>
          </div>

          {/* TAB 1: OFFER CARDS MANAGER */}
          {activeTab === "cards" && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Manage Offer Cards</h3>
                <button
                  onClick={addCard}
                  className="flex items-center gap-1 rounded-lg bg-pink-600/20 px-2.5 py-1 text-xs font-medium text-pink-400 border border-pink-500/30 hover:bg-pink-600/30"
                >
                  <Plus className="h-3 w-3" /> Add Card
                </button>
              </div>

              {/* Card selector pills */}
              <div className="flex flex-wrap gap-2">
                {config.cards.map((card, idx) => (
                  <button
                    key={card.id || idx}
                    onClick={() => setSelectedCardIdx(idx)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selectedCardIdx === idx
                        ? "border-pink-500 bg-pink-500/20 text-pink-300"
                        : "border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Card {idx + 1}</span>
                    <span className="truncate max-w-[80px] opacity-75">{card.title.replace("\n", " ")}</span>
                  </button>
                ))}
              </div>

              {/* Selected Card Editor */}
              {currentCard && (
                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                      Editing Card {selectedCardIdx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCard(selectedCardIdx, -1)}
                        disabled={selectedCardIdx === 0}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                        title="Move left"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveCard(selectedCardIdx, 1)}
                        disabled={selectedCardIdx === config.cards.length - 1}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                        title="Move right"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCard(selectedCardIdx)}
                        className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
                        title="Delete card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Title (use \n for linebreak)</label>
                      <input
                        type="text"
                        value={currentCard.title}
                        onChange={(e) => updateCard(selectedCardIdx, { title: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Subtitle / Badge</label>
                      <input
                        type="text"
                        value={currentCard.subtitle}
                        onChange={(e) => updateCard(selectedCardIdx, { subtitle: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Search Query / Target Route</label>
                      <input
                        type="text"
                        value={currentCard.searchQuery}
                        onChange={(e) => updateCard(selectedCardIdx, { searchQuery: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Graphic / Icon Style</label>
                      <select
                        value={currentCard.graphicType}
                        onChange={(e) => updateCard(selectedCardIdx, { graphicType: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      >
                        <option value="coupon">Yellow Discount Tickets (% %)</option>
                        <option value="cupcake">Treat Cupcakes (🧁 🍰)</option>
                        <option value="badge150">Gold Round Badge (MIN. ₹150 OFF)</option>
                        <option value="priceCrash">Price Crash Pill (PRICE CRASH)</option>
                        <option value="emoji">Custom Emoji</option>
                        <option value="custom_image">Custom Image URL</option>
                      </select>
                    </div>
                  </div>

                  {currentCard.graphicType === "emoji" && (
                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Custom Emoji (e.g. 🍕🔥)</label>
                      <input
                        type="text"
                        value={currentCard.customEmoji || ""}
                        onChange={(e) => updateCard(selectedCardIdx, { customEmoji: e.target.value })}
                        placeholder="🍔🎉"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {currentCard.graphicType === "custom_image" && (
                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Custom Image or Icon URL</label>
                      <input
                        type="text"
                        value={currentCard.customImage || ""}
                        onChange={(e) => updateCard(selectedCardIdx, { customImage: e.target.value })}
                        placeholder="https://... or /assets/..."
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Card Gradient Colors */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Card Background Gradient</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Top Color", "Middle Color", "Bottom Color"].map((label, cIdx) => (
                        <div key={cIdx} className="space-y-1">
                          <span className="text-[10px] text-slate-500">{label}</span>
                          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
                            <input
                              type="color"
                              value={currentCard.gradient?.[cIdx] || "#E91E63"}
                              onChange={(e) => {
                                const newG = [...(currentCard.gradient || ["#E91E63", "#C2185B", "#880E4F"])];
                                newG[cIdx] = e.target.value;
                                updateCard(selectedCardIdx, { gradient: newG });
                              }}
                              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={currentCard.gradient?.[cIdx] || ""}
                              onChange={(e) => {
                                const newG = [...(currentCard.gradient || ["#E91E63", "#C2185B", "#880E4F"])];
                                newG[cIdx] = e.target.value;
                                updateCard(selectedCardIdx, { gradient: newG });
                              }}
                              className="w-full bg-transparent text-[11px] text-slate-300 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RADIUS & BORDERS STUDIO */}
          {activeTab === "borders_radius" && (
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-pink-400" />
                    Radius & Borders Studio
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Control corner curvature (border-radius) and border outlines across all banner components.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          containerRadius: 0,
                          cardRadius: 20,
                          buttonRadius: 20,
                          pillRadius: 24,
                          showcaseCardRadius: 16,
                          cardBorderWidth: 1.2,
                          containerBorderWidth: 0,
                          buttonBorderWidth: 1.2,
                          showcaseCardBorderWidth: 1,
                        },
                      }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-pink-500 hover:text-white transition"
                  >
                    Rounded (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          containerRadius: 0,
                          cardRadius: 8,
                          buttonRadius: 8,
                          pillRadius: 8,
                          showcaseCardRadius: 8,
                          cardBorderWidth: 1,
                          containerBorderWidth: 0,
                          buttonBorderWidth: 1,
                          showcaseCardBorderWidth: 1,
                        },
                      }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-pink-500 hover:text-white transition"
                  >
                    Sharp / Crisp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          containerRadius: 24,
                          cardRadius: 28,
                          buttonRadius: 24,
                          pillRadius: 28,
                          showcaseCardRadius: 22,
                          cardBorderWidth: 1.5,
                          containerBorderWidth: 1,
                          buttonBorderWidth: 1.5,
                          showcaseCardBorderWidth: 1.2,
                        },
                      }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-pink-500 hover:text-white transition"
                  >
                    Ultra Curvy
                  </button>
                </div>
              </div>

              {/* SECTION 1: CORNER RADIUS (CURVATURE) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Corner Radii (Curves in pixels)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Offer Cards Radius */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Offer Cards Radius</span>
                      <span className="font-mono text-pink-400 font-bold">{config.theme?.cardRadius ?? 20}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="36"
                        step="1"
                        value={config.theme?.cardRadius ?? 20}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, cardRadius: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 accent-pink-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="36"
                        value={config.theme?.cardRadius ?? 20}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, cardRadius: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Curvature of the horizontal scrollable offer cards.</p>
                  </div>

                  {/* Showcase Cards Radius */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Showcase Food Items Radius</span>
                      <span className="font-mono text-pink-400 font-bold">{config.theme?.showcaseCardRadius ?? 16}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="1"
                        value={config.theme?.showcaseCardRadius ?? 16}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, showcaseCardRadius: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 accent-pink-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="32"
                        value={config.theme?.showcaseCardRadius ?? 16}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, showcaseCardRadius: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Curvature of the mini food item showcase cards.</p>
                  </div>

                  {/* CTA Button Radius */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Order Now CTA Button Radius</span>
                      <span className="font-mono text-pink-400 font-bold">{config.theme?.buttonRadius ?? 20}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="1"
                        value={config.theme?.buttonRadius ?? 20}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, buttonRadius: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 accent-pink-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="32"
                        value={config.theme?.buttonRadius ?? 20}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, buttonRadius: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Curvature of the header banner CTA pill.</p>
                  </div>

                  {/* Filter Pills Radius */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Filter Pills Bar Radius</span>
                      <span className="font-mono text-pink-400 font-bold">{config.theme?.pillRadius ?? 24}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="1"
                        value={config.theme?.pillRadius ?? 24}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, pillRadius: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 accent-pink-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="32"
                        value={config.theme?.pillRadius ?? 24}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, pillRadius: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Curvature of the tabs pill switch container.</p>
                  </div>

                  {/* Container Outer Radius */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Banner Container Radius (Outer Canvas)</span>
                      <span className="font-mono text-pink-400 font-bold">{config.theme?.containerRadius ?? 0}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={config.theme?.containerRadius ?? 0}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, containerRadius: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 accent-pink-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={config.theme?.containerRadius ?? 0}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, containerRadius: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Set to 0px for full-bleed banner, or 16-24px for rounded card enclosure.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BORDERS (WIDTH & COLOR) */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Border Outlines & Widths
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Border */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="text-xs font-bold text-white">Offer Cards Border</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          max="6"
                          value={config.theme?.cardBorderWidth ?? 1.2}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, cardBorderWidth: Number(e.target.value) || 0 },
                            }))
                          }
                          className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Color</label>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5">
                          <input
                            type="color"
                            value={config.theme?.cardBorderColor?.slice(0, 7) || "#FF80AB"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, cardBorderColor: e.target.value },
                              }))
                            }
                            className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={config.theme?.cardBorderColor || "#FF80AB66"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, cardBorderColor: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-[10px] text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Showcase Item Border */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="text-xs font-bold text-white">Showcase Food Items Border</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          max="6"
                          value={config.theme?.showcaseCardBorderWidth ?? 1}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, showcaseCardBorderWidth: Number(e.target.value) || 0 },
                            }))
                          }
                          className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Color</label>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5">
                          <input
                            type="color"
                            value={config.theme?.showcaseCardBorderColor?.slice(0, 7) || "#E2E8F0"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, showcaseCardBorderColor: e.target.value },
                              }))
                            }
                            className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={config.theme?.showcaseCardBorderColor || "#E2E8F0"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, showcaseCardBorderColor: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-[10px] text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button Border */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="text-xs font-bold text-white">Order Now CTA Button Border</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          max="6"
                          value={config.theme?.buttonBorderWidth ?? 1.2}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, buttonBorderWidth: Number(e.target.value) || 0 },
                            }))
                          }
                          className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Color</label>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5">
                          <input
                            type="color"
                            value={config.theme?.buttonBorderColor?.slice(0, 7) || "#FF5200"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, buttonBorderColor: e.target.value },
                              }))
                            }
                            className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={config.theme?.buttonBorderColor || "#FF5200CC"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, buttonBorderColor: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-[10px] text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Outer Container Border */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="text-xs font-bold text-white">Banner Container Border</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="8"
                          value={config.theme?.containerBorderWidth ?? 0}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, containerBorderWidth: Number(e.target.value) || 0 },
                            }))
                          }
                          className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Color</label>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5">
                          <input
                            type="color"
                            value={config.theme?.containerBorderColor?.slice(0, 7) || "#FF80AB"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, containerBorderColor: e.target.value },
                              }))
                            }
                            className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={config.theme?.containerBorderColor || "#FF80AB33"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, containerBorderColor: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-[10px] text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASCOTS & FESTIVE ICONS (REDESIGNED STUDIO UI/UX) */}
          {activeTab === "mascots" && (
            <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
              {/* 1. Header with Live Visual Stage */}
              <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-r from-slate-950 via-pink-950/20 to-slate-950 p-4 shadow-lg shadow-pink-950/20">
                <div className="absolute -top-12 left-1/2 h-20 w-48 -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Mascot Live Preview */}
                  <div className="flex items-center gap-3">
                    <div
                      className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 shadow-md ring-2 ring-pink-500/40 shrink-0"
                      style={{
                        width: `${config.leftMascot?.size || 46}px`,
                        height: `${config.leftMascot?.size || 46}px`,
                        backgroundColor: config.leftMascot?.starburstColor || "#E91E634D",
                      }}
                    >
                      {config.leftMascot?.value?.startsWith("http") ? (
                        <img src={config.leftMascot.value} alt="Left" className="h-7 w-7 object-contain" />
                      ) : (
                        <span className="text-xl sm:text-2xl select-none">{config.leftMascot?.value || "🍟🎷"}</span>
                      )}
                      {config.leftMascot?.enabled === false && (
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white shadow">
                          OFF
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Left Mascot</div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        {config.leftMascot?.enabled !== false ? "Visible in Header" : "Hidden"}
                      </div>
                    </div>
                  </div>

                  {/* Center Live Badge + Actions */}
                  <div className="flex flex-col items-center justify-center py-1">
                    <div className="flex items-center gap-2 rounded-full border border-pink-500/40 bg-slate-900/90 px-3.5 py-1 shadow-inner">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Live Banner</span>
                      <span className="text-xs font-black tracking-wider text-yellow-400">{config.title || "FLAVOURFEST"}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            leftMascot: { ...prev.rightMascot },
                            rightMascot: { ...prev.leftMascot },
                          }));
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-pink-500/50 hover:text-pink-300 transition"
                        title="Swap Left and Right Mascots"
                      >
                        <ArrowLeftRight className="h-2.5 w-2.5 text-pink-400" /> Swap Pair
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const bothOff = config.leftMascot?.enabled === false && config.rightMascot?.enabled === false;
                          setConfig((prev) => ({
                            ...prev,
                            leftMascot: { ...prev.leftMascot, enabled: bothOff },
                            rightMascot: { ...prev.rightMascot, enabled: bothOff },
                          }));
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-pink-500/50 hover:text-pink-300 transition"
                      >
                        {config.leftMascot?.enabled === false && config.rightMascot?.enabled === false ? "Enable Both" : "Hide Both"}
                      </button>
                    </div>
                  </div>

                  {/* Right Mascot Live Preview */}
                  <div className="flex items-center gap-3 sm:flex-row-reverse sm:text-right">
                    <div
                      className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 shadow-md ring-2 ring-pink-500/40 shrink-0"
                      style={{
                        width: `${config.rightMascot?.size || 46}px`,
                        height: `${config.rightMascot?.size || 46}px`,
                        backgroundColor: config.rightMascot?.starburstColor || "#E91E634D",
                      }}
                    >
                      {config.rightMascot?.value?.startsWith("http") ? (
                        <img src={config.rightMascot.value} alt="Right" className="h-7 w-7 object-contain" />
                      ) : (
                        <span className="text-xl sm:text-2xl select-none">{config.rightMascot?.value || "🍔🎉"}</span>
                      )}
                      {config.rightMascot?.enabled === false && (
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white shadow">
                          OFF
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Right Mascot</div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        {config.rightMascot?.enabled !== false ? "Visible in Header" : "Hidden"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Curated Festive Pairs (Grid with Active Highlights) */}
              <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-pink-400" /> Curated Festive Pairs
                  </span>
                  <span className="text-[10px] text-slate-400">Click any pair for instant preview</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {MASCOT_PRESET_PAIRS.map((pair, pIdx) => {
                    const isCurrent =
                      config.leftMascot?.value === pair.left &&
                      config.rightMascot?.value === pair.right;

                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            leftMascot: { ...prev.leftMascot, value: pair.left, enabled: true },
                            rightMascot: { ...prev.rightMascot, value: pair.right, enabled: true },
                          }));
                          setLeftMascotMode("emoji");
                          setRightMascotMode("emoji");
                        }}
                        className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                          isCurrent
                            ? "border-pink-500 bg-pink-500/15 ring-1 ring-pink-500/40 shadow-sm"
                            : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="text-lg leading-tight tracking-tight transition-transform group-hover:scale-110">
                          {pair.left} {pair.right}
                        </div>
                        <span className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-300">
                          {pair.name}
                        </span>
                        {isCurrent && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Left & Right Mascot Configuration Studio */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* LEFT MASCOT CARD */}
                <div className="space-y-3.5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  {/* Card Header & iOS Switch */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm shrink-0 shadow-inner"
                        style={{ backgroundColor: config.leftMascot?.starburstColor || "#E91E634D" }}
                      >
                        {config.leftMascot?.value?.startsWith("http") ? (
                          <img src={config.leftMascot.value} alt="" className="h-4 w-4 object-contain" />
                        ) : (
                          <span>{config.leftMascot?.value || "🍟🎷"}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-pink-400">Left Mascot</span>
                        <p className="text-[10px] text-slate-400">Positioned before title</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          leftMascot: {
                            ...config.leftMascot,
                            enabled: config.leftMascot?.enabled === false ? true : false,
                          },
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.leftMascot?.enabled !== false ? "bg-pink-600" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          config.leftMascot?.enabled !== false ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mode Tabs: Emoji vs Image */}
                  <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setLeftMascotMode("emoji")}
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                        leftMascotMode === "emoji"
                          ? "bg-slate-800 text-pink-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Festive Emojis
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftMascotMode("image")}
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                        leftMascotMode === "image"
                          ? "bg-slate-800 text-pink-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Custom Image URL
                    </button>
                  </div>

                  {/* Emoji Mode Controls */}
                  {leftMascotMode === "emoji" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                          <span>Emoji Combo Sequence</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Array.from(config.leftMascot?.value || "");
                                cur.pop();
                                setConfig({
                                  ...config,
                                  leftMascot: { ...config.leftMascot, value: cur.join("") || "🍟" },
                                });
                              }}
                              className="text-[10px] text-slate-400 hover:text-pink-400 transition"
                            >
                              ⌫ Backspace
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  leftMascot: { ...config.leftMascot, value: "" },
                                })
                              }
                              className="text-[10px] text-slate-400 hover:text-pink-400 transition"
                            >
                              ✕ Clear
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={config.leftMascot?.value || "🍟🎷"}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              leftMascot: { ...config.leftMascot, value: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold tracking-wider text-white focus:border-pink-500 focus:outline-none"
                        />
                      </div>

                      {/* Clean Grouped Emoji Palette */}
                      <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                        {EMOJI_PALETTES.map((palette, catIdx) => (
                          <div key={catIdx}>
                            <span className="text-[10px] font-medium text-slate-400 block mb-1">
                              {palette.category}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {palette.items.map((em, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const cur = config.leftMascot?.value || "";
                                    setConfig({
                                      ...config,
                                      leftMascot: { ...config.leftMascot, value: cur + em },
                                    });
                                  }}
                                  className="h-7 w-7 rounded-lg bg-slate-800/80 text-sm hover:bg-slate-700 hover:scale-110 active:scale-95 transition flex items-center justify-center select-none"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Mode Controls */}
                  {leftMascotMode === "image" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-slate-400">Image Asset URL</label>
                      <input
                        type="text"
                        value={config.leftMascot?.value?.startsWith("http") ? config.leftMascot.value : ""}
                        placeholder="https://... or /assets/..."
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            leftMascot: {
                              ...config.leftMascot,
                              value: e.target.value || "🍟🎷",
                              type: e.target.value ? "image" : "emoji",
                            },
                          })
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        Transparent PNG, SVG, or WebP illustrations work best.
                      </p>
                    </div>
                  )}

                  {/* Starburst Color & Size Controls */}
                  <div className="border-t border-slate-800/80 pt-3 space-y-3">
                    {/* Starburst Glow Color Swatches */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                        <span>Starburst Glow Color</span>
                        <span className="text-[10px] font-mono text-slate-300">{config.leftMascot?.starburstColor || "#E91E634D"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {GLOW_COLOR_PRESETS.map((swatch, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                leftMascot: { ...config.leftMascot, starburstColor: swatch.value },
                              })
                            }
                            className={`h-6 w-6 rounded-full border border-black/30 transition-transform hover:scale-110 ${
                              config.leftMascot?.starburstColor === swatch.value
                                ? "ring-2 ring-pink-400 scale-105"
                                : ""
                            }`}
                            style={{ backgroundColor: swatch.color }}
                            title={swatch.name}
                          />
                        ))}
                        <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-300 hover:border-slate-500">
                          +
                          <input
                            type="color"
                            value={config.leftMascot?.starburstColor?.substring(0, 7) || "#E91E63"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                leftMascot: { ...config.leftMascot, starburstColor: `${e.target.value}4D` },
                              })
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Circle Size Segmented Control */}
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Circle Size</span>
                      <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
                        {[
                          { label: "Compact", size: 38 },
                          { label: "Standard", size: 46 },
                          { label: "Prominent", size: 54 },
                        ].map((sz) => {
                          const isActive = (config.leftMascot?.size || 46) === sz.size;
                          return (
                            <button
                              key={sz.size}
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  leftMascot: { ...config.leftMascot, size: sz.size },
                                })
                              }
                              className={`rounded py-1 text-center text-[10px] font-semibold transition ${
                                isActive
                                  ? "bg-pink-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {sz.label} ({sz.size}px)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT MASCOT CARD */}
                <div className="space-y-3.5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  {/* Card Header & iOS Switch */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm shrink-0 shadow-inner"
                        style={{ backgroundColor: config.rightMascot?.starburstColor || "#E91E634D" }}
                      >
                        {config.rightMascot?.value?.startsWith("http") ? (
                          <img src={config.rightMascot.value} alt="" className="h-4 w-4 object-contain" />
                        ) : (
                          <span>{config.rightMascot?.value || "🍔🎉"}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-pink-400">Right Mascot</span>
                        <p className="text-[10px] text-slate-400">Positioned after title</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          rightMascot: {
                            ...config.rightMascot,
                            enabled: config.rightMascot?.enabled === false ? true : false,
                          },
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.rightMascot?.enabled !== false ? "bg-pink-600" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          config.rightMascot?.enabled !== false ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mode Tabs: Emoji vs Image */}
                  <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setRightMascotMode("emoji")}
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                        rightMascotMode === "emoji"
                          ? "bg-slate-800 text-pink-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Festive Emojis
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightMascotMode("image")}
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                        rightMascotMode === "image"
                          ? "bg-slate-800 text-pink-300 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Custom Image URL
                    </button>
                  </div>

                  {/* Emoji Mode Controls */}
                  {rightMascotMode === "emoji" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                          <span>Emoji Combo Sequence</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Array.from(config.rightMascot?.value || "");
                                cur.pop();
                                setConfig({
                                  ...config,
                                  rightMascot: { ...config.rightMascot, value: cur.join("") || "🍔" },
                                });
                              }}
                              className="text-[10px] text-slate-400 hover:text-pink-400 transition"
                            >
                              ⌫ Backspace
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  rightMascot: { ...config.rightMascot, value: "" },
                                })
                              }
                              className="text-[10px] text-slate-400 hover:text-pink-400 transition"
                            >
                              ✕ Clear
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={config.rightMascot?.value || "🍔🎉"}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              rightMascot: { ...config.rightMascot, value: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold tracking-wider text-white focus:border-pink-500 focus:outline-none"
                        />
                      </div>

                      {/* Clean Grouped Emoji Palette */}
                      <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                        {EMOJI_PALETTES.map((palette, catIdx) => (
                          <div key={catIdx}>
                            <span className="text-[10px] font-medium text-slate-400 block mb-1">
                              {palette.category}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {palette.items.map((em, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const cur = config.rightMascot?.value || "";
                                    setConfig({
                                      ...config,
                                      rightMascot: { ...config.rightMascot, value: cur + em },
                                    });
                                  }}
                                  className="h-7 w-7 rounded-lg bg-slate-800/80 text-sm hover:bg-slate-700 hover:scale-110 active:scale-95 transition flex items-center justify-center select-none"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Mode Controls */}
                  {rightMascotMode === "image" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-slate-400">Image Asset URL</label>
                      <input
                        type="text"
                        value={config.rightMascot?.value?.startsWith("http") ? config.rightMascot.value : ""}
                        placeholder="https://... or /assets/..."
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            rightMascot: {
                              ...config.rightMascot,
                              value: e.target.value || "🍔🎉",
                              type: e.target.value ? "image" : "emoji",
                            },
                          })
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        Transparent PNG, SVG, or WebP illustrations work best.
                      </p>
                    </div>
                  )}

                  {/* Starburst Color & Size Controls */}
                  <div className="border-t border-slate-800/80 pt-3 space-y-3">
                    {/* Starburst Glow Color Swatches */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                        <span>Starburst Glow Color</span>
                        <span className="text-[10px] font-mono text-slate-300">{config.rightMascot?.starburstColor || "#E91E634D"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {GLOW_COLOR_PRESETS.map((swatch, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                rightMascot: { ...config.rightMascot, starburstColor: swatch.value },
                              })
                            }
                            className={`h-6 w-6 rounded-full border border-black/30 transition-transform hover:scale-110 ${
                              config.rightMascot?.starburstColor === swatch.value
                                ? "ring-2 ring-pink-400 scale-105"
                                : ""
                            }`}
                            style={{ backgroundColor: swatch.color }}
                            title={swatch.name}
                          />
                        ))}
                        <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-300 hover:border-slate-500">
                          +
                          <input
                            type="color"
                            value={config.rightMascot?.starburstColor?.substring(0, 7) || "#E91E63"}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                rightMascot: { ...config.rightMascot, starburstColor: `${e.target.value}4D` },
                              })
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Circle Size Segmented Control */}
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Circle Size</span>
                      <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
                        {[
                          { label: "Compact", size: 38 },
                          { label: "Standard", size: 46 },
                          { label: "Prominent", size: 54 },
                        ].map((sz) => {
                          const isActive = (config.rightMascot?.size || 46) === sz.size;
                          return (
                            <button
                              key={sz.size}
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  rightMascot: { ...config.rightMascot, size: sz.size },
                                })
                              }
                              className={`rounded py-1 text-center text-[10px] font-semibold transition ${
                                isActive
                                  ? "bg-pink-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {sz.label} ({sz.size}px)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEADER BANNER & CTA */}
          {activeTab === "header" && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-white">Header Banner & Call-To-Action</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Festival Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Call-To-Action Button Text</label>
                  <input
                    type="text"
                    value={config.orderButtonText}
                    onChange={(e) => setConfig({ ...config, orderButtonText: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Button Search Query</label>
                  <input
                    type="text"
                    value={config.orderButtonQuery}
                    onChange={(e) => setConfig({ ...config, orderButtonQuery: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Title Face Color</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5">
                    <input
                      type="color"
                      value={config.theme.titleColor || "#FFE500"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, titleColor: e.target.value },
                        })
                      }
                      className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config.theme.titleColor || "#FFE500"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, titleColor: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR THEME */}
          {activeTab === "theme" && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-white">Color Themes & Presets</h3>

              {/* Quick Presets */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-2 block">Quick Themes</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {THEME_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(preset)}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-left text-xs text-slate-300 hover:border-pink-500/50 hover:bg-slate-900"
                    >
                      <span>{preset.name}</span>
                      <div className="flex gap-1">
                        <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: preset.containerGradient[0] }} />
                        <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: preset.cardGradient[0] }} />
                        <span className="h-4 w-4 rounded-full border border-black/30" style={{ backgroundColor: preset.titleColor }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Container Gradient */}
              <div className="border-t border-slate-800 pt-3">
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Overall Background Gradient</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Top Color", "Middle Color", "Bottom Color"].map((label, cIdx) => (
                    <div key={cIdx} className="space-y-1">
                      <span className="text-[10px] text-slate-500">{label}</span>
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
                        <input
                          type="color"
                          value={config.theme.containerGradient?.[cIdx] || "#2E0016"}
                          onChange={(e) => {
                            const newG = [...(config.theme.containerGradient || ["#2E0016", "#21000F", "#19000B"])];
                            newG[cIdx] = e.target.value;
                            setConfig({
                              ...config,
                              theme: { ...config.theme, containerGradient: newG },
                            });
                          }}
                          className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          value={config.theme.containerGradient?.[cIdx] || ""}
                          onChange={(e) => {
                            const newG = [...(config.theme.containerGradient || ["#2E0016", "#21000F", "#19000B"])];
                            newG[cIdx] = e.target.value;
                            setConfig({
                              ...config,
                              theme: { ...config.theme, containerGradient: newG },
                            });
                          }}
                          className="w-full bg-transparent text-[11px] text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button & Border Colors */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Order Button Border</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
                    <input
                      type="color"
                      value={config.theme.buttonBorderColor?.substring(0, 7) || "#FF5200"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, buttonBorderColor: e.target.value },
                        })
                      }
                      className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config.theme.buttonBorderColor || "#FF5200"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, buttonBorderColor: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Card Border Stroke</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
                    <input
                      type="color"
                      value={config.theme.cardBorderColor?.substring(0, 7) || "#FF80AB"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, cardBorderColor: e.target.value },
                        })
                      }
                      className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config.theme.cardBorderColor || "#FF80AB"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, cardBorderColor: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FILTER PILLS */}
          {activeTab === "filters" && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-white">Filter Bar Pills</h3>
              <p className="text-xs text-slate-400">
                Configure the two pill switcher tabs displayed below the offer cards.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Tab 1 Label (Default: TOP RATED)</label>
                  <input
                    type="text"
                    value={config.filterTabs?.[0]?.label || "TOP RATED"}
                    onChange={(e) => {
                      const copy = [...(config.filterTabs || [{ id: "tab_1", label: "TOP RATED", filterType: "popular" }])];
                      copy[0] = { ...copy[0], label: e.target.value };
                      setConfig({ ...config, filterTabs: copy });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Tab 2 Label (Default: FOOD IN 15 MINS)</label>
                  <input
                    type="text"
                    value={config.filterTabs?.[1]?.label || "FOOD IN 15 MINS"}
                    onChange={(e) => {
                      const copy = [...(config.filterTabs || [{ id: "tab_1", label: "TOP RATED", filterType: "popular" }, { id: "tab_2", label: "FOOD IN 15 MINS", filterType: "discounted" }])];
                      copy[1] = { ...copy[1], label: e.target.value };
                      setConfig({ ...config, filterTabs: copy });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-time Live Mobile Simulator (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Eye className="h-3.5 w-3.5 text-pink-400" />
                Live Mobile Device Simulator
              </span>
              <span className="text-[10px] text-slate-500">Real-time Preview</span>
            </div>

            {/* Mobile Frame */}
            <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] border-4 border-slate-800 bg-[#0d0208] shadow-inner">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 pt-2 text-[10px] text-slate-400">
                <span>9:41</span>
                <span className="flex gap-1">⚡ 100%</span>
              </div>

              {/* Simulated FlavourFest Component */}
              <div
                className="py-3 px-2 transition-all duration-300"
                style={{
                  background: `linear-gradient(to bottom, ${config.theme?.containerGradient?.[0] || "#2E0016"}, ${config.theme?.containerGradient?.[1] || "#21000F"}, ${config.theme?.containerGradient?.[2] || "#19000B"})`,
                  borderRadius: `${config.theme?.containerRadius ?? 0}px`,
                  border: config.theme?.containerBorderWidth
                    ? `${config.theme.containerBorderWidth}px solid ${config.theme.containerBorderColor || "transparent"}`
                    : undefined,
                }}
              >
                {/* 1. Header with Mascots & 3D Title */}
                <div className="flex items-center justify-between px-1">
                  {/* Left Mascot */}
                  {config.leftMascot?.enabled !== false ? (
                    <div
                      className="flex items-center justify-center rounded-full text-xl transition-all shrink-0"
                      style={{
                        width: `${config.leftMascot?.size || 40}px`,
                        height: `${config.leftMascot?.size || 40}px`,
                        backgroundColor: config.leftMascot?.starburstColor || "#E91E634D",
                      }}
                    >
                      {config.leftMascot?.value?.startsWith("http") ? (
                        <img src={config.leftMascot.value} alt="Mascot" className="h-7 w-7 object-contain" />
                      ) : (
                        config.leftMascot?.value || "🍟🎷"
                      )}
                    </div>
                  ) : (
                    <div className="w-10" />
                  )}

                  {/* Center Title & Order Button */}
                  <div className="text-center flex-1 mx-2">
                    <h2
                      className="font-black text-xl tracking-wider leading-none"
                      style={{
                        color: config.theme?.titleColor || "#FFE500",
                        textShadow: `0 2px 0 ${config.theme?.titleStrokeColor || "#9E4B00"}, 0 4px 6px ${config.theme?.titleShadowColor || "#5A001F"}`,
                      }}
                    >
                      {config.title || "FLAVOURFEST"}
                    </h2>

                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: config.theme?.buttonBgColor || "#1F010D",
                        borderColor: config.theme?.buttonBorderColor || "#FF5200CC",
                        color: config.theme?.buttonTextColor || "#FFD54F",
                        borderWidth: `${config.theme?.buttonBorderWidth ?? 1.2}px`,
                        borderRadius: `${config.theme?.buttonRadius ?? 20}px`,
                      }}
                    >
                      <span>{config.orderButtonText || "ORDER NOW"}</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Right Mascot */}
                  {config.rightMascot?.enabled !== false ? (
                    <div
                      className="flex items-center justify-center rounded-full text-xl transition-all shrink-0"
                      style={{
                        width: `${config.rightMascot?.size || 40}px`,
                        height: `${config.rightMascot?.size || 40}px`,
                        backgroundColor: config.rightMascot?.starburstColor || "#E91E634D",
                      }}
                    >
                      {config.rightMascot?.value?.startsWith("http") ? (
                        <img src={config.rightMascot.value} alt="Mascot" className="h-7 w-7 object-contain" />
                      ) : (
                        config.rightMascot?.value || "🍔🎉"
                      )}
                    </div>
                  ) : (
                    <div className="w-10" />
                  )}
                </div>

                {/* 2. Horizontal Scrollable Cards */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
                  {config.cards.map((card, idx) => {
                    const gradientColors = card.gradient || ["#E91E63", "#C2185B", "#880E4F"];
                    return (
                      <div
                        key={card.id || idx}
                        onClick={() => setSelectedCardIdx(idx)}
                        className={`flex h-36 w-24 shrink-0 flex-col items-center justify-between p-2 cursor-pointer transition-transform hover:scale-105 ${
                          selectedCardIdx === idx ? "ring-2 ring-white" : ""
                        }`}
                        style={{
                          background: `linear-gradient(to bottom, ${gradientColors[0]}, ${gradientColors[1] || gradientColors[0]}, ${gradientColors[2] || gradientColors[0]})`,
                          border: `${config.theme?.cardBorderWidth ?? 1.2}px solid ${config.theme?.cardBorderColor || "#FF80AB66"}`,
                          borderRadius: `${config.theme?.cardRadius ?? 20}px`,
                          boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Title */}
                        <span
                          className="text-center text-[10px] font-black leading-tight whitespace-pre-line drop-shadow"
                          style={{
                            color:
                              card.textColor ||
                              (gradientColors[0]?.toLowerCase() === "#ffffff" || gradientColors[0]?.toLowerCase() === "#fff"
                                ? "#0F172A"
                                : "#FFFFFF"),
                          }}
                        >
                          {card.title}
                        </span>

                        {/* Graphic */}
                        <div className="my-auto flex items-center justify-center">
                          {card.graphicType === "coupon" && (
                            <div className="flex gap-0.5">
                              <div className="h-9 w-6 rounded bg-yellow-400 text-amber-800 text-[10px] font-black flex items-center justify-center shadow">
                                %
                              </div>
                              <div className="h-9 w-6 rounded bg-yellow-400 text-amber-800 text-[10px] font-black flex items-center justify-center shadow">
                                %
                              </div>
                            </div>
                          )}

                          {card.graphicType === "cupcake" && (
                            <span className="text-2xl leading-none">🧁🍰</span>
                          )}

                          {card.graphicType === "badge150" && (
                            <div className="h-11 w-11 rounded-full border border-amber-300 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-950 flex flex-col items-center justify-center text-white shadow-md">
                              <span className="text-[6px] font-bold">MIN.</span>
                              <span className="text-[10px] font-black leading-none">₹150</span>
                              <span className="text-[6px] font-bold">OFF</span>
                            </div>
                          )}

                          {card.graphicType === "priceCrash" && (
                            <div className="rounded border border-pink-400 bg-black/80 px-1 py-0.5 text-center text-[8px] font-black text-white">
                              <div>PRICE</div>
                              <div className="text-yellow-300">CRASH</div>
                            </div>
                          )}

                          {card.graphicType === "emoji" && (
                            <span className="text-2xl leading-none">{card.customEmoji || "🎁"}</span>
                          )}

                          {card.graphicType === "custom_image" && card.customImage && (
                            <img src={card.customImage} alt="Card icon" className="h-10 w-10 object-contain" />
                          )}
                        </div>

                        {/* Subtitle / Bottom hint */}
                        <span
                          className="text-[8px] font-bold truncate max-w-full"
                          style={{
                            color:
                              card.textColor ||
                              (gradientColors[0]?.toLowerCase() === "#ffffff" || gradientColors[0]?.toLowerCase() === "#fff"
                                ? "#475569"
                                : "rgba(255,255,255,0.9)"),
                          }}
                        >
                          {card.subtitle}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Filter Pills */}
                <div className="mt-3 px-1">
                  <div
                    className="flex h-9 items-center p-1 transition-all"
                    style={{
                      backgroundColor: config.theme?.pillBarBgColor || "#F1F3F5",
                      borderRadius: `${config.theme?.pillRadius ?? 24}px`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewFilterIdx(0)}
                      className={`flex-1 py-1 text-center text-[10px] font-bold transition cursor-pointer ${
                        previewFilterIdx === 0
                          ? "bg-white text-[#FF5200] shadow"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      style={{
                        borderRadius: `${Math.max(0, (config.theme?.pillRadius ?? 24) - 4)}px`,
                      }}
                    >
                      {config.filterTabs?.[0]?.label || "TOP RATED"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilterIdx(1)}
                      className={`flex-1 py-1 text-center text-[10px] font-bold transition cursor-pointer ${
                        previewFilterIdx === 1
                          ? "bg-white text-[#FF5200] shadow"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      style={{
                        borderRadius: `${Math.max(0, (config.theme?.pillRadius ?? 24) - 4)}px`,
                      }}
                    >
                      {config.filterTabs?.[1]?.label || "FOOD IN 15 MINS"}
                    </button>
                  </div>
                </div>

                {/* 4. Mini Item Cards Showcase (DYNAMIC) */}
                <div className="mt-3 flex gap-2 overflow-x-auto px-1 no-scrollbar pb-1">
                  {(() => {
                    const activeTabId =
                      config.filterTabs?.[previewFilterIdx]?.id ||
                      (previewFilterIdx === 0 ? "tab_1" : "tab_2");
                    const filtered = (config.showcaseItems || []).filter(
                      (it) => !it.tabId || it.tabId === "all" || it.tabId === activeTabId
                    );
                    const list = filtered.length > 0 ? filtered : config.showcaseItems || [];
                    return list.map((it, idx) => {
                      const displayImg =
                        it.image && !it.image.startsWith("assets/") ? it.image : null;
                      return (
                        <div
                          key={it.id || idx}
                          className="relative h-28 w-24 shrink-0 shadow-sm p-1.5 flex flex-col justify-between transition-all"
                          style={{
                            borderRadius: `${config.theme?.showcaseCardRadius ?? 16}px`,
                            border: `${config.theme?.showcaseCardBorderWidth ?? 1}px solid ${config.theme?.showcaseCardBorderColor || "#E2E8F0"}`,
                            backgroundColor: config.theme?.showcaseCardBgColor || "#FFFFFF",
                          }}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[7px] font-bold text-slate-700 truncate max-w-[55px] leading-tight">
                              {it.name}
                            </span>
                            <span className="text-slate-400 text-[10px]">🤍</span>
                          </div>
                          <div className="my-auto flex items-center justify-center">
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={it.name}
                                className="h-10 w-10 object-contain rounded"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="text-center text-2xl">{it.emoji || "🍰"}</div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-black/85 px-1 py-0.5 text-[7px] font-black text-white whitespace-pre-line text-center leading-none">
                              {it.badge || `AT ₹${it.price}`}
                            </span>
                            {it.adBadge !== false && (
                              <span className="rounded bg-black/50 px-1 text-[6px] text-white/90">
                                AD
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="h-4 bg-black flex justify-center items-center">
                <div className="h-1 w-20 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar for Instant Saving */}
      <div className="fixed bottom-5 right-8 z-50 flex items-center gap-3 rounded-2xl border border-pink-500/40 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <span className="text-xs text-slate-300 hidden sm:inline">
          {statusMessage || "Configure radii & theme colors here"}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-600/40 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 transition"
        >
          {saving ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving..." : "Save Changes to CXP & Real App"}
        </button>
      </div>
    </div>
  );
}
