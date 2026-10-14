export interface CategoryCardItem {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
}

export interface GroceryKitchenConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  backToTopText: string;
  heroBanner: {
    enabled: boolean;
    image: string;
    searchKeyword: string;
  };
  row1Cards: CategoryCardItem[];
  row2Cards: CategoryCardItem[];
}

export interface ShowcaseBannerItem {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
}

export interface SnacksDrinksConfig {
  enabled: boolean;
  title1: string;
  title2: string;
  subtitle: string;
  viewAllText: string;
  viewAllKeyword: string;
  banners: ShowcaseBannerItem[];
  bottomCards: CategoryCardItem[];
}

export interface CategoryGridsConfig {
  groceryKitchen: GroceryKitchenConfig;
  snacksDrinks: SnacksDrinksConfig;
  updatedAt?: string;
}

export const DEFAULT_CATEGORY_GRIDS_CONFIG: CategoryGridsConfig = {
  groceryKitchen: {
    enabled: true,
    title: "Grocery & Kitchen",
    subtitle: "Fresh essentials for your daily needs",
    backToTopText: "Back to top",
    heroBanner: {
      enabled: true,
      image: "assets/image/gkHeroBanner.png",
      searchKeyword: "Farm Fresh Fruits and Vegetables",
    },
    row1Cards: [
      {
        id: "gk_1",
        title: "Fruits & Vegetables",
        image: "assets/image/gkFruitsVeg.png",
        searchKeyword: "Fruits and Vegetables",
      },
      {
        id: "gk_2",
        title: "Dairy, Bread & Eggs",
        image: "assets/image/gkDairyBread.png",
        searchKeyword: "Dairy Bread and Eggs",
      },
      {
        id: "gk_3",
        title: "Atta, Rice & Dals",
        image: "assets/image/gkAttaRice.png",
        searchKeyword: "Atta Rice Oil Dals",
      },
      {
        id: "gk_4",
        title: "Meat, Fish & Eggs",
        image: "assets/image/gkMeatFish.png",
        searchKeyword: "Meat Fish and Eggs",
      },
    ],
    row2Cards: [
      {
        id: "gk_5",
        title: "Masala & Dry Fruits",
        image: "assets/image/gkMasalaDryFruits.png",
        searchKeyword: "Masala Dry Fruits",
      },
      {
        id: "gk_6",
        title: "Breakfast & Sauces",
        image: "assets/image/gkBreakfastSauces.png",
        searchKeyword: "Breakfast Sauces",
      },
      {
        id: "gk_7",
        title: "Packaged Food",
        image: "assets/image/gkPackagedFood.png",
        searchKeyword: "Packaged Food",
      },
      {
        id: "gk_8",
        title: "Cooking Essentials",
        image: "assets/image/gkCookingEssentials.png",
        searchKeyword: "Cooking Essentials",
      },
    ],
  },
  snacksDrinks: {
    enabled: true,
    title1: "Snacks ",
    title2: "& Drinks",
    subtitle: "Tasty treats for every moment",
    viewAllText: "View All",
    viewAllKeyword: "Snacks and Drinks",
    banners: [
      {
        id: "sd_b1",
        title: "Cafe Specials",
        image: "assets/image/sdBannerCafe.png",
        searchKeyword: "Cafe Specials",
      },
      {
        id: "sd_b2",
        title: "Ice Creams & More",
        image: "assets/image/sdBannerIceCreams.png",
        searchKeyword: "Ice Creams and Desserts",
      },
    ],
    bottomCards: [
      {
        id: "sd_c1",
        title: "Tea & Coffee",
        image: "assets/image/sdTeaCoffee.png",
        searchKeyword: "Tea and Coffee",
      },
      {
        id: "sd_c2",
        title: "Frozen Food",
        image: "assets/image/sdFrozenFood.png",
        searchKeyword: "Frozen Food",
      },
      {
        id: "sd_c3",
        title: "Sweet Cravings",
        image: "assets/image/sdSweetCravings.png",
        searchKeyword: "Sweet Cravings Chocolates",
      },
      {
        id: "sd_c4",
        title: "Cold Drinks",
        image: "assets/image/sdColdDrinks.png",
        searchKeyword: "Cold Drinks and Juices",
      },
      {
        id: "sd_c5",
        title: "Munchies",
        image: "assets/image/sdMunchies.png",
        searchKeyword: "Munchies Chips Snacks",
      },
      {
        id: "sd_c6",
        title: "Biscuits & Cookies",
        image: "assets/image/sdBiscuitsCookies.png",
        searchKeyword: "Biscuits and Cookies",
      },
    ],
  },
};
