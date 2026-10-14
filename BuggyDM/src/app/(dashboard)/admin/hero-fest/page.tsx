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
  ExternalLink,
  Eye,
  Store,
  UploadCloud,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  Image as ImageIcon,
  Smile,
  X,
} from "lucide-react";

interface SponsorTag {
  label: string;
  name: string;
  badgeColor: string;
}

interface DealsZoneConfig {
  title: string;
  badgeText: string;
  itemId?: number | null;
  itemName: string;
  itemImage: string;
  originalPrice: number;
  discountedPrice: number;
  unit?: string;
}

interface MiniDealCardConfig {
  id: string;
  title: string;
  priceText: string;
  emoji: string;
  image?: string;
  searchKeyword: string;
}

interface HeroFestConfig {
  enabled: boolean;
  title: string;
  headerEmoji: string;
  sponsors: SponsorTag[];
  dealsZone: DealsZoneConfig;
  miniCards: MiniDealCardConfig[];
  updatedAt?: string;
}

const DEFAULT_CONFIG: HeroFestConfig = {
  enabled: true,
  title: "Hot Sips & Snack Fest",
  headerEmoji: "🫖",
  sponsors: [
    { label: "Powered By", name: "Red Label", badgeColor: "#DC2626" },
    { label: "", name: "Maggi", badgeColor: "#D97706" },
    { label: "Co-powered By", name: "Nescafe", badgeColor: "#78350F" },
  ],
  dealsZone: {
    title: "Deals Zone",
    badgeText: "PURE COW GHEE",
    itemId: null,
    itemName: "Aashirvaad Svasti Cow Ghee",
    itemImage: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&auto=format&fit=crop&q=80",
    originalPrice: 185,
    discountedPrice: 86,
    unit: "500 ml",
  },
  miniCards: [
    {
      id: "card_1",
      title: "Hot Sips & Mixes",
      priceText: "Starts at ₹40",
      emoji: "☕",
      image: "",
      searchKeyword: "tea coffee",
    },
    {
      id: "card_2",
      title: "Frozen Bites",
      priceText: "Starts at ₹129",
      emoji: "🍟",
      image: "",
      searchKeyword: "frozen snacks",
    },
    {
      id: "card_3",
      title: "Munch & Slurp",
      priceText: "Starts at ₹15",
      emoji: "🍜",
      image: "",
      searchKeyword: "noodles pasta",
    },
    {
      id: "card_4",
      title: "Cookies & Cake",
      priceText: "Starts at ₹15",
      emoji: "🍪",
      image: "",
      searchKeyword: "biscuits cookies",
    },
  ],
};

interface SearchProduct {
  id: number;
  name: string;
  price: number;
  discount: number;
  discountedPrice: number;
  image: string;
}

export default function HeroFestManagerPage() {
  const [config, setConfig] = useState<HeroFestConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Mini Card Upload State
  const [uploadingCardIdx, setUploadingCardIdx] = useState<number | null>(null);
  const cardFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mini Card Product Picker State
  const [miniCardSearchIdx, setMiniCardSearchIdx] = useState<number | null>(null);
  const [miniCardSearchQuery, setMiniCardSearchQuery] = useState("");
  const [miniCardSearchResults, setMiniCardSearchResults] = useState<SearchProduct[]>([]);
  const [miniCardSearching, setMiniCardSearching] = useState(false);

  const fetchMiniCardProducts = async (q: string = "") => {
    setMiniCardSearching(true);
    try {
      let res = await fetch(`/BuggyDm/api/admin/products/search?q=${encodeURIComponent(q)}`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`);
      }
      if (res.ok) {
        const json = await res.json();
        setMiniCardSearchResults(json.data || []);
      }
    } catch (err) {
      console.error("Mini card product search error:", err);
    } finally {
      setMiniCardSearching(false);
    }
  };

  const applyProductToMiniCard = (idx: number, prod: SearchProduct) => {
    setConfig((prev) => {
      const copy = [...prev.miniCards];
      copy[idx] = {
        ...copy[idx],
        image: prod.image || copy[idx].image || "",
        priceText: `Starts at ₹${prod.discountedPrice}`,
        searchKeyword: prod.name,
      };
      return { ...prev, miniCards: copy };
    });
    setMiniCardSearchIdx(null);
    setMiniCardSearchQuery("");
    setMessage({
      type: "success",
      text: `Applied "${prod.name}" to Card #${idx + 1}! (Image, badge price, and keyword updated)`,
    });
    setTimeout(() => setMessage(null), 3500);
  };

  // Deals Zone Image Upload State
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setShowProductDropdown(true);
      }
    } catch (err) {
      console.error("Product search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image file is too large (max 10MB)." });
      return;
    }

    setIsUploading(true);
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
        setConfig((prev) => ({
          ...prev,
          dealsZone: {
            ...prev.dealsZone,
            itemImage: data.url,
          },
        }));
        setMessage({ type: "success", text: "Product image uploaded successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image." });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Network error while uploading image." });
    } finally {
      setIsUploading(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const uploadMiniCardFile = async (cardIndex: number, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Card image file is too large (max 10MB)." });
      return;
    }
    setUploadingCardIdx(cardIndex);
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
        updateMiniCard(cardIndex, "image", data.url);
        setMessage({ type: "success", text: `Card #${cardIndex + 1} image uploaded successfully!` });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image." });
      }
    } catch (err) {
      console.error("Card image upload error:", err);
      setMessage({ type: "error", text: "Network error uploading card image." });
    } finally {
      setUploadingCardIdx(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Fetch initial config
  useEffect(() => {
    async function loadConfig() {
      try {
        let res = await fetch("/BuggyDm/api/grocery/hero-fest");
        if (!res.ok && res.status === 404) {
          res = await fetch("/api/grocery/hero-fest");
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConfig(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Hero Fest config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Search products debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        return;
      }
      await fetchCatalogProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mini Card Search debounce
  useEffect(() => {
    if (miniCardSearchIdx === null) return;
    const timer = setTimeout(async () => {
      await fetchMiniCardProducts(miniCardSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [miniCardSearchQuery, miniCardSearchIdx]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let res = await fetch("/BuggyDm/api/grocery/hero-fest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/grocery/hero-fest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
      }

      if (res.ok) {
        setMessage({ type: "success", text: "Hero Fest configuration saved and live in User App!" });
      } else {
        setMessage({ type: "error", text: "Failed to save configuration." });
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
    if (confirm("Reset to default Zepto-style configuration?")) {
      setConfig({ ...DEFAULT_CONFIG });
      setMessage({ type: "success", text: "Reset to default. Click 'Save & Publish' to persist." });
    }
  };

  const selectProduct = (prod: SearchProduct) => {
    setConfig((prev) => ({
      ...prev,
      dealsZone: {
        ...prev.dealsZone,
        itemId: prod.id,
        itemName: prod.name,
        originalPrice: prod.price,
        discountedPrice: prod.discountedPrice || prod.price,
        itemImage: prod.image || prev.dealsZone.itemImage,
      },
    }));
    setShowProductDropdown(false);
    setSearchQuery("");
  };

  const clearSelectedProduct = () => {
    setConfig((prev) => ({
      ...prev,
      dealsZone: {
        ...prev.dealsZone,
        itemId: null,
      },
    }));
  };

  const addSponsor = () => {
    setConfig((prev) => ({
      ...prev,
      sponsors: [...prev.sponsors, { label: "", name: "New Brand", badgeColor: "#0284C7" }],
    }));
  };

  const removeSponsor = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index),
    }));
  };

  const updateSponsor = (index: number, field: keyof SponsorTag, value: string) => {
    setConfig((prev) => {
      const copy = [...prev.sponsors];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, sponsors: copy };
    });
  };

  const updateMiniCard = (index: number, field: keyof MiniDealCardConfig, value: string) => {
    setConfig((prev) => {
      const copy = [...prev.miniCards];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, miniCards: copy };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19] text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mr-3" />
        Loading Hero Fest Configuration...
      </div>
    );
  }

  const discountPercent =
    config.dealsZone.originalPrice > 0
      ? Math.round(
          ((config.dealsZone.originalPrice - config.dealsZone.discountedPrice) /
            config.dealsZone.originalPrice) *
            100
        )
      : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080b11] text-slate-200">
      {/* Top Bar Header */}
      <div className="h-16 px-6 bg-[#0b0f19]/90 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Grocery Hero Fest Manager
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live Dynamic
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage Quick-Commerce Deals Zone, sponsors & 2x2 category tiles
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
        {/* Left Column: Live Visual Zepto-style Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Live Mobile User App Preview
            </span>
            <span className="text-[11px] text-slate-500">Real-time sync</span>
          </div>

          {/* Phone Frame Simulator */}
          <div className="bg-[#0f172a] rounded-3xl p-4 border-4 border-slate-800 shadow-2xl sticky top-24">
            {/* The Actual Quick-Commerce Card */}
            <div
              className="rounded-2xl p-3.5 border transition-all"
              style={{
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                boxShadow: "0 4px 20px -2px rgba(245, 158, 11, 0.12)",
              }}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#78350F] tracking-tight">
                    {config.title || "Hot Sips & Snack Fest"}
                  </h2>
                  {/* Sponsor Line */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {config.sponsors.map((sp, idx) => (
                      <React.Fragment key={idx}>
                        {sp.label && (
                          <span className="text-[10px] text-[#92400E] font-medium">
                            {sp.label}
                          </span>
                        )}
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: sp.badgeColor || "#DC2626" }}
                        >
                          {sp.name}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Header Icon / Emoji */}
                <div className="w-8 h-8 rounded-full bg-white/80 border border-amber-200/80 flex items-center justify-center text-xl shadow-xs">
                  {config.headerEmoji || "🫖"}
                </div>
              </div>

              {/* Main Card Content: Left Deals Zone & Right 2x2 Grid */}
              <div className="mt-3 grid grid-cols-12 gap-2.5">
                {/* Left Deals Zone Card (5 cols) */}
                <div className="col-span-5 bg-white rounded-xl p-2.5 border border-[#FDE68A] flex flex-col relative shadow-xs">
                  <span className="text-[11px] font-extrabold text-[#78350F] leading-tight">
                    {config.dealsZone.title || "Deals Zone"}
                  </span>

                  <div className="relative my-2 h-24 flex items-center justify-center">
                    {/* Ribbon Tag */}
                    {config.dealsZone.badgeText && (
                      <div className="absolute -left-2.5 top-0 bottom-0 bg-[#E11D48] text-white text-[8px] font-extrabold px-1 writing-mode-vertical flex items-center justify-center uppercase tracking-wider rounded-r">
                        <span className="[writing-mode:vertical-lr] rotate-180">
                          {config.dealsZone.badgeText}
                        </span>
                      </div>
                    )}

                    {/* Product Image */}
                    {config.dealsZone.itemImage ? (
                      <img
                        src={config.dealsZone.itemImage}
                        alt="Product"
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-3xl">🧈</div>
                    )}

                    {/* 3D Round Price Badge */}
                    <div className="absolute -right-1 bottom-0 bg-[#FFFBEB] border border-[#F59E0B] rounded-full px-2 py-0.5 shadow-sm text-center">
                      <div className="text-[8.5px] text-slate-400 line-through leading-none">
                        ₹{config.dealsZone.originalPrice}
                      </div>
                      <div className="text-[11px] font-black text-[#B45309] leading-tight">
                        ₹{config.dealsZone.discountedPrice}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-800 line-clamp-1 mt-auto">
                    {config.dealsZone.itemName || "Cow Ghee"}
                  </span>
                </div>

                {/* Right 2x2 Mini Deal Cards (7 cols) */}
                <div className="col-span-7 grid grid-cols-2 gap-2">
                  {config.miniCards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col justify-between shadow-xs min-h-[72px]"
                    >
                      <span className="text-[9.5px] font-bold text-slate-800 line-clamp-1">
                        {card.title}
                      </span>
                      {card.image && card.image.trim().startsWith("http") ? (
                        <div className="w-8 h-8 mx-auto my-0.5 rounded bg-slate-50 flex items-center justify-center p-0.5">
                          <img
                            src={card.image}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-center my-0.5 text-lg">
                          {card.emoji || "☕"}
                        </div>
                      )}
                      <div className="bg-[#E11D48] text-white text-[8.5px] font-extrabold py-0.5 px-1.5 rounded-full text-center truncate">
                        {card.priceText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status: {config.enabled ? "Active in App" : "Hidden"}</span>
              <span className="text-emerald-400">Saves to BuggyDM MySQL</span>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Controls & Editors (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Campaign & Header Info */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                1. Campaign Title & Branding
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-400">Card Active:</span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Card Main Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Hot Sips & Snack Fest"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Header Emoji / Icon
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={config.headerEmoji}
                    onChange={(e) => setConfig({ ...config, headerEmoji: e.target.value })}
                    className="w-16 px-2.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-center text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-1">
                    {["🫖", "☕", "🍿", "🔥", "🎉"].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setConfig({ ...config, headerEmoji: em })}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-xs cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sponsor Tags Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400">
                  Sponsor Badges (e.g. Powered By, Co-powered By)
                </label>
                <button
                  type="button"
                  onClick={addSponsor}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Sponsor
                </button>
              </div>

              <div className="space-y-2">
                {config.sponsors.map((sp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder="Prefix (e.g. Powered By)"
                      value={sp.label}
                      onChange={(e) => updateSponsor(idx, "label", e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Brand Name"
                      value={sp.name}
                      onChange={(e) => updateSponsor(idx, "name", e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="color"
                        value={sp.badgeColor}
                        onChange={(e) => updateSponsor(idx, "badgeColor", e.target.value)}
                        className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                        title="Pick badge color"
                      />
                      <button
                        type="button"
                        onClick={() => removeSponsor(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                        title="Remove sponsor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Left Hero "Deals Zone" Product */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2. Deals Zone Hero Product
              </h3>
              {discountPercent > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Linked Product Banner */}
            {config.dealsZone.itemId && (
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                <span className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  Linked Catalog Product: <strong>{config.dealsZone.itemName}</strong> (ID #{config.dealsZone.itemId})
                </span>
                <button
                  type="button"
                  onClick={clearSelectedProduct}
                  className="text-xs text-slate-400 hover:text-rose-400 underline shrink-0 ml-2 cursor-pointer font-medium"
                >
                  Unlink
                </button>
              </div>
            )}

            {/* Product Display Name & Existing Products Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Product Display Name
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductDropdown(!showProductDropdown);
                    if (!showProductDropdown && searchResults.length === 0) {
                      void fetchCatalogProducts("");
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select from Existing Products</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showProductDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Display Name Input with Dropdown Toggle Button */}
              <div className="relative">
                <input
                  type="text"
                  value={config.dealsZone.itemName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsZone: { ...config.dealsZone, itemName: e.target.value },
                    })
                  }
                  placeholder="e.g. Aashirvaad Svasti Cow Ghee"
                  className="w-full pl-3 pr-24 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowProductDropdown(!showProductDropdown);
                    if (!showProductDropdown && searchResults.length === 0) {
                      void fetchCatalogProducts("");
                    }
                  }}
                  className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border border-slate-700"
                >
                  <Package className="w-3 h-3 text-amber-400" />
                  <span>Browse</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Search Results Dropdown Combobox */}
              {showProductDropdown && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      Browse Existing Catalog Products
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowProductDropdown(false)}
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
                          onClick={() => selectProduct(prod)}
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
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Side Ribbon Badge Text
                </label>
                <input
                  type="text"
                  value={config.dealsZone.badgeText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsZone: { ...config.dealsZone, badgeText: e.target.value },
                    })
                  }
                  placeholder="PURE COW GHEE"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Original MRP (₹)
                </label>
                <input
                  type="number"
                  value={config.dealsZone.originalPrice}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsZone: {
                        ...config.dealsZone,
                        originalPrice: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Discount Deal Price (₹)
                </label>
                <input
                  type="number"
                  value={config.dealsZone.discountedPrice}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dealsZone: {
                        ...config.dealsZone,
                        discountedPrice: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white font-bold text-amber-400"
                />
              </div>

              {/* Product Image: Upload / URL Mode Switcher */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Product Hero Image
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        imageMode === "upload"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        imageMode === "url"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Direct URL
                    </button>
                  </div>
                </div>

                {/* Mode 1: File Upload Dropzone */}
                {imageMode === "upload" ? (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file);
                        e.target.value = "";
                      }}
                    />

                    {config.dealsZone.itemImage ? (
                      /* Existing Image Preview with Replace / Remove controls */
                      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700/80 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-16 h-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-600">
                            <img
                              src={config.dealsZone.itemImage}
                              alt="Uploaded Preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Active Hero Image
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                              {config.dealsZone.itemImage}
                            </p>
                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Ready in User App
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                dealsZone: { ...config.dealsZone, itemImage: "" },
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Container */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) uploadFile(file);
                        }}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                            : "border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-600"
                        } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center justify-center py-2">
                            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs font-medium text-emerald-400">
                              Uploading image to server...
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2.5 text-emerald-400">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-medium text-white mb-0.5">
                              Click to browse or drag & drop image
                            </p>
                            <p className="text-[11px] text-slate-400">
                              PNG, JPG, WebP, or SVG up to 10 MB
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mode 2: Direct Image URL */
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="https://example.com/product-image.jpg"
                      value={config.dealsZone.itemImage}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          dealsZone: { ...config.dealsZone, itemImage: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      Paste any external CDN or image URL. Preview updates instantly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: 2x2 Mini Deal Tiles */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  3. 2x2 Mini Deal Tiles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  4 promotional cards displayed in the right 2x2 grid (Support Emoji or Uploaded Image)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.miniCards.map((card, idx) => {
                const isImageMode = Boolean(card.image && card.image.trim().length > 0);
                const emojiPresets = [
                  ["☕", "🫖", "🍵", "🥛", "🥤"],
                  ["🍟", "🍗", "🥟", "🍕", "🌭"],
                  ["🍜", "🍝", "🥣", "🥪", "🌮"],
                  ["🍪", "🧁", "🍰", "🍩", "🍫"],
                ][idx] || ["☕", "🍟", "🍜", "🍪", "🧃"];

                return (
                  <div
                    key={card.id || idx}
                    className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3"
                  >
                    {/* Card Header, Mode Toggle & Existing Product Picker */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-800/60 text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 border border-slate-700">
                          {idx + 1}
                        </span>
                        Card #{idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Pick from Products Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (miniCardSearchIdx === idx) {
                              setMiniCardSearchIdx(null);
                            } else {
                              setMiniCardSearchIdx(idx);
                              if (miniCardSearchResults.length === 0) {
                                void fetchMiniCardProducts("");
                              }
                            }
                          }}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded flex items-center gap-1 transition cursor-pointer border ${
                            miniCardSearchIdx === idx
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          }`}
                          title="Pick an existing product from database to auto-fill"
                        >
                          <Search className="w-3 h-3 text-emerald-400" />
                          <span>Link Product</span>
                          <ChevronDown
                            className={`w-2.5 h-2.5 transition-transform ${
                              miniCardSearchIdx === idx ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Emoji vs Image Toggle */}
                        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => updateMiniCard(idx, "image", "")}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                              !isImageMode
                                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Emoji ({card.emoji || "☕"})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!card.image) updateMiniCard(idx, "image", " ");
                            }}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                              isImageMode
                                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Image
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Existing Products Picker for this Card */}
                    {miniCardSearchIdx === idx && (
                      <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-2.5 space-y-2 shadow-xl animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Package className="w-3 h-3" />
                            Auto-fill Card #{idx + 1} from Catalog
                          </span>
                          <button
                            type="button"
                            onClick={() => setMiniCardSearchIdx(null)}
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search catalog products..."
                            value={miniCardSearchQuery}
                            onChange={(e) => setMiniCardSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          {miniCardSearching && (
                            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-2.5 top-2" />
                          )}
                        </div>

                        <div className="max-h-44 overflow-y-auto divide-y divide-slate-800 pr-1">
                          {miniCardSearchResults.length === 0 ? (
                            <div className="py-3 text-center text-[11px] text-slate-500">
                              {miniCardSearching ? "Searching..." : "No matching products found."}
                            </div>
                          ) : (
                            miniCardSearchResults.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => applyProductToMiniCard(idx, prod)}
                                className="w-full text-left px-2 py-1.5 hover:bg-slate-900 rounded flex items-center justify-between text-xs transition cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt=""
                                      className="w-6 h-6 object-contain rounded bg-white p-0.5 shrink-0"
                                    />
                                  ) : (
                                    <span className="text-xs">📦</span>
                                  )}
                                  <div className="truncate">
                                    <span className="font-medium text-slate-300 block truncate group-hover:text-emerald-400 text-[11px]">
                                      {prod.name}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-amber-400 shrink-0 ml-2">
                                  ₹{prod.discountedPrice}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateMiniCard(idx, "title", e.target.value)}
                        placeholder="e.g. Hot Sips & Mixes"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Badge Text */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Badge Text</label>
                      <input
                        type="text"
                        value={card.priceText}
                        onChange={(e) => updateMiniCard(idx, "priceText", e.target.value)}
                        placeholder="Starts at ₹40"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Visual Editor (Emoji OR Image) */}
                    {!isImageMode ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] text-slate-400">Emoji Icon</label>
                          <span className="text-[10px] text-slate-500">Click preset or type</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={card.emoji}
                            onChange={(e) => updateMiniCard(idx, "emoji", e.target.value)}
                            className="w-10 px-1 py-1 bg-slate-800 border border-slate-700 rounded text-base text-center text-white"
                          />
                          <div className="flex items-center gap-1 flex-wrap">
                            {emojiPresets.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => updateMiniCard(idx, "emoji", em)}
                                className={`w-7 h-7 rounded text-sm hover:bg-slate-700 flex items-center justify-center transition cursor-pointer ${
                                  card.emoji === em ? "bg-amber-500/20 border border-amber-500/40" : "bg-slate-800/80"
                                }`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-slate-400">Card Image (Upload or URL)</label>
                        {card.image && card.image.trim().startsWith("http") ? (
                          <div className="flex items-center gap-2 p-1.5 bg-slate-800/90 rounded-lg border border-slate-700">
                            <img
                              src={card.image}
                              alt=""
                              className="w-10 h-10 object-contain rounded bg-white p-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-emerald-400 font-medium">Image active</p>
                              <p className="text-[9.5px] text-slate-400 truncate font-mono">{card.image}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => cardFileInputRefs.current[idx]?.click()}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] rounded cursor-pointer shrink-0"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMiniCard(idx, "image", "")}
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
                              title="Remove image (switch to emoji)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={uploadingCardIdx === idx}
                                onClick={() => cardFileInputRefs.current[idx]?.click()}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                              >
                                {uploadingCardIdx === idx ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Image</span>
                                  </>
                                )}
                              </button>
                              <span className="text-[10px] text-slate-500">or paste URL below:</span>
                            </div>
                            <input
                              type="text"
                              value={card.image && card.image.trim() ? card.image : ""}
                              onChange={(e) => updateMiniCard(idx, "image", e.target.value)}
                              placeholder="https://.../snack.png"
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono text-[11px]"
                            />
                          </div>
                        )}
                        <input
                          ref={(el) => { cardFileInputRefs.current[idx] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              void uploadMiniCardFile(idx, f);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Search Keyword */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">
                        Search Keyword / Tag
                      </label>
                      <input
                        type="text"
                        value={card.searchKeyword}
                        onChange={(e) => updateMiniCard(idx, "searchKeyword", e.target.value)}
                        placeholder="e.g. tea coffee, frozen snacks"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
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
