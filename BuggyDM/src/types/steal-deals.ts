export interface StealStoreTab {
  isTrending: boolean;
  title?: string;
  price?: string;
  label?: string;
  icon: string;
}

export interface StealCategoryChip {
  name: string;
  isAll: boolean;
  icon?: string;
}

export interface StealProductItem {
  id?: number | null;
  title: string;
  unit: string;
  price: string;
  mrp: string;
  discount: string;
  image: string;
}

export interface StealDealsConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  lightningIcon: string;
  viewAllLinkText: string;
  storeTabs: StealStoreTab[];
  categories: StealCategoryChip[];
  row1Products: StealProductItem[];
  row2Products: StealProductItem[];
  updatedAt?: string;
}

export const DEFAULT_STEAL_DEALS_CONFIG: StealDealsConfig = {
  enabled: true,
  title: "Steal Deals",
  subtitle: "Add Any 10 Items",
  lightningIcon: "/assets/image/steal_lightning.png",
  viewAllLinkText: "View All",
  storeTabs: [
    {
      isTrending: true,
      title: "Trending",
      icon: "/assets/image/steal_hot_deal.png",
    },
    {
      isTrending: false,
      price: "₹9",
      label: "Store",
      icon: "/assets/image/steal_tab_gift.png",
    },
    {
      isTrending: false,
      price: "₹19",
      label: "Store",
      icon: "/assets/image/steal_tab_basket.png",
    },
    {
      isTrending: false,
      price: "₹29",
      label: "Store",
      icon: "/assets/image/steal_tab_bag.png",
    },
  ],
  categories: [
    {
      name: "ALL",
      isAll: true,
    },
    {
      name: "Cold Drinks & Juices",
      isAll: false,
      icon: "/assets/image/steal_cat_drinks_new.png",
    },
    {
      name: "Skincare",
      isAll: false,
      icon: "/assets/image/steal_cat_skincare_new.png",
    },
    {
      name: "Masala & Dry Fruits",
      isAll: false,
      icon: "/assets/image/steal_cat_dryfruit_new.png",
    },
    {
      name: "Snacks",
      isAll: false,
      icon: "/assets/image/steal_cat_snack_new.png",
    },
  ],
  row1Products: [
    {
      id: null,
      title: "Aaha Tiramisu | Rich Coffee Dessert",
      unit: "80 g",
      price: "₹59",
      mrp: "₹150",
      discount: "₹91 OFF",
      image: "/assets/image/steal_tiramisu.png",
    },
    {
      id: null,
      title: "Sunfeast Dark Fantasy Choco Fills",
      unit: "1 pack (237 g)",
      price: "₹39",
      mrp: "₹98",
      discount: "₹59 OFF",
      image: "/assets/image/steal_dark_fantasy.png",
    },
    {
      id: null,
      title: "MOM – Makhana Chikki Bar",
      unit: "1 pack (17 g)",
      price: "₹9",
      mrp: "₹20",
      discount: "₹11 OFF",
      image: "/assets/image/steal_makhana.png",
    },
  ],
  row2Products: [
    {
      id: null,
      title: "Lakme Absolute Glow Toner",
      unit: "100 ml",
      price: "₹199",
      mrp: "₹345",
      discount: "₹146 OFF",
      image: "/assets/image/steal_lakme.png",
    },
    {
      id: null,
      title: "Rage Whey Protein Banana Flavour",
      unit: "400 g",
      price: "₹229",
      mrp: "₹369",
      discount: "₹140 OFF",
      image: "/assets/image/steal_rage.png",
    },
    {
      id: null,
      title: "St.Botanica Brightening Face Wash",
      unit: "100 ml",
      price: "₹149",
      mrp: "₹299",
      discount: "₹150 OFF",
      image: "/assets/image/steal_botanica.png",
    },
  ],
  updatedAt: new Date().toISOString(),
};
