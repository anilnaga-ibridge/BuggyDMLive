"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Zap,
  Flame,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
  Store,
  ShoppingBag,
  Heart,
  ArrowRight,
  Scissors,
  Shirt,
  Volume2,
  Crown,
  Eye,
  Bike,
  CheckCircle2,
  Star,
  MapPin,
} from "lucide-react";
import {
  type ParsedThemeTokens,
  recipeTypography,
  recipeElevation,
  recipeProductCard,
  recipeCategoryCard,
  recipeStoreCard,
  recipeDealCard,
  recipeButton,
  recipeBadge,
  recipeChip,
  recipeSectionHeader,
} from "./preview-theme";
import { PREVIEW_PRODUCTS, PREVIEW_CATEGORIES, PREVIEW_STORES, PREVIEW_STEAL_DEALS } from "./preview-data";
import { UnsupportedWidget } from "./UnsupportedWidget";
import { DecorationRenderer } from "./DecorationRenderer";

function resolveImgUrl(src?: string): string {
  if (!src) return "";
  let clean = src.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean.replace("/BuggyDm/BuggyDm/", "/BuggyDm/");
  }
  clean = clean.replace(/^\/+/, "");
  if (clean.startsWith("BuggyDm/")) {
    return `http://localhost:3000/${clean}`;
  }
  return `http://localhost:3000/BuggyDm/${clean}`;
}

export interface WidgetRenderProps {
  id: string;
  type: string;
  version?: string;
  props?: Record<string, unknown>;
  theme: ParsedThemeTokens;
}

// 1. module_selector
function ModuleSelectorWidget({ props, theme }: WidgetRenderProps) {
  const [selected, setSelected] = useState("grocery");

  const modules = [
    { id: "home", label: "Home", icon: "" },
    { id: "grocery", label: "Quick Grocery", icon: "🛒" },
    { id: "food", label: "Quick Food", icon: "🍴" },
    { id: "ecom", label: "Quick Ecom", icon: "🛍" },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
      {modules.map((m) => {
        const isSelected = selected === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelected(m.id)}
            className="px-3.5 py-1 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border"
            style={recipeChip(theme, isSelected)}
          >
            {m.icon && <span>{m.icon}</span>}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 2. search_entry
function SearchEntryWidget({ props, theme }: WidgetRenderProps) {
  const hint = typeof props?.hintKey === "string" ? props.hintKey.replace(/_/g, " ") : "tea & coffee";
  return (
    <div
      className="flex items-center justify-between pl-3 pr-1.5 py-1 border my-1 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#E2E8F0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "subtle"),
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        <Search className="w-4 h-4" style={{ color: theme.textMuted }} />
        <span className="capitalize" style={{ ...recipeTypography(theme, "body"), color: theme.textMuted }}>
          Search &quot;{hint}&quot;
        </span>
      </div>
      <div
        className="flex items-center gap-1 px-2 py-1 border font-bold"
        style={{
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
          borderRadius: `${Math.max(6, theme.cardRadius - 8)}px`,
          color: theme.textPrimary,
          ...recipeTypography(theme, "caption"),
        }}
      >
        <span>🍎</span>
        <span className="leading-tight text-[8.5px]">Seasonal<br />Fruits</span>
      </div>
    </div>
  );
}

// 3. hero_campaign / banner_carousel
function HeroCampaignWidget({ props, theme }: WidgetRenderProps) {
  const title = typeof props?.accessibilityLabel === "string" ? props.accessibilityLabel : "Mega Savings Fest";
  const bgImage = theme.heroImage || "";

  return (
    <div
      className="p-3.5 relative overflow-hidden text-white border border-black/5 flex flex-col justify-between min-h-[110px] transition-all"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover`
          : `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="uppercase tracking-wider bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded-full font-black"
          style={recipeTypography(theme, "caption")}
        >
          Featured
        </span>
        <span
          className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-bold"
          style={recipeTypography(theme, "caption")}
        >
          ⚡ 8-10 mins
        </span>
      </div>
      <div className="mt-2">
        <h3 className="font-black tracking-tight leading-tight text-white" style={recipeTypography(theme, "h2")}>
          {title}
        </h3>
        <p className="text-white/85 mt-0.5 font-medium" style={recipeTypography(theme, "bodySmall")}>
          Up to 60% OFF on fresh pantry essentials
        </p>
      </div>
    </div>
  );
}

// 4. promo_grid
function PromoGridWidget({ props, theme }: WidgetRenderProps) {
  return (
    <div className="grid grid-cols-2 gap-2 my-1">
      <div
        className="p-3 text-white flex flex-col justify-between h-24 transition-all"
        style={{
          background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
          borderRadius: `${theme.cardRadius}px`,
          boxShadow: recipeElevation(theme, "card"),
        }}
      >
        <span
          className="uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded w-fit font-black"
          style={recipeTypography(theme, "caption")}
        >
          COUPON: BUGGY50
        </span>
        <div>
          <div className="font-black text-white" style={recipeTypography(theme, "h3")}>Flat ₹50 OFF</div>
          <div className="text-white/80" style={recipeTypography(theme, "caption")}>On orders above ₹299</div>
        </div>
      </div>
      <div
        className="p-3 text-white flex flex-col justify-between h-24 transition-all"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradientTo})`,
          borderRadius: `${theme.cardRadius}px`,
          boxShadow: recipeElevation(theme, "card"),
        }}
      >
        <span
          className="uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded w-fit font-black"
          style={recipeTypography(theme, "caption")}
        >
          ZERO FEE
        </span>
        <div>
          <div className="font-black text-white" style={recipeTypography(theme, "h3")}>Free Delivery</div>
          <div className="text-white/80" style={recipeTypography(theme, "caption")}>On your quick grocery order</div>
        </div>
      </div>
    </div>
  );
}

// 5. category_grid / grouped_category_directory
function CategoryGridWidget({ props, theme }: WidgetRenderProps) {
  const title = typeof props?.titleKey === "string" ? props.titleKey.replace(/_/g, " ") : "Grocery & Kitchen";
  const columns = typeof props?.columns === "number" ? Math.min(props.columns, 4) : 4;
  const headerStyles = recipeSectionHeader(theme);

  return (
    <div
      className="p-3 border space-y-2 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
      }}
    >
      <div style={headerStyles.container}>
        <h4 className="capitalize" style={headerStyles.title}>{title}</h4>
        <span style={headerStyles.actionLink}>See All &gt;</span>
      </div>
      <div className={`grid grid-cols-${columns} gap-2 text-center`}>
        {PREVIEW_CATEGORIES.slice(0, 8).map((cat) => {
          const catStyles = recipeCategoryCard(theme, { customBg: cat.bg });
          return (
            <div key={cat.id} className="flex flex-col items-center" style={catStyles.container}>
              <div
                className="w-11 h-11 grid place-items-center text-xl border"
                style={catStyles.iconWell}
              >
                {cat.icon}
              </div>
              <span className="mt-1 line-clamp-1" style={catStyles.label}>
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. product_rail / personalized_recommendations / recently_viewed_rail
function ProductRailWidget({ props, theme }: WidgetRenderProps) {
  const title = typeof props?.titleKey === "string" ? props.titleKey.replace(/_/g, " ") : "Popular Near You";
  const headerStyles = recipeSectionHeader(theme);

  return (
    <div
      className="p-3 border space-y-2 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
      }}
    >
      <div style={headerStyles.container}>
        <h4 className="capitalize" style={headerStyles.title}>{title}</h4>
        <span style={headerStyles.actionLink}>Explore &gt;</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PREVIEW_PRODUCTS.slice(0, 3).map((prod) => {
          const productStyles = recipeProductCard(theme, { elevated: true });
          return (
            <div
              key={prod.id}
              className="p-2 border flex flex-col justify-between transition-all relative overflow-hidden"
              style={productStyles.card}
            >
              {theme.overlay?.enabled && (
                <DecorationRenderer
                  decorations={theme.overlay.decorations}
                  placement="product_card"
                  className="absolute top-1 left-1 pointer-events-none z-10"
                />
              )}
              <div
                className="h-14 grid place-items-center text-2xl relative"
                style={productStyles.imageWell}
              >
                {prod.icon}
                {prod.discount && (
                  <span
                    className="absolute top-0.5 right-0.5 px-1 rounded font-black text-white"
                    style={{
                      backgroundColor: theme.success,
                      ...recipeTypography(theme, "caption"),
                      fontSize: "6.5px",
                    }}
                  >
                    {prod.discount}
                  </span>
                )}
              </div>
              <div className="line-clamp-1 mt-1" style={productStyles.title}>{prod.name}</div>
              <div style={productStyles.unit}>{prod.unit}</div>
              <div className="flex items-center justify-between mt-1">
                <span style={productStyles.price}>{prod.price}</span>
                <button
                  type="button"
                  style={recipeButton(theme, "mini_add")}
                >
                  ADD
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 7. Store Explorer Widget (Matches User_app ExploreRestaurantSection & FeaturedStoreCard)
interface ExplorerStore {
  id: string | number;
  name: string;
  rating: number;
  reviewsCount?: number;
  distance: string;
  eta: string;
  isNew?: boolean;
  isVerified?: boolean;
  coverPhoto: string;
  categoryNames?: string[];
  discountLabel?: string;
  freeDelivery?: boolean;
}

const DEFAULT_EXPLORE_STORES: ExplorerStore[] = [
  {
    id: "s1",
    name: "Quick Store Grocery",
    rating: 4.8,
    reviewsCount: 154,
    distance: "1.2 km",
    eta: "10-15 mins",
    isNew: false,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Atta, Flours & Sooji", "Dairy, Bread & Eggs", "Fresh Produce"],
    discountLabel: "Flat ₹50 OFF",
    freeDelivery: true,
  },
  {
    id: "s2",
    name: "Quick Fresh Supermarket",
    rating: 4.9,
    reviewsCount: 320,
    distance: "1.8 km",
    eta: "12-18 mins",
    isNew: true,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Fruits & Vegetables", "Beverages", "Snacks"],
    discountLabel: "20% OFF up to ₹100",
    freeDelivery: true,
  },
  {
    id: "s3",
    name: "Organic Harvest Hub",
    rating: 4.7,
    reviewsCount: 88,
    distance: "2.4 km",
    eta: "15-20 mins",
    isNew: false,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Organic Staples", "Cold Pressed Oils", "Dry Fruits"],
    discountLabel: "Free Delivery",
    freeDelivery: true,
  },
  {
    id: "s4",
    name: "Daily Essentials Mart",
    rating: 4.6,
    reviewsCount: 64,
    distance: "3.1 km",
    eta: "20-25 mins",
    isNew: false,
    isVerified: false,
    coverPhoto: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Cleaning & Household", "Personal Care", "Stationery"],
    discountLabel: "Buy 1 Get 1 Free",
    freeDelivery: false,
  },
];

function StoreExplorerWidget({ props, theme }: WidgetRenderProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [stores, setStores] = useState<ExplorerStore[]>(DEFAULT_EXPLORE_STORES);
  const [favorites, setFavorites] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch(`/BuggyCxp/api/qcos/stores?filter=${activeFilter}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.stores && Array.isArray(data.stores) && data.stores.length > 0) {
          setStores(data.stores);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const filterTabs = [
    { type: "all", label: "All" },
    { type: "newly_joined", label: "Newly Joined" },
    { type: "popular", label: "Popular" },
    { type: "top_rated", label: "Top Rated" },
  ];

  const filteredStores = stores.filter((st) => {
    if (activeFilter === "newly_joined") return st.isNew;
    return true;
  });

  const storeStyles = recipeStoreCard(theme);

  return (
    <div className="space-y-3 pt-2">
      {/* 1. Header with Title & Store Count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 grid place-items-center"
            style={{
              borderRadius: `${theme.radiusSm}px`,
              backgroundColor: `${theme.primary}18`,
              color: theme.primary,
            }}
          >
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="tracking-tight flex items-center gap-1.5" style={recipeTypography(theme, "sectionTitle")}>
              Explore Stores
            </h3>
            <p style={recipeTypography(theme, "caption")}>Verified grocery hubs delivering near you</p>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full font-extrabold"
          style={{
            backgroundColor: theme.surfaceElevated,
            color: theme.textSecondary,
            ...recipeTypography(theme, "caption"),
          }}
        >
          {filteredStores.length} stores
        </span>
      </div>

      {/* 2. Filter Header Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveFilter(tab.type)}
              className="shrink-0 px-3.5 py-1.5 border transition-all cursor-pointer"
              style={recipeChip(theme, isSelected)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Stores List */}
      <div className="space-y-3.5">
        {filteredStores.map((store) => {
          const isFav = !!favorites[store.id];
          return (
            <div
              key={store.id}
              className="border overflow-hidden transition-all"
              style={storeStyles.card}
            >
              {/* Cover Banner Image with Badges */}
              <div
                className="relative h-[135px] w-full overflow-hidden"
                style={{ backgroundColor: theme.surfaceElevated }}
              >
                <img
                  src={store.coverPhoto}
                  alt={store.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80";
                  }}
                />

                {/* Heart / Favourite Button */}
                <button
                  type="button"
                  onClick={() =>
                    setFavorites((prev) => ({ ...prev, [store.id]: !prev[store.id] }))
                  }
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-xs grid place-items-center shadow-xs transition active:scale-90 cursor-pointer"
                  style={{ backgroundColor: `${theme.surface}e6` }}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition ${
                      isFav ? "fill-rose-500 text-rose-500" : "text-slate-400 hover:text-rose-500"
                    }`}
                  />
                </button>

                {/* Badges on Bottom Left of Image */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 flex-wrap">
                  {store.isNew && (
                    <span
                      className="px-2 py-0.5 rounded font-black text-white uppercase shadow-xs"
                      style={{ backgroundColor: theme.warning, ...recipeTypography(theme, "caption"), fontSize: "8px" }}
                    >
                      NEW
                    </span>
                  )}
                  {store.discountLabel && (
                    <span
                      className="px-2 py-0.5 rounded font-black text-white uppercase shadow-xs backdrop-blur-xs"
                      style={{ backgroundColor: theme.primary, ...recipeTypography(theme, "caption"), fontSize: "8px" }}
                    >
                      {store.discountLabel}
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded font-black text-white uppercase shadow-xs backdrop-blur-xs"
                    style={{ backgroundColor: theme.success, ...recipeTypography(theme, "caption"), fontSize: "8px" }}
                  >
                    OPEN NOW
                  </span>
                </div>
              </div>

              {/* Store Details */}
              <div className="p-3 space-y-1.5">
                {/* Name & Rating */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {store.isVerified && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ fill: theme.primary, color: "#ffffff" }} />
                    )}
                    <h4 className="truncate tracking-tight" style={storeStyles.title}>
                      {store.name}
                    </h4>
                  </div>

                  <div
                    className="flex items-center gap-1 px-2 py-0.5 border shrink-0"
                    style={storeStyles.ratingBadge}
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-black" style={recipeTypography(theme, "bodySmall")}>
                      {typeof store.rating === "number" ? store.rating.toFixed(1) : store.rating}
                    </span>
                    {store.reviewsCount ? (
                      <span className="font-bold opacity-80" style={recipeTypography(theme, "caption")}>
                        ({store.reviewsCount})
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Category Tags */}
                {store.categoryNames && store.categoryNames.length > 0 && (
                  <div className="flex items-center gap-1 truncate" style={storeStyles.tagline}>
                    <span>{store.categoryNames.join(" · ")}</span>
                  </div>
                )}

                {/* Distance & Delivery ETA */}
                <div className="flex items-center gap-3 font-semibold pt-0.5" style={recipeTypography(theme, "bodySmall")}>
                  <div className="flex items-center gap-1" style={{ color: theme.primary }}>
                    <Zap className="w-3.5 h-3.5" style={{ fill: theme.primary, color: theme.primary }} />
                    <span>{store.eta}</span>
                  </div>
                  <span style={{ color: theme.textMuted }}>•</span>
                  <div className="flex items-center gap-1" style={{ color: theme.textMuted }}>
                    <MapPin className="w-3 h-3" />
                    <span>{store.distance}</span>
                  </div>
                </div>

                {/* Bottom Offers Row */}
                <div
                  className="flex items-center gap-2 pt-1 border-t flex-wrap"
                  style={{ borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9" }}
                >
                  {store.freeDelivery && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold"
                      style={{
                        backgroundColor: `${theme.success}18`,
                        color: theme.success,
                        ...recipeTypography(theme, "caption"),
                      }}
                    >
                      <Bike className="w-3 h-3" />
                      <span>Free Delivery</span>
                    </div>
                  )}
                  {store.discountLabel && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold"
                      style={{
                        backgroundColor: `${theme.secondary}18`,
                        color: theme.secondary,
                        ...recipeTypography(theme, "caption"),
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{store.discountLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const StoreRailWidget = StoreExplorerWidget;

// 8. deal_countdown / flash_deals
function DealCountdownWidget({ props, theme }: WidgetRenderProps) {
  const title = typeof props?.titleKey === "string" ? props.titleKey.replace(/_/g, " ") : "FLASH DEALS · ALL TIME LOW";
  return (
    <div
      className="p-3 text-white transition-all"
      style={{
        background: `linear-gradient(135deg, ${theme.isDark ? "#18181b" : "#1e1b4b"}, ${theme.primary})`,
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <h4 className="font-black text-yellow-300 uppercase tracking-tight" style={recipeTypography(theme, "h3")}>
            {title}
          </h4>
        </div>
        <span className="font-mono font-bold bg-yellow-400/20 px-2 py-0.5 rounded-full text-yellow-200 text-[9px]">
          01:14:42
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div
          className="p-2 bg-white/10 backdrop-blur-md flex items-center gap-2"
          style={{ borderRadius: `${theme.radiusSm}px` }}
        >
          <span className="text-2xl">🎧</span>
          <div>
            <div className="font-bold text-white" style={recipeTypography(theme, "bodySmall")}>boAt Earbuds</div>
            <div className="font-black text-yellow-300" style={recipeTypography(theme, "price")}>
              ₹899 <span className="text-[7px] text-white/50 line-through">₹2499</span>
            </div>
          </div>
        </div>
        <div
          className="p-2 bg-white/10 backdrop-blur-md flex items-center gap-2"
          style={{ borderRadius: `${theme.radiusSm}px` }}
        >
          <span className="text-2xl">⚡</span>
          <div>
            <div className="font-bold text-white" style={recipeTypography(theme, "bodySmall")}>Power Bank 10k</div>
            <div className="font-black text-yellow-300" style={recipeTypography(theme, "price")}>
              ₹699 <span className="text-[7px] text-white/50 line-through">₹1999</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. intent_tab_rail / segmented_collection
function IntentTabRailWidget({ props, theme }: WidgetRenderProps) {
  const [activeTab, setActiveTab] = useState(0);
  const labels = Array.isArray(props?.labels) ? (props?.labels as string[]) : ["All", "Fresh", "Offers", "Rapid"];
  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
      {labels.map((label, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => setActiveTab(idx)}
          className="px-3 py-1 font-bold transition-all border cursor-pointer"
          style={recipeChip(theme, activeTab === idx)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// 10. campaign_mosaic / hero_fest
function CampaignMosaicWidget({ props, theme }: WidgetRenderProps) {
  const [cfg, setCfg] = useState<any>({
    title: "Home Groceries",
    sponsors: [
      { label: "Powered By", name: "Red Label", badgeColor: "#d5c6dd" },
      { label: "", name: "Maggi", badgeColor: "#D97706" },
      { label: "Co-powered By", name: "Nescafe", badgeColor: "#b8aea8" },
    ],
    dealsZone: {
      title: "Deals Zone",
      badgeText: "Organic",
      itemName: "Cool Drinks",
      itemImage: "http://localhost:3000/BuggyDm/storage/product/2026-09-28-6aba21fa66895.webp",
      originalPrice: 20,
      discountedPrice: 3,
    },
    miniCards: [
      { id: "1", title: "Patanjali Herbal", priceText: "Starts at ₹10", image: "http://localhost:3000/BuggyDm/uploads/hero_1790602152917_d05f6ad0.jpg" },
      { id: "2", title: "Cool Drinks", priceText: "Starts at ₹20", image: "http://localhost:3000/BuggyDm/uploads/hero_1790602130750_6d72269a.jpg" },
      { id: "3", title: "Munch & Slurp", priceText: "Starts at ₹15", emoji: "🍜" },
      { id: "4", title: "Cookies & Cake", priceText: "Starts at ₹15", emoji: "🍪" },
    ],
  });

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/hero-fest")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) setCfg(res.data);
      })
      .catch(() => {});
  }, []);

  if (cfg.enabled === false) return null;

  return (
    <div
      className="p-3.5 border relative overflow-hidden space-y-3 transition-all"
      style={{
        backgroundColor: theme.isDark ? theme.surface : `${theme.secondary}12`,
        borderColor: theme.isDark ? "#3f3f46" : `${theme.secondary}35`,
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
      }}
    >
      {/* Hero Festival Overlay Artwork */}
      {theme.overlay?.enabled && (
        <DecorationRenderer
          decorations={theme.overlay.decorations}
          placement="hero"
          className="absolute inset-0 pointer-events-none z-0"
        />
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h2
            className="font-black tracking-tight leading-tight"
            style={{
              ...recipeTypography(theme, "h1"),
              color: theme.isDark ? theme.textPrimary : "#B4380D",
            }}
          >
            {cfg.title || "Home Groceries"}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-semibold" style={recipeTypography(theme, "caption")}>
            {cfg.sponsors?.map((sp: any, idx: number) => (
              <React.Fragment key={idx}>
                {sp.label && <span style={{ color: theme.textSecondary }}>{sp.label}</span>}
                <span
                  className="px-2 py-0.5 rounded text-[9.5px] font-bold shadow-xs text-white"
                  style={{ backgroundColor: sp.badgeColor || (idx === 0 ? theme.primary : theme.secondary) }}
                >
                  {sp.name}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Circular Avatar Placeholder */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-xs shrink-0 border"
          style={{
            backgroundColor: `${theme.primary}20`,
            borderColor: `${theme.primary}40`,
          }}
        >
          {cfg.headerEmoji || "🛒"}
        </div>
      </div>

      {/* Main Card Content */}
      <div className="flex gap-2.5 items-stretch relative z-10">
        {/* Left Deals Zone Card */}
        <div
          className="w-[42%] border p-2.5 flex flex-col justify-between relative min-h-[220px] transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#FCD34D",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
          }}
        >
          <span
            className="font-black leading-tight"
            style={{
              ...recipeTypography(theme, "h3"),
              color: theme.isDark ? theme.textPrimary : "#78350F",
            }}
          >
            {cfg.dealsZone?.title || "Deals Zone"}
          </span>

          <div className="relative my-auto py-2 flex items-center justify-center">
            {cfg.dealsZone?.itemImage ? (
              <img
                src={resolveImgUrl(cfg.dealsZone.itemImage)}
                alt="Product"
                className="max-h-24 max-w-full object-contain"
              />
            ) : (
              <div className="text-4xl py-2">🥤</div>
            )}

            {/* 3D Round Price Badge */}
            <div
              className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center shadow-xs"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.accent || "#f59e0b",
              }}
            >
              <span className="line-through leading-none font-bold" style={{ ...recipeTypography(theme, "caption"), fontSize: "8px", color: theme.textMuted }}>
                ₹{cfg.dealsZone?.originalPrice || 20}
              </span>
              <span
                className="font-black leading-none mt-0.5"
                style={{
                  ...recipeTypography(theme, "price"),
                  color: theme.isDark ? theme.accent : "#d97706",
                }}
              >
                ₹{cfg.dealsZone?.discountedPrice || 3}
              </span>
            </div>
          </div>

          <span className="font-bold line-clamp-1" style={{ ...recipeTypography(theme, "bodySmall"), color: theme.textPrimary }}>
            {cfg.dealsZone?.itemName || "Cool Drinks"}
          </span>
        </div>

        {/* Right 2x2 Mini Deal Cards */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {cfg.miniCards?.map((card: any, idx: number) => (
            <div
              key={card.id || idx}
              className="p-2 border flex flex-col items-center justify-between text-center min-h-[105px] transition-all"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                borderRadius: `${theme.cardRadius}px`,
                boxShadow: recipeElevation(theme, "subtle"),
              }}
            >
              <span className="font-bold line-clamp-2 leading-tight" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                {card.title}
              </span>
              {card.image && card.image.trim().length > 0 ? (
                <div className="h-9 w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={resolveImgUrl(card.image)}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-2xl my-auto select-none">
                  {card.emoji || "🍪"}
                </div>
              )}
              <div
                className="text-white py-0.5 px-2 font-black"
                style={{
                  backgroundColor: theme.error || "#DC2626",
                  borderRadius: `${theme.buttonRadius}px`,
                  ...recipeTypography(theme, "caption"),
                  fontSize: "8.5px",
                }}
              >
                {card.priceText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 11. mini_cart_bar
function MiniCartBarWidget({ theme }: WidgetRenderProps) {
  return (
    <div
      className="p-2.5 text-white flex items-center justify-between my-1 transition-all"
      style={{
        background: theme.primary,
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "floating"),
      }}
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-4 h-4" />
        <div>
          <div className="font-bold leading-tight" style={recipeTypography(theme, "bodySmall")}>2 items added</div>
          <div className="text-white/80" style={recipeTypography(theme, "caption")}>₹184 · Free delivery unlocked</div>
        </div>
      </div>
      <button
        type="button"
        className="px-3 py-1 font-black cursor-pointer"
        style={{
          backgroundColor: "#ffffff",
          color: theme.primary,
          borderRadius: `${theme.buttonRadius}px`,
          ...recipeTypography(theme, "caption"),
        }}
      >
        View Cart →
      </button>
    </div>
  );
}

// 12. spacer
function SpacerWidget({ props }: WidgetRenderProps) {
  const size = props?.size === "lg" ? 24 : props?.size === "sm" ? 8 : 16;
  return <div style={{ height: size }} />;
}

// 13. rich_content / operational_notice
function OperationalNoticeWidget({ props, theme }: WidgetRenderProps) {
  const title = typeof props?.titleKey === "string" ? props.titleKey.replace(/_/g, " ") : "Express Delivery Active";
  return (
    <div
      className="p-2 border flex items-center gap-2 font-bold transition-all"
      style={{
        backgroundColor: `${theme.primary}12`,
        borderColor: `${theme.primary}30`,
        color: theme.primary,
        borderRadius: `${theme.radiusMd}px`,
        ...recipeTypography(theme, "caption"),
      }}
    >
      <Zap className="w-3.5 h-3.5 shrink-0" style={{ fill: theme.primary, color: theme.primary }} />
      <span className="capitalize">{title} · Delivering in 8-10 mins in your area</span>
    </div>
  );
}

// 14. salon_bloom Showcase section
function SalonBloomWidget({ theme }: WidgetRenderProps) {
  const [data, setData] = useState<any>(null);

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/salon-showcase")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const salon = data?.salon;
  const bloom = data?.bloom;

  if (salon?.enabled === false && bloom?.enabled === false) return null;

  const title = salon?.title || "Salon at Home";
  const sponsorText = salon?.sponsorText || "Powered by";
  const sponsorName = salon?.sponsorName || "L'ORÉAL";
  const heroDeal = salon?.heroDeal;
  const rawMiniCards = salon?.miniCards?.length ? salon.miniCards : [
    { title: "Premium Hair Care", badgeText: "UP TO 50% OFF", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80" },
    { title: "Daily Hair Care", badgeText: "UP TO 70% OFF", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80" },
    { title: "Hair Colour & Styling", badgeText: "UP TO 65% OFF", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop&q=80" },
    { title: "Bath & Body Luxury", badgeText: "UP TO 50% OFF", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80" },
  ];

  return (
    <div className="space-y-3">
      {/* Salon at Home Card Container */}
      {salon?.enabled !== false && (
        <div
          className="p-3 border space-y-3 transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: theme.primary }}>✦</span>
                <h2
                  className="font-black italic tracking-tight font-serif"
                  style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}
                >
                  {title}
                </h2>
                <span className="text-xs font-bold" style={{ color: theme.primary }}>✦</span>
              </div>
              <div className="font-medium mt-0.5 flex items-center gap-1" style={recipeTypography(theme, "caption")}>
                <span style={{ color: theme.textSecondary }}>{sponsorText}</span>
                <span
                  className="font-bold px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    color: theme.textPrimary,
                    borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
                  }}
                >
                  {sponsorName}
                </span>
              </div>
            </div>

            <div
              className="w-16 h-10 p-0.5 flex items-center justify-center border"
              style={{
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                borderRadius: `${theme.radiusSm}px`,
              }}
            >
              <img
                src={resolveImgUrl(salon?.headerImage || "assets/image/salon_at_home_card.png")}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* Card Grid Body */}
          <div className="grid grid-cols-12 gap-2">
            {/* Left Deals Corner Hero Card */}
            <div
              className="col-span-4 p-2 border flex flex-col items-center justify-between text-center relative overflow-hidden transition-all"
              style={{
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                borderRadius: `${theme.cardRadius}px`,
                boxShadow: recipeElevation(theme, "subtle"),
              }}
            >
              <div
                className="font-extrabold uppercase tracking-wider line-clamp-1"
                style={{ ...recipeTypography(theme, "caption"), color: theme.primary }}
              >
                {heroDeal?.itemName || "DEALS Corner"}
              </div>
              <div className="w-14 h-16 my-1 flex items-center justify-center">
                <img
                  src={resolveImgUrl(heroDeal?.itemImage || "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80")}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div
                className="w-full text-white py-0.5 px-1 font-black"
                style={{
                  backgroundColor: theme.primary,
                  borderRadius: `${theme.radiusSm}px`,
                  ...recipeTypography(theme, "caption"),
                }}
              >
                {heroDeal?.originalPrice ? (
                  <div className="text-[8px] line-through opacity-80 leading-none">₹{heroDeal.originalPrice}</div>
                ) : (
                  <div className="text-[8px] line-through opacity-80 leading-none">₹795</div>
                )}
                <div className="text-[11px] font-black leading-none mt-0.5">
                  ₹{heroDeal?.discountedPrice ?? 715}
                </div>
              </div>
            </div>

            {/* Right: 2x2 Mini Cards */}
            <div className="col-span-8 grid grid-cols-2 gap-1.5">
              {rawMiniCards.map((card: any, idx: number) => (
                <div
                  key={idx}
                  className="p-1.5 border flex flex-col justify-between min-h-[75px] transition-all"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                    borderRadius: `${theme.cardRadius}px`,
                    boxShadow: recipeElevation(theme, "subtle"),
                  }}
                >
                  <div className="font-bold leading-tight line-clamp-1" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                    {card.title}
                  </div>
                  <div className="w-full h-8 my-0.5 flex items-center justify-center">
                    <img src={resolveImgUrl(card.image)} alt="" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                  <div
                    className="font-extrabold px-1 py-0.2 w-fit rounded"
                    style={{
                      backgroundColor: `${theme.primary}18`,
                      color: theme.primary,
                      ...recipeTypography(theme, "caption"),
                      fontSize: "7.5px",
                    }}
                  >
                    {card.badgeText || card.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fresh Blooms Banner */}
      {bloom?.enabled !== false && (
        <div
          className="overflow-hidden border shadow-xs relative h-20 flex items-center justify-between px-3 transition-all"
          style={{
            background: `linear-gradient(135deg, ${theme.secondary}20, ${theme.primary}20)`,
            borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
            borderRadius: `${theme.cardRadius}px`,
          }}
        >
          <div>
            <span
              className="uppercase tracking-wider text-white px-1.5 py-0.5 font-black"
              style={{
                backgroundColor: theme.secondary,
                borderRadius: `${theme.radiusSm}px`,
                ...recipeTypography(theme, "caption"),
                fontSize: "7.5px",
              }}
            >
              EXOTIC
            </span>
            <h4 className="font-black mt-0.5" style={{ ...recipeTypography(theme, "h3"), color: theme.textPrimary }}>
              {bloom?.title || "Fresh Blooms"}
            </h4>
            <p className="font-medium" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
              Flat 40% OFF on Exotic Flowers
            </p>
          </div>
          <img
            src={resolveImgUrl(bloom?.image || "assets/image/bloom_fruit_banner.png")}
            alt="Blooms"
            className="h-16 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}

// 15. lifestyle_categories Showcase
function LifestyleCategoriesWidget({ theme }: WidgetRenderProps) {
  const DEFAULT_LIFESTYLE_CONFIG = {
    fashionLifestyle: {
      enabled: true,
      title: "Fashion & Lifestyle",
      cards: [
        { id: "fl_1", title: "Apparel", image: "assets/image/crop_apparel.png" },
        { id: "fl_2", title: "Jewellery", image: "assets/image/crop_jewellery.png" },
      ],
    },
    beautyPersonalCare: {
      enabled: true,
      title: "Beauty & Personal Care",
      row1Cards: [
        { id: "bpc_1", title: "Personal Care Studio", image: "assets/image/crop_personal_care.png", isWide: true },
        { id: "bpc_2", title: "Skincare", image: "assets/image/crop_skincare.png", isWide: false },
        { id: "bpc_3", title: "Makeup & Beauty", image: "assets/image/crop_makeup.png", isWide: false },
      ],
      row2Cards: [
        { id: "bpc_4", title: "Fragrance", image: "assets/image/crop_fragrance.png" },
        { id: "bpc_5", title: "Bath & Body", image: "assets/image/crop_bath_body.png" },
        { id: "bpc_6", title: "Haircare", image: "assets/image/crop_haircare.png" },
        { id: "bpc_7", title: "Baby Care", image: "assets/image/crop_baby_care.png" },
      ],
      row3Cards: [
        { id: "bpc_8", title: "Protein & Nutrition", image: "assets/image/crop_protein.png" },
        { id: "bpc_9", title: "Pharmacy & Wellness", image: "assets/image/crop_pharmacy.png" },
        { id: "bpc_10", title: "Feminine Hygiene", image: "assets/image/crop_fem_hygiene.png" },
        { id: "bpc_11", title: "Sexual Wellness", image: "assets/image/crop_sexual_wellness.png" },
      ],
    },
    householdEssentials: {
      enabled: true,
      title: "Household Essentials",
      row1Cards: [
        { id: "he_1", title: "Home Needs", image: "assets/image/crop_home_needs.png", isWide: true },
        { id: "he_2", title: "Kitchenware & Appliances", image: "assets/image/crop_kitchenware.png", isWide: true },
      ],
      row2Cards: [
        { id: "he_3", title: "Cleaning Essentials", image: "assets/image/crop_cleaning.png" },
        { id: "he_4", title: "Electronics Store", image: "assets/image/crop_electronics.png" },
        { id: "he_5", title: "Pet Care", image: "assets/image/crop_pet_care.png" },
        { id: "he_6", title: "Paan Corner", image: "assets/image/crop_paan_corner.png" },
      ],
    },
    hobbiesInterests: {
      enabled: true,
      title: "Hobbies & Interests",
      cards: [
        { id: "hi_1", title: "Toys & Games", image: "assets/image/crop_toys_games.png" },
        { id: "hi_2", title: "Stationery & Crafts", image: "assets/image/crop_stationery.png" },
        { id: "hi_3", title: "Books & Music", image: "assets/image/crop_book_store.png" },
        { id: "hi_4", title: "Book Store", image: "assets/image/crop_book_store.png" },
      ],
    },
  };

  const [cfg, setCfg] = useState<any>(DEFAULT_LIFESTYLE_CONFIG);

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/lifestyle-categories")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setCfg((prev: any) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  const fashionCards = cfg?.fashionLifestyle?.cards?.length
    ? cfg.fashionLifestyle.cards
    : DEFAULT_LIFESTYLE_CONFIG.fashionLifestyle.cards;

  const beautyRow1 = cfg?.beautyPersonalCare?.row1Cards?.length
    ? cfg.beautyPersonalCare.row1Cards
    : DEFAULT_LIFESTYLE_CONFIG.beautyPersonalCare.row1Cards;

  const beautyRow2 = cfg?.beautyPersonalCare?.row2Cards?.length
    ? cfg.beautyPersonalCare.row2Cards
    : DEFAULT_LIFESTYLE_CONFIG.beautyPersonalCare.row2Cards;

  const beautyRow3 = cfg?.beautyPersonalCare?.row3Cards?.length
    ? cfg.beautyPersonalCare.row3Cards
    : DEFAULT_LIFESTYLE_CONFIG.beautyPersonalCare.row3Cards;

  const householdRow1 = cfg?.householdEssentials?.row1Cards?.length
    ? cfg.householdEssentials.row1Cards
    : DEFAULT_LIFESTYLE_CONFIG.householdEssentials.row1Cards;

  const householdRow2 = cfg?.householdEssentials?.row2Cards?.length
    ? cfg.householdEssentials.row2Cards
    : DEFAULT_LIFESTYLE_CONFIG.householdEssentials.row2Cards;

  const hobbiesCards = cfg?.hobbiesInterests?.cards?.length
    ? cfg.hobbiesInterests.cards
    : DEFAULT_LIFESTYLE_CONFIG.hobbiesInterests.cards;

  return (
    <div
      className="p-3.5 border space-y-4 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
        color: theme.textPrimary,
      }}
    >
      {/* 1. Fashion & Lifestyle Section */}
      {cfg.fashionLifestyle?.enabled !== false && (
        <div className="space-y-2.5">
          <h4 className="font-bold tracking-tight" style={recipeTypography(theme, "sectionTitle")}>
            {cfg.fashionLifestyle?.title || "Fashion & Lifestyle"}
          </h4>
          <div className="flex gap-2.5">
            {fashionCards.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="flex-1 border p-2 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${Math.max(8, theme.cardRadius - 6)}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-20 w-full overflow-hidden flex items-center justify-center p-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${theme.radiusSm}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1.5 font-bold text-center truncate w-full" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Beauty & Personal Care Section */}
      {cfg.beautyPersonalCare?.enabled !== false && (
        <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9" }}>
          <h4 className="font-bold tracking-tight" style={recipeTypography(theme, "sectionTitle")}>
            {cfg.beautyPersonalCare?.title || "Beauty & Personal Care"}
          </h4>

          {/* Row 1 */}
          <div className="flex gap-2">
            {beautyRow1.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className={`${idx === 0 ? "flex-[2]" : "flex-[1]"} border p-1.5 flex flex-col items-center transition-all`}
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-14 w-full overflow-hidden flex items-center justify-center p-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-semibold text-center line-clamp-2 leading-tight" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-1.5">
            {beautyRow2.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="border p-1.5 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-12 w-full overflow-hidden flex items-center justify-center p-0.5"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-semibold text-center truncate w-full" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-1.5">
            {beautyRow3.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="border p-1.5 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-12 w-full overflow-hidden flex items-center justify-center p-0.5"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-semibold text-center truncate w-full" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Household Essentials Section */}
      {cfg.householdEssentials?.enabled !== false && (
        <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9" }}>
          <h4 className="font-bold tracking-tight" style={recipeTypography(theme, "sectionTitle")}>
            {cfg.householdEssentials?.title || "Household Essentials"}
          </h4>

          {/* Row 1 */}
          <div className="flex gap-2">
            {householdRow1.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="flex-1 border p-2 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-16 w-full overflow-hidden flex items-center justify-center p-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-bold text-center line-clamp-1" style={recipeTypography(theme, "bodySmall")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-1.5">
            {householdRow2.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="border p-1.5 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-12 w-full overflow-hidden flex items-center justify-center p-0.5"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-semibold text-center truncate w-full" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Hobbies & Interests Section */}
      {cfg.hobbiesInterests?.enabled !== false && (
        <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9" }}>
          <h4 className="font-bold tracking-tight" style={recipeTypography(theme, "sectionTitle")}>
            {cfg.hobbiesInterests?.title || "Hobbies & Interests"}
          </h4>
          <div className="grid grid-cols-4 gap-1.5">
            {hobbiesCards.map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="border p-1.5 flex flex-col items-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div
                  className="h-12 w-full overflow-hidden flex items-center justify-center p-0.5"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
                  }}
                >
                  <img
                    src={resolveImgUrl(card.image)}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="mt-1 font-semibold text-center truncate w-full" style={recipeTypography(theme, "caption")}>
                  {card.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 16. steal_deals Showcase section
function StealDealsWidget({ theme }: WidgetRenderProps) {
  const [cfg, setCfg] = useState<any>({
    title: "Steal Deals",
    subtitle: "Add Any 10 Items",
    storeTabs: [
      { isTrending: true, title: "Trending", icon: "🔥" },
      { price: "₹9", label: "Store", icon: resolveImgUrl("assets/image/steal_tab_gift.png") },
      { price: "₹19", label: "Store", icon: resolveImgUrl("assets/image/steal_tab_basket.png") },
      { price: "₹29", label: "Store", icon: resolveImgUrl("assets/image/steal_tab_bag.png") },
    ],
    categories: [
      { name: "ALL", isAll: true },
      { name: "Cold Drinks & Juices", icon: resolveImgUrl("assets/image/steal_cat_drinks_new.png") },
      { name: "Skincare", icon: resolveImgUrl("assets/image/steal_cat_skincare_new.png") },
      { name: "Masala & Dry Fruits", icon: resolveImgUrl("assets/image/steal_cat_dryfruit_new.png") },
      { name: "Snacks", icon: resolveImgUrl("assets/image/steal_cat_snack_new.png") },
    ],
    row1Products: [
      {
        title: "Koparo Clean Natural All-Purpose Cleaner - Mandarin Orange, 3x500 ml Multipack",
        unit: "80 g",
        price: "₹897",
        mrp: "₹897",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/crop_cleaning.png"),
        badge: "3 PACKS",
        multiPack: true,
      },
      {
        title: "Cool Drinks",
        unit: "1 pack (237 g)",
        price: "₹20",
        mrp: "₹20",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/sdColdDrinks.png"),
        multiPack: false,
      },
      {
        title: "DP Yellow Sticky Notes - Paper, BB1283, 2 x 1 pc Multipack",
        unit: "1 pack (17 g)",
        price: "₹198",
        mrp: "₹198",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/crop_stationery.png"),
        badge: "2 PACKS",
        multiPack: true,
      },
    ],
    row2Products: [
      {
        title: "SE7EN Fancy Cap - Eco Friendly, For Birthday Parties, 1 pc",
        unit: "100 ml",
        price: "₹10",
        mrp: "₹10",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/crop_toys_games.png"),
        multiPack: false,
      },
      {
        title: "Patanjali Super - Dishwash Bar, 3x145 g Multipack",
        unit: "400 g",
        price: "₹10",
        mrp: "₹10",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/steal_rage.png"),
        badge: "3 PACKS",
        multiPack: true,
      },
      {
        title: "Bodyguard Herbal Mosquito Repellent Spray With Goodness Of Essential Oils And Aloe Vera Extracts",
        unit: "100 ml",
        price: "₹10",
        mrp: "₹10",
        discount: "DEAL",
        image: resolveImgUrl("assets/image/crop_home_needs.png"),
        multiPack: true,
      },
    ],
  });

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/steal-deals")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setCfg((prev: any) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  if (cfg.enabled === false) return null;

  return (
    <div
      className="p-3 border space-y-3 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
        color: theme.textPrimary,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-5 h-5 shrink-0" style={{ fill: theme.primary, color: theme.primary }} />
          <div>
            <h2 className="font-black leading-none" style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}>
              {cfg.title || "Steal Deals"}
            </h2>
            <p className="font-medium mt-0.5" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
              {cfg.subtitle || "Add Any 10 Items"}
            </p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 font-bold flex items-center gap-0.5 border cursor-pointer"
          style={{
            backgroundColor: `${theme.primary}15`,
            color: theme.primary,
            borderColor: `${theme.primary}30`,
            borderRadius: `${theme.buttonRadius}px`,
            ...recipeTypography(theme, "caption"),
          }}
        >
          {cfg.viewAllLinkText || "View All"} &gt;
        </div>
      </div>

      {/* Store Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {cfg.storeTabs?.map((tab: any, idx: number) => (
          <div
            key={idx}
            className={`shrink-0 p-2 h-14 flex items-center border transition-all ${
              tab.isTrending ? "w-24 text-white flex-col justify-center" : "w-20 justify-between px-2"
            }`}
            style={{
              background: tab.isTrending
                ? `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`
                : theme.surfaceElevated,
              borderColor: tab.isTrending ? "transparent" : (theme.isDark ? "#3f3f46" : "#f1f5f9"),
              borderRadius: `${Math.max(8, theme.cardRadius - 6)}px`,
              boxShadow: recipeElevation(theme, "subtle"),
            }}
          >
            {tab.isTrending ? (
              <>
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <span>🔥</span> {tab.title}
                </div>
                <div className="w-5 h-0.5 bg-white/80 rounded mt-1" />
              </>
            ) : (
              <>
                <div>
                  <div className="font-extrabold leading-none" style={{ ...recipeTypography(theme, "bodySmall"), color: theme.textPrimary }}>
                    {tab.price}
                  </div>
                  <div style={{ ...recipeTypography(theme, "caption"), color: theme.textMuted }}>{tab.label}</div>
                </div>
                {tab.icon && (
                  <img src={resolveImgUrl(tab.icon)} alt="" className="w-6 h-6 object-contain" />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Category Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {cfg.categories?.map((cat: any, idx: number) => (
          <div
            key={idx}
            className="shrink-0 px-2.5 py-1 font-semibold flex items-center gap-1 border transition-all"
            style={recipeChip(theme, !!cat.isAll)}
          >
            {cat.isAll ? (
              <span className="text-[10px]">⊞</span>
            ) : (
              cat.icon && (
                <img src={resolveImgUrl(cat.icon)} alt="" className="w-3.5 h-3.5 object-contain" />
              )
            )}
            <span>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Row 1 3-Column Product Grid */}
      <div className="grid grid-cols-3 gap-2">
        {cfg.row1Products?.map((p: any, idx: number) => {
          const productStyles = recipeProductCard(theme, { elevated: true });
          return (
            <div
              key={idx}
              className="p-1.5 border flex flex-col justify-between relative overflow-hidden transition-all"
              style={productStyles.card}
            >
              <div
                className="overflow-hidden aspect-[1.15] flex items-center justify-center relative p-1"
                style={productStyles.imageWell}
              >
                <img src={resolveImgUrl(p.image)} alt={p.title} className="w-full h-full object-contain" />
                {p.badge && (
                  <div
                    className="absolute top-1 left-1 px-1 py-0.2 font-black text-white"
                    style={{
                      backgroundColor: theme.secondary,
                      borderRadius: `${theme.radiusSm}px`,
                      ...recipeTypography(theme, "caption"),
                      fontSize: "6px",
                    }}
                  >
                    {p.badge}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span
                  className="text-white px-1 py-0.2 rounded font-black"
                  style={{
                    backgroundColor: theme.primary,
                    ...recipeTypography(theme, "price"),
                    fontSize: "9px",
                  }}
                >
                  {p.price}
                </span>
                <span style={productStyles.mrp}>
                  {p.mrp}
                </span>
              </div>
              <div style={productStyles.discount}>
                {p.discount}
              </div>
              <div className="line-clamp-2 mt-0.5 leading-tight" style={productStyles.title}>
                {p.title}
              </div>
              <div style={productStyles.unit}>{p.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Row 2 3-Column Product Grid */}
      <div className="grid grid-cols-3 gap-2">
        {cfg.row2Products?.map((p: any, idx: number) => {
          const productStyles = recipeProductCard(theme, { elevated: true });
          return (
            <div
              key={idx}
              className="p-1.5 border flex flex-col justify-between relative overflow-hidden transition-all"
              style={productStyles.card}
            >
              <div
                className="overflow-hidden aspect-[1.15] flex items-center justify-center relative p-1"
                style={productStyles.imageWell}
              >
                <img src={resolveImgUrl(p.image)} alt={p.title} className="w-full h-full object-contain" />
                {p.badge && (
                  <div
                    className="absolute bottom-1 left-1 px-1 py-0.2 font-black text-white"
                    style={{
                      backgroundColor: theme.success,
                      borderRadius: `${theme.radiusSm}px`,
                      ...recipeTypography(theme, "caption"),
                      fontSize: "6px",
                    }}
                  >
                    {p.badge}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span
                  className="text-white px-1 py-0.2 rounded font-black"
                  style={{
                    backgroundColor: theme.primary,
                    ...recipeTypography(theme, "price"),
                    fontSize: "9px",
                  }}
                >
                  {p.price}
                </span>
                <span style={productStyles.mrp}>
                  {p.mrp}
                </span>
              </div>
              <div style={productStyles.discount}>
                {p.discount}
              </div>
              <div className="line-clamp-2 mt-0.5 leading-tight" style={productStyles.title}>
                {p.title}
              </div>
              <div style={productStyles.unit}>{p.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 17. featured_offers Showcase section
function FeaturedOffersWidget({ theme }: WidgetRenderProps) {
  const [cfg, setCfg] = useState<any>({
    featured: {
      enabled: true,
      title: "Featured",
      subtitle: "Everything you need, in one place",
      topCategoriesText: "TOP CATEGORIES",
      cards: [
        { name: "Grocery", image: resolveImgUrl("assets/image/featGrocery.png") },
        { name: "Food", image: resolveImgUrl("assets/image/featFood.png") },
        { name: "Dineout", image: resolveImgUrl("assets/image/featDineout.png") },
        { name: "Fresh", image: resolveImgUrl("assets/image/featFresh.png") },
        { name: "Bakery", image: resolveImgUrl("assets/image/feat_bakery.png") },
        { name: "Beauty", image: resolveImgUrl("assets/image/featBeauty.png") },
        { name: "Meat", image: resolveImgUrl("assets/image/featMeatSeafood.png") },
        { name: "Parcel", image: resolveImgUrl("assets/image/featParcel.png") },
        { name: "Pharmacy", image: resolveImgUrl("assets/image/featPharmacy.png") },
        { name: "Services", image: resolveImgUrl("assets/image/featServices.png") },
      ],
    },
    todaysOffers: {
      enabled: true,
      title: "Today's Offers",
      viewAllText: "View All",
      offers: [
        { image: resolveImgUrl("assets/image/offer_restaurant.png") },
        { image: resolveImgUrl("assets/image/offer_fruits_veg.png") },
      ],
    },
    coupons: {
      enabled: true,
      title: "Coupons & Offers",
      coupons: [
        { discountText: "Flat 50% OFF", codeText: "Use QUICK50", bgColor: "#D1FAE5", borderColor: "#A7F3D0" },
        { discountText: "Flat 30% OFF", codeText: "Use FIRST30", bgColor: "#FEF3C7", borderColor: "#FDE68A" },
        { discountText: "Up to 20% OFF", codeText: "Use FREESHIP", bgColor: "#FCE7F3", borderColor: "#FBCFE8" },
      ],
    },
  });

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/featured-offers")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setCfg((prev: any) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  const featuredCards = cfg.featured?.cards || [];
  const todaysOffers = cfg.todaysOffers?.offers || [];
  const coupons = cfg.coupons?.coupons || [];

  return (
    <div className="space-y-3">
      {/* 1. Featured Arches */}
      <div
        className="p-3 border space-y-2 transition-all"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
          borderRadius: `${theme.cardRadius}px`,
          boxShadow: recipeElevation(theme, "card"),
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="p-1 rounded text-xs"
              style={{
                backgroundColor: `${theme.accent}20`,
                color: theme.accent,
                borderRadius: `${theme.radiusSm}px`,
              }}
            >
              👑
            </span>
            <div>
              <h3 className="font-black leading-none" style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}>
                {cfg.featured?.title || "Featured"}
              </h3>
              <p className="mt-0.5" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
                {cfg.featured?.subtitle || "Everything you need, in one place"}
              </p>
            </div>
          </div>
          <div
            className="px-2 py-0.5 font-bold border cursor-pointer"
            style={{
              backgroundColor: `${theme.primary}15`,
              color: theme.primary,
              borderColor: `${theme.primary}30`,
              borderRadius: `${theme.buttonRadius}px`,
              ...recipeTypography(theme, "caption"),
            }}
          >
            {cfg.featured?.topCategoriesText || "TOP CATEGORIES"} →
          </div>
        </div>

        <div className="mt-2.5 overflow-x-auto pb-1 no-scrollbar space-y-2">
          {/* Row 1 */}
          <div className="flex gap-2 min-w-max">
            {featuredCards.slice(0, 5).map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="w-16 h-16 border flex items-center justify-center p-0.5 transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <img
                  src={resolveImgUrl(card.image)}
                  alt={card.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex gap-2 min-w-max">
            {featuredCards.slice(5, 10).map((card: any, idx: number) => (
              <div
                key={card.id || idx}
                className="w-16 h-16 border flex items-center justify-center p-0.5 transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <img
                  src={resolveImgUrl(card.image)}
                  alt={card.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Today's Offers */}
      {todaysOffers.length > 0 && (
        <div
          className="p-3 border space-y-2 transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
            color: theme.textPrimary,
          }}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-black leading-none" style={{ ...recipeTypography(theme, "sectionTitle"), color: theme.textPrimary }}>
              {cfg.todaysOffers?.title || "Today's Offers"}
            </h4>
            <span className="font-bold cursor-pointer" style={{ ...recipeTypography(theme, "bodySmall"), color: theme.primary }}>
              {cfg.todaysOffers?.viewAllText || "View All"} →
            </span>
          </div>
          <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {todaysOffers.map((offer: any, idx: number) => (
              <div
                key={offer.id || idx}
                className="shrink-0 w-48 h-24 border relative overflow-hidden transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <img
                  src={resolveImgUrl(offer.image)}
                  alt={offer.title || ""}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Coupons & Offers */}
      {coupons.length > 0 && (
        <div
          className="p-3 border space-y-2 transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
            color: theme.textPrimary,
          }}
        >
          <h4 className="font-black leading-none" style={{ ...recipeTypography(theme, "sectionTitle"), color: theme.textPrimary }}>
            {cfg.coupons?.title || "Coupons & Offers"}
          </h4>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {coupons.map((coupon: any, idx: number) => (
              <div
                key={coupon.id || idx}
                style={{
                  backgroundColor: theme.isDark ? theme.surfaceElevated : (coupon.bgColor || "#D1FAE5"),
                  borderColor: theme.isDark ? "#3f3f46" : (coupon.borderColor || "#A7F3D0"),
                  borderRadius: `${theme.radiusMd}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
                className="shrink-0 w-32 p-2 border flex items-center gap-1.5 transition-all"
              >
                <div
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: theme.primary }}
                >
                  %
                </div>
                <div className="min-w-0">
                  <div className="font-black leading-tight truncate" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                    {coupon.discountText}
                  </div>
                  <div className="font-medium truncate" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary, fontSize: "7.5px" }}>
                    {coupon.codeText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 18. category_grids Showcase section
function CategoryGridsWidget({ theme }: WidgetRenderProps) {
  const [data, setData] = useState<any>(null);

  React.useEffect(() => {
    fetch("/BuggyCxp/api/grocery/category-grids")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const gk = data?.groceryKitchen;
  const sd = data?.snacksDrinks;

  const gkEnabled = gk?.enabled !== false;
  const sdEnabled = sd?.enabled !== false;

  if (!gkEnabled && !sdEnabled) return null;

  const row1 = gk?.row1Cards?.length ? gk.row1Cards : [
    { title: "Fruits & Vegetables", image: "assets/image/gkFruitsVeg.png" },
    { title: "Dairy, Bread & Eggs", image: "assets/image/gkDairyBread.png" },
    { title: "Atta, Rice & Dals", image: "assets/image/gkAttaRice.png" },
    { title: "Meat, Fish & Eggs", image: "assets/image/gkMeatFish.png" },
  ];
  const row2 = gk?.row2Cards?.length ? gk.row2Cards : [
    { title: "Masala & Dry Fruits", image: "assets/image/gkMasalaDryFruits.png" },
    { title: "Breakfast & Sauces", image: "assets/image/gkBreakfastSauces.png" },
    { title: "Packaged Food", image: "assets/image/gkPackagedFood.png" },
    { title: "Cooking Essentials", image: "assets/image/gkCookingEssentials.png" },
  ];

  const snackBanners = sd?.banners?.length ? sd.banners : [
    { title: "Cafe Specials", image: "assets/image/sdCafeSpecials.png" },
    { title: "Ice Creams & More", image: "assets/image/sdIceCreams.png" },
  ];
  const snackChips = (sd?.bottomCards?.length ? sd.bottomCards : sd?.chips?.length ? sd.chips : [
    { title: "Cold Drinks", image: "assets/image/sdColdDrinks.png" },
    { title: "Munchies", image: "assets/image/sdMunchies.png" },
    { title: "Biscuits", image: "assets/image/sdBiscuitsCookies.png" },
  ]);

  return (
    <div className="space-y-3">
      {/* 1. Grocery & Kitchen */}
      {gkEnabled && (
        <div
          className="p-3 border space-y-3 transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
            color: theme.textPrimary,
          }}
        >
          <div>
            <h3 className="font-black leading-none" style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}>
              {gk?.title || "Grocery & Kitchen"}
            </h3>
            <p className="mt-0.5" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
              {gk?.subtitle || "Fresh essentials for your daily needs"}
            </p>
          </div>

          <div
            className="overflow-hidden border h-24 relative transition-all"
            style={{
              borderRadius: `${Math.max(8, theme.cardRadius - 4)}px`,
              borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
              boxShadow: recipeElevation(theme, "subtle"),
            }}
          >
            <img
              src={resolveImgUrl(gk?.heroBanner?.image || "assets/image/gkHeroBanner.png")}
              alt="Grocery Banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {row1.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-1.5 border flex flex-col items-center text-center transition-all"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                    borderRadius: `${theme.cardRadius}px`,
                    boxShadow: recipeElevation(theme, "subtle"),
                  }}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src={resolveImgUrl(item.image)} alt={item.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="font-bold line-clamp-2 mt-1 leading-tight" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {row2.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-1.5 border flex flex-col items-center text-center transition-all"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                    borderRadius: `${theme.cardRadius}px`,
                    boxShadow: recipeElevation(theme, "subtle"),
                  }}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src={resolveImgUrl(item.image)} alt={item.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="font-bold line-clamp-2 mt-1 leading-tight" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Snacks & Drinks */}
      {sdEnabled && (
        <div
          className="p-3 border space-y-3 transition-all"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${theme.cardRadius}px`,
            boxShadow: recipeElevation(theme, "card"),
            color: theme.textPrimary,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black leading-none" style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}>
                {(sd?.title1 ? `${sd.title1}${sd.title2 || ""}` : sd?.title) || "Snacks & Drinks"}
              </h3>
              <p className="mt-0.5" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
                {sd?.subtitle || "Tasty treats for every moment"}
              </p>
            </div>
            <span className="font-bold cursor-pointer" style={{ ...recipeTypography(theme, "bodySmall"), color: theme.primary }}>
              View All →
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {snackBanners.map((b: any, idx: number) => (
              <div
                key={idx}
                className="h-20 overflow-hidden border transition-all"
                style={{
                  borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <img src={resolveImgUrl(b.image)} alt={b.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {snackChips.map((c: any, idx: number) => (
              <div
                key={idx}
                className="shrink-0 w-24 p-1.5 border flex flex-col items-center text-center transition-all"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
                  borderRadius: `${theme.cardRadius}px`,
                  boxShadow: recipeElevation(theme, "subtle"),
                }}
              >
                <div className="w-9 h-9 flex items-center justify-center">
                  <img src={resolveImgUrl(c.image)} alt={c.title} className="max-h-full max-w-full object-contain" />
                </div>
                <span className="font-bold mt-1 line-clamp-1" style={{ ...recipeTypography(theme, "caption"), color: theme.textPrimary }}>
                  {c.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 19. curated_products Showcase section
function CuratedProductsWidget({ theme }: WidgetRenderProps) {
  const [data, setData] = useState<any>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/BuggyCxp/api/grocery/curated-products")
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (data?.enabled === false) return null;

  const rawProducts = data?.products?.length
    ? data.products
    : [
        { name: "Fresh Tomato", unit: "1 kg", price: "₹557", mrp: "₹576", image: resolveImgUrl("assets/image/curated_tomato.png") },
        { name: "Aashirvaad Atta – Whole Wheat", unit: "5 kg", price: "₹306", mrp: "₹318", image: resolveImgUrl("assets/image/curated_atta.png") },
        { name: "Fortune Sun Lite Sunflower Oil", unit: "1 L", price: "₹113", mrp: "₹125", image: resolveImgUrl("assets/image/curated_oil.png") },
        { name: "Britannia Good Day Cookies", unit: "300 g", price: "₹67", mrp: "₹103", image: resolveImgUrl("assets/image/curated_cookies.png") },
        { name: "India Gate Basmati Rice", unit: "1 kg", price: "₹339", mrp: "₹375", image: resolveImgUrl("assets/image/curated_rice.png") },
        { name: "Beauty Essentials", unit: "1 unit", price: "₹199", mrp: "₹211", image: resolveImgUrl("assets/image/curated_beauty.png") },
      ];

  const title = data?.title || "Curated for you";
  const subtitle = data?.subtitle || "Handpicked products just for you";
  const viewAllText = data?.viewAllText ? `${data.viewAllText} →` : "View All →";

  return (
    <div
      className="p-3 border space-y-3 transition-all"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
        borderRadius: `${theme.cardRadius}px`,
        boxShadow: recipeElevation(theme, "card"),
        color: theme.textPrimary,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center text-sm shadow-xs"
            style={{
              backgroundColor: `${theme.accent}24`,
              borderRadius: `${theme.radiusSm}px`,
            }}
          >
            👑
          </div>
          <div>
            <h3 className="font-black leading-none" style={{ ...recipeTypography(theme, "h2"), color: theme.textPrimary }}>
              {title}
            </h3>
            <p className="mt-0.5" style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>
              {subtitle}
            </p>
          </div>
        </div>
        <span className="font-bold cursor-pointer" style={{ ...recipeTypography(theme, "bodySmall"), color: theme.primary }}>
          {viewAllText}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rawProducts.map((p: any, idx: number) => {
          const priceDisplay = typeof p.price === "number" ? `₹${p.price}` : (p.price || "");
          const orig = p.originalPrice ?? p.mrp;
          const origDisplay = typeof orig === "number" ? `₹${orig}` : (orig || "");
          const name = p.name || p.title || "";
          const img = resolveImgUrl(p.image);
          const productStyles = recipeProductCard(theme, { elevated: true });

          return (
            <div
              key={p.id || idx}
              className="p-1.5 border flex flex-col justify-between transition-all relative overflow-hidden"
              style={productStyles.card}
            >
              {theme.overlay?.enabled && (
                <DecorationRenderer
                  decorations={theme.overlay.decorations}
                  placement="product_card"
                  className="absolute top-1 left-1 pointer-events-none z-10"
                />
              )}
              <div
                className="h-16 flex items-center justify-center p-1 overflow-hidden"
                style={productStyles.imageWell}
              >
                {img ? (
                  <img src={img} alt={name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
              </div>
              <div className="mt-1">
                <div className="line-clamp-2 leading-tight" style={productStyles.title}>{name}</div>
                <div className="mt-0.5" style={productStyles.unit}>{p.unit}</div>
              </div>
              <div
                className="flex items-center justify-between mt-1 pt-1 border-t"
                style={{ borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9" }}
              >
                <div>
                  <span style={productStyles.price}>{priceDisplay}</span>
                  {origDisplay && origDisplay !== priceDisplay && (
                    <span className="ml-0.5" style={productStyles.mrp}>{origDisplay}</span>
                  )}
                </div>
                <button
                  type="button"
                  style={recipeButton(theme, "mini_add")}
                >
                  ADD
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 20. flash_deals Showcase section
function FlashDealsWidget({ theme }: WidgetRenderProps) {
  const [data, setData] = useState<any>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/BuggyCxp/api/grocery/flash-deals")
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (data?.enabled === false) return null;

  const rawDeals = data?.deals?.length
    ? data.deals
    : [
        {
          title: "Yoga Bar High Protein Muesli",
          unit: "1 pack (1 kg)",
          price: "₹454",
          mrp: "₹890",
          image: resolveImgUrl("assets/image/crop_flash_yogabar.png"),
          hasSelectBadge: true,
        },
        {
          title: "Veeba Tomato Ketchup",
          unit: "1 pack (900 g)",
          price: "₹82",
          mrp: "₹120",
          image: resolveImgUrl("assets/image/crop_flash_veeba.png"),
          hasSelectBadge: false,
        },
        {
          title: "Saffola Forest Honey",
          unit: "1 pc (250 g)",
          price: "₹131",
          mrp: "₹180",
          image: resolveImgUrl("assets/image/crop_flash_saffola.png"),
          hasSelectBadge: false,
        },
      ];

  const title = data?.title || "Flash Deals: All Time Low";
  const subtitle = data?.subtitle || "Limited Time Deals";
  const dealStyles = recipeDealCard(theme, "flash");

  return (
    <div
      className="p-3 border space-y-2.5 transition-all"
      style={dealStyles.container}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center text-sm shadow-xs"
            style={{
              backgroundColor: `${theme.warning}24`,
              borderRadius: `${theme.radiusSm}px`,
            }}
          >
            ⚡
          </div>
          <div>
            <h4 className="leading-tight" style={dealStyles.title}>{title}</h4>
            <p style={{ ...recipeTypography(theme, "caption"), color: theme.textSecondary }}>{subtitle}</p>
          </div>
        </div>
        <div
          className="px-2 py-0.5 border"
          style={dealStyles.badge}
        >
          ⚡ Ending Soon
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {rawDeals.map((deal: any, idx: number) => {
          const priceDisplay = typeof deal.price === "number" ? `₹${deal.price}` : (deal.price || "");
          const orig = deal.originalPrice ?? deal.mrp;
          const origDisplay = typeof orig === "number" ? `₹${orig}` : (orig || "");
          const title = deal.title || deal.name || "";
          const img = resolveImgUrl(deal.image);
          const productStyles = recipeProductCard(theme, { elevated: true });

          return (
            <div
              key={deal.id || idx}
              className="w-32 shrink-0 border overflow-hidden flex flex-col justify-between transition-all relative"
              style={productStyles.card}
            >
              {theme.overlay?.enabled && (
                <DecorationRenderer
                  decorations={theme.overlay.decorations}
                  placement="product_card"
                  className="absolute top-1 left-1 pointer-events-none z-10"
                />
              )}
              <div
                className="relative h-24 w-full p-1.5 flex items-center justify-center"
                style={productStyles.imageWell}
              >
                {img ? (
                  <img src={img} alt={title} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl">⚡</span>
                )}
                {deal.hasSelectBadge && (
                  <div
                    className="absolute left-1.5 top-1.5 px-1 py-0.2 uppercase tracking-wider"
                    style={{ ...recipeBadge(theme, "select"), fontSize: "7px" }}
                  >
                    SELECT &gt;
                  </div>
                )}
                <div
                  className="absolute right-1.5 top-1.5 rounded-full p-0.5 shadow-2xs"
                  style={{ backgroundColor: `${theme.surface}e6` }}
                >
                  <Heart className="h-2.5 w-2.5 text-rose-500 fill-rose-500" />
                </div>
              </div>

              <div className="p-1.5 space-y-1">
                <div className="line-clamp-1 leading-tight" style={productStyles.title}>{title}</div>
                <div style={productStyles.unit}>{deal.unit}</div>
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span style={productStyles.price}>{priceDisplay}</span>
                    {origDisplay && origDisplay !== priceDisplay && (
                      <span className="ml-0.5" style={productStyles.mrp}>{origDisplay}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    style={recipeButton(theme, "mini_add")}
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 22. flavour_fest / hero_fest_deals
function FlavourFestWidget({ props, theme }: WidgetRenderProps) {
  const [cfg, setCfg] = useState<any>({
    title: "FLAVOURFEST",
    orderButtonText: "ORDER NOW",
    leftMascot: { value: "🍟🎷" },
    rightMascot: { value: "🍔🎉" },
    theme: {
      containerGradient: ["#2E0016", "#21000F", "#19000B"],
      titleColor: "#FFE500",
      buttonBgColor: "#1F010D",
      buttonBorderColor: "#FF5200CC",
      buttonTextColor: "#FFD54F",
      cardBorderColor: "#FF80AB66",
      pillBarBgColor: "#F1F3F5",
    },
    cards: [
      { id: "1", title: "Get\n70% OFF", subtitle: "UP TO ₹120", graphicType: "coupon", gradient: ["#E91E63", "#C2185B", "#880E4F"] },
      { id: "2", title: "Get A\nFree Treat", subtitle: "ON ₹199+", graphicType: "cupcake", gradient: ["#E91E63", "#C2185B", "#880E4F"] },
      { id: "3", title: "Binge-Worthy\nOffers", subtitle: "TOP RESTAURANTS", graphicType: "badge150", gradient: ["#E91E63", "#C2185B", "#880E4F"] },
      { id: "4", title: "Discounts\nFrom Top Brands", subtitle: "PRICE CRASH", graphicType: "priceCrash", gradient: ["#E91E63", "#C2185B", "#880E4F"] },
    ],
    filterTabs: [
      { id: "tab_1", label: "TOP RATED" },
      { id: "tab_2", label: "FOOD IN 15 MINS" },
    ],
  });
  const [filterIdx, setFilterIdx] = useState(0);

  useEffect(() => {
    fetch("/BuggyCxp/api/grocery/flavour-fest")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) setCfg(res.data);
      })
      .catch(() => {});
  }, []);

  if (cfg.enabled === false) return null;

  return (
    <div
      className="p-3 border relative overflow-hidden space-y-3 transition-all rounded-2xl"
      style={{
        background: `linear-gradient(to bottom, ${cfg.theme?.containerGradient?.[0] || "#2E0016"}, ${cfg.theme?.containerGradient?.[1] || "#21000F"}, ${cfg.theme?.containerGradient?.[2] || "#19000B"})`,
        borderColor: cfg.theme?.cardBorderColor || "#FF80AB33",
      }}
    >
      <div className="flex items-center justify-between px-1">
        {cfg.leftMascot?.enabled !== false ? (
          <div
            className="flex items-center justify-center rounded-full text-lg shrink-0 shadow-sm"
            style={{
              width: `${cfg.leftMascot?.size || 38}px`,
              height: `${cfg.leftMascot?.size || 38}px`,
              backgroundColor: cfg.leftMascot?.starburstColor || "#E91E634D",
            }}
          >
            {cfg.leftMascot?.value?.startsWith("http") ? (
              <img src={cfg.leftMascot.value} alt="" className="h-6 w-6 object-contain" />
            ) : (
              cfg.leftMascot?.value || "🍟🎷"
            )}
          </div>
        ) : (
          <div style={{ width: `${cfg.leftMascot?.size || 38}px`, height: `${cfg.leftMascot?.size || 38}px` }} />
        )}

        <div className="text-center flex-1 mx-2">
          <h2
            className="font-black text-lg tracking-wider leading-none"
            style={{
              color: cfg.theme?.titleColor || "#FFE500",
              textShadow: "0 2px 0 #9E4B00, 0 4px 6px #5A001F",
            }}
          >
            {cfg.title || "FLAVOURFEST"}
          </h2>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
            style={{
              backgroundColor: cfg.theme?.buttonBgColor || "#1F010D",
              borderColor: cfg.theme?.buttonBorderColor || "#FF5200CC",
              color: cfg.theme?.buttonTextColor || "#FFD54F",
              borderWidth: "1.2px",
            }}
          >
            <span>{cfg.orderButtonText || "ORDER NOW"}</span>
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>

        {cfg.rightMascot?.enabled !== false ? (
          <div
            className="flex items-center justify-center rounded-full text-lg shrink-0 shadow-sm"
            style={{
              width: `${cfg.rightMascot?.size || 38}px`,
              height: `${cfg.rightMascot?.size || 38}px`,
              backgroundColor: cfg.rightMascot?.starburstColor || "#E91E634D",
            }}
          >
            {cfg.rightMascot?.value?.startsWith("http") ? (
              <img src={cfg.rightMascot.value} alt="" className="h-6 w-6 object-contain" />
            ) : (
              cfg.rightMascot?.value || "🍔🎉"
            )}
          </div>
        ) : (
          <div style={{ width: `${cfg.rightMascot?.size || 38}px`, height: `${cfg.rightMascot?.size || 38}px` }} />
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {cfg.cards?.map((card: any, idx: number) => {
          const grad = card.gradient || ["#E91E63", "#C2185B", "#880E4F"];
          return (
            <div
              key={card.id || idx}
              className="flex h-32 w-20 shrink-0 flex-col items-center justify-between rounded-2xl p-1.5 shadow"
              style={{
                background: `linear-gradient(to bottom, ${grad[0]}, ${grad[1] || grad[0]}, ${grad[2] || grad[0]})`,
                border: "1.2px solid rgba(255,128,171,0.4)",
              }}
            >
              <span className="text-center text-[9px] font-black leading-tight text-white whitespace-pre-line">
                {card.title}
              </span>
              <div className="my-auto flex items-center justify-center">
                {card.graphicType === "coupon" && (
                  <div className="flex gap-0.5">
                    <div className="h-7 w-5 rounded bg-yellow-400 text-amber-800 text-[9px] font-black flex items-center justify-center">%</div>
                    <div className="h-7 w-5 rounded bg-yellow-400 text-amber-800 text-[9px] font-black flex items-center justify-center">%</div>
                  </div>
                )}
                {card.graphicType === "cupcake" && <span className="text-xl">🧁🍰</span>}
                {card.graphicType === "badge150" && (
                  <div className="h-9 w-9 rounded-full border border-amber-300 bg-amber-600 flex flex-col items-center justify-center text-white text-[7px] font-black leading-none">
                    <span>₹150</span>
                    <span className="text-[5px]">OFF</span>
                  </div>
                )}
                {card.graphicType === "priceCrash" && (
                  <div className="rounded border border-pink-400 bg-black/80 px-1 py-0.5 text-center text-[7px] font-black text-white">
                    PRICE<br /><span className="text-yellow-300">CRASH</span>
                  </div>
                )}
                {card.graphicType === "emoji" && <span className="text-xl">{card.customEmoji || "🎁"}</span>}
                {card.graphicType === "custom_image" && card.customImage && (
                  <img src={card.customImage} alt="" className="h-8 w-8 object-contain" />
                )}
              </div>
              <span className="text-[7px] font-bold text-white/90 truncate max-w-full">
                {card.subtitle}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex h-8 items-center rounded-full p-1" style={{ backgroundColor: cfg.theme?.pillBarBgColor || "#F1F3F5" }}>
        <button
          type="button"
          onClick={() => setFilterIdx(0)}
          className={`flex-1 rounded-full py-0.5 text-center text-[9px] font-bold transition ${filterIdx === 0 ? "bg-white text-[#FF5200] shadow" : "text-slate-500"}`}
        >
          {cfg.filterTabs?.[0]?.label || "TOP RATED"}
        </button>
        <button
          type="button"
          onClick={() => setFilterIdx(1)}
          className={`flex-1 rounded-full py-0.5 text-center text-[9px] font-bold transition ${filterIdx === 1 ? "bg-white text-[#FF5200] shadow" : "text-slate-500"}`}
        >
          {cfg.filterTabs?.[1]?.label || "FOOD IN 15 MINS"}
        </button>
      </div>

      {/* Dynamic Showcase Items */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(() => {
          const activeTabId = cfg.filterTabs?.[filterIdx]?.id || (filterIdx === 0 ? "tab_1" : "tab_2");
          const allItems = Array.isArray(cfg.showcaseItems) && cfg.showcaseItems.length > 0 ? cfg.showcaseItems : [];
          const filtered = allItems.filter((it: any) => !it.tabId || it.tabId === "all" || it.tabId === activeTabId);
          const itemsToRender = filtered.length > 0 ? filtered : allItems;

          return itemsToRender.map((it: any, idx: number) => {
            const displayImg = it.image
              ? (it.image.startsWith("http") || it.image.startsWith("/")
                  ? it.image
                  : it.image.startsWith("assets/")
                    ? `/${it.image}`
                    : `http://localhost:8000/storage/product/${it.image.replace(/^product\//, "")}`)
              : "";

            return (
              <div
                key={it.id || idx}
                className="relative h-28 w-24 shrink-0 rounded-xl border border-slate-200 shadow-xs p-1.5 flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: cfg.theme?.showcaseCardBgColor || "#FFFFFF",
                  borderColor: cfg.theme?.cardBorderColor || "#E2E8F0",
                }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[7px] font-bold text-slate-800 truncate max-w-[58px] leading-tight" title={it.name}>
                    {it.name}
                  </span>
                  <span className="text-slate-400 text-[10px]">🤍</span>
                </div>

                <div className="text-center my-auto flex items-center justify-center h-12 overflow-hidden">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={it.name}
                      className="h-11 w-11 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{it.emoji || "🍰"}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="rounded bg-black/85 px-1 py-0.5 text-[7px] font-black text-white whitespace-pre-line leading-none">
                    {it.badge || `AT ₹${it.price}`}
                  </span>
                  {it.adBadge !== false && (
                    <span className="rounded bg-black/50 px-1 text-[6px] text-white/90">AD</span>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

// Master Widget Registry Dictionary
export const PREVIEW_WIDGET_COMPONENTS: Record<string, React.FC<WidgetRenderProps>> = {
  module_selector: ModuleSelectorWidget,
  search_entry: SearchEntryWidget,
  hero_campaign: CampaignMosaicWidget,
  banner_carousel: CampaignMosaicWidget,
  promo_grid: PromoGridWidget,
  category_grid: CategoryGridWidget,
  grouped_category_directory: CategoryGridWidget,
  product_rail: ProductRailWidget,
  personalized_recommendations: ProductRailWidget,
  recently_viewed_rail: ProductRailWidget,
  reorder_rail: ProductRailWidget,
  store_rail: StoreRailWidget,
  deal_countdown: DealCountdownWidget,
  intent_tab_rail: IntentTabRailWidget,
  segmented_collection: IntentTabRailWidget,
  campaign_mosaic: CampaignMosaicWidget,
  order_again_mosaic: CampaignMosaicWidget,
  mini_cart_bar: MiniCartBarWidget,
  spacer: SpacerWidget,
  operational_notice: OperationalNoticeWidget,
  commerce_notice: OperationalNoticeWidget,
  rich_content: OperationalNoticeWidget,
  // Section fallbacks matching User_app & BuggyDM IDs
  flavour_fest: FlavourFestWidget,
  hero_fest_deals: FlavourFestWidget,
  hero_fest: FlavourFestWidget,
  hero_deals: FlavourFestWidget,
  steal_deals: StealDealsWidget,
  featured_offers: FeaturedOffersWidget,
  salon_bloom: SalonBloomWidget,
  category_grids: CategoryGridsWidget,
  curated_products: CuratedProductsWidget,
  lifestyle_categories: LifestyleCategoriesWidget,
  flash_deals: FlashDealsWidget,
  store_explorer: StoreExplorerWidget,
  explore_stores: StoreExplorerWidget,
  explore_restaurant: StoreExplorerWidget,
};

export function PreviewWidgetRegistry(props: WidgetRenderProps) {
  const Component = PREVIEW_WIDGET_COMPONENTS[props.type];
  if (!Component) {
    return <UnsupportedWidget type={props.type} id={props.id} version={props.version} />;
  }
  return <Component {...props} />;
}
