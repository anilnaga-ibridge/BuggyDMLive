export interface FlavourFestShowcaseItem {
  id: string;
  name: string;
  price: number;
  badge: string; // e.g. "ITEMS AT ₹90", "AT ₹120"
  image?: string;
  emoji?: string;
  adBadge?: boolean; // whether to show AD
  tabId?: string; // tab_1, tab_2, or "all"
  itemId?: number | null;
  searchQuery?: string;
}

export interface FlavourFestCard {
  id: string;
  title: string;
  subtitle: string;
  searchQuery: string;
  graphicType: "coupon" | "cupcake" | "badge150" | "priceCrash" | "custom_image" | "emoji";
  customImage?: string;
  customEmoji?: string;
  gradient: string[];
  textColor?: string;
}

export interface FilterTab {
  id: string;
  label: string;
  filterType: string;
}

export interface MascotConfig {
  enabled?: boolean;
  type: string;
  value: string;
  starburstColor: string;
  size?: number;
}

export interface FlavourFestConfig {
  enabled: boolean;
  title: string;
  orderButtonText: string;
  orderButtonQuery: string;
  leftMascot: MascotConfig;
  rightMascot: MascotConfig;
  theme: {
    containerGradient: string[];
    titleColor: string;
    titleStrokeColor: string;
    titleShadowColor: string;
    buttonBgColor: string;
    buttonBorderColor: string;
    buttonTextColor: string;
    cardDefaultGradient: string[];
    cardBorderColor: string;
    pillBarBgColor: string;
    pillActiveBgColor: string;
    pillActiveTextColor: string;
    pillInactiveTextColor: string;
    showcaseCardBgColor?: string;
    // Radius (Corners)
    containerRadius?: number;
    cardRadius?: number;
    buttonRadius?: number;
    pillRadius?: number;
    showcaseCardRadius?: number;
    // Borders
    containerBorderWidth?: number;
    containerBorderColor?: string;
    cardBorderWidth?: number;
    buttonBorderWidth?: number;
    showcaseCardBorderWidth?: number;
    showcaseCardBorderColor?: string;
  };
  cards: FlavourFestCard[];
  filterTabs: FilterTab[];
  showcaseItems: FlavourFestShowcaseItem[];
  updatedAt?: string;
}

export const DEFAULT_FLAVOUR_FEST_CONFIG: FlavourFestConfig = {
  enabled: true,
  title: "FLAVOURFEST FOOD",
  orderButtonText: "ORDER NOW",
  orderButtonQuery: "offer",
  leftMascot: {
    type: "emoji",
    value: "🍟🎷",
    starburstColor: "#E91E634D",
  },
  rightMascot: {
    type: "emoji",
    value: "🍔🎉",
    starburstColor: "#E91E634D",
  },
  theme: {
    containerGradient: ["#9c4040", "#1E0303", "#e1b2b2"],
    titleColor: "#FFE500",
    titleStrokeColor: "#9E4B00",
    titleShadowColor: "#5A001F",
    buttonBgColor: "#1F010D",
    buttonBorderColor: "#FF5200CC",
    buttonTextColor: "#FFD54F",
    cardDefaultGradient: ["#FFFFFF", "#FFFFFF"],
    cardBorderColor: "#E2E8F0",
    pillBarBgColor: "#F1F3F5",
    pillActiveBgColor: "#FFFFFF",
    pillActiveTextColor: "#FF5200",
    pillInactiveTextColor: "#64748B",
    showcaseCardBgColor: "#FFFFFF",
  },
  cards: [
    {
      id: "card_1",
      title: "Get\n70% OFF",
      subtitle: "UP TO ₹120",
      searchQuery: "70% off",
      graphicType: "coupon",
      customImage: "",
      customEmoji: "",
      gradient: ["#FFFFFF", "#FFFFFF"],
      textColor: "#0F172A",
    },
    {
      id: "card_2",
      title: "Get A\nFree Treat",
      subtitle: "ON ₹199+",
      searchQuery: "dessert cake",
      graphicType: "cupcake",
      customImage: "",
      customEmoji: "",
      gradient: ["#FFFFFF", "#FFFFFF"],
      textColor: "#0F172A",
    },
    {
      id: "card_3",
      title: "Binge-Worthy\nOffers",
      subtitle: "TOP RESTAURANTS",
      searchQuery: "offers",
      graphicType: "badge150",
      customImage: "",
      customEmoji: "",
      gradient: ["#FFFFFF", "#FFFFFF"],
      textColor: "#0F172A",
    },
    {
      id: "card_4",
      title: "Discounts\nFrom Top Brands",
      subtitle: "PRICE CRASH",
      searchQuery: "popular",
      graphicType: "priceCrash",
      customImage: "",
      customEmoji: "",
      gradient: ["#FFFFFF", "#FFFFFF"],
      textColor: "#0F172A",
    },
  ],
  filterTabs: [
    { id: "tab_1", label: "TOP RATED", filterType: "popular" },
    { id: "tab_2", label: "FOOD IN 15 MINS", filterType: "discounted" },
  ],
  showcaseItems: [
    {
      id: "item_1",
      name: "Creme Brulee Jar",
      price: 90,
      badge: "ITEMS\nAT ₹90",
      image: "assets/image/steal_tiramisu.png",
      emoji: "🍰",
      adBadge: true,
      tabId: "all",
    },
    {
      id: "item_2",
      name: "Sundae Ice Cream Cup",
      price: 90,
      badge: "ITEMS\nAT ₹90",
      image: "assets/image/sd_ice_creams.png",
      emoji: "🍨",
      adBadge: true,
      tabId: "all",
    },
    {
      id: "item_3",
      name: "Chocolate Truffle Cake",
      price: 120,
      badge: "ITEMS\nAT ₹120",
      image: "assets/image/steal_dark_fantasy.png",
      emoji: "🎂",
      adBadge: true,
      tabId: "all",
    },
    {
      id: "item_4",
      name: "Strawberry Pastry",
      price: 80,
      badge: "ITEMS\nAT ₹80",
      image: "assets/image/sd_sweet_cravings.png",
      emoji: "🍓",
      adBadge: true,
      tabId: "all",
    },
  ],
  updatedAt: new Date().toISOString(),
};
