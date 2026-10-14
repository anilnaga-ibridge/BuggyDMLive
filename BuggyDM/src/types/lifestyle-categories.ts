export interface FashionLifestyleCard {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
}

export interface FashionLifestyleConfig {
  enabled: boolean;
  title: string;
  cards: FashionLifestyleCard[];
}

export interface BeautyPersonalCareCard {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
  isWide?: boolean;
}

export interface BeautyPersonalCareConfig {
  enabled: boolean;
  title: string;
  row1Cards: BeautyPersonalCareCard[];
  row2Cards: BeautyPersonalCareCard[];
  row3Cards: BeautyPersonalCareCard[];
}

export interface HouseholdEssentialsCard {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
  isWide?: boolean;
}

export interface HouseholdEssentialsConfig {
  enabled: boolean;
  title: string;
  row1Cards: HouseholdEssentialsCard[];
  row2Cards: HouseholdEssentialsCard[];
}

export interface HobbiesInterestsCard {
  id: string;
  title: string;
  image: string;
  searchKeyword: string;
}

export interface HobbiesInterestsConfig {
  enabled: boolean;
  title: string;
  cards: HobbiesInterestsCard[];
}

export interface LifestyleCategoriesConfig {
  fashionLifestyle: FashionLifestyleConfig;
  beautyPersonalCare: BeautyPersonalCareConfig;
  householdEssentials: HouseholdEssentialsConfig;
  hobbiesInterests: HobbiesInterestsConfig;
  updatedAt?: string;
}

export const DEFAULT_LIFESTYLE_CATEGORIES_CONFIG: LifestyleCategoriesConfig = {
  fashionLifestyle: {
    enabled: true,
    title: "Fashion & Lifestyle",
    cards: [
      {
        id: "fl_1",
        title: "Apparel",
        image: "assets/image/crop_apparel.png",
        searchKeyword: "Apparel Clothing Fashion",
      },
      {
        id: "fl_2",
        title: "Jewellery",
        image: "assets/image/crop_jewellery.png",
        searchKeyword: "Jewellery Accessories",
      },
    ],
  },
  beautyPersonalCare: {
    enabled: true,
    title: "Beauty & Personal Care",
    row1Cards: [
      {
        id: "bpc_1",
        title: "Personal Care Studio",
        image: "assets/image/crop_personal_care.png",
        searchKeyword: "Personal Care Studio",
        isWide: true,
      },
      {
        id: "bpc_2",
        title: "Skincare",
        image: "assets/image/crop_skincare.png",
        searchKeyword: "Skincare Face Care",
        isWide: false,
      },
      {
        id: "bpc_3",
        title: "Makeup & Beauty",
        image: "assets/image/crop_makeup.png",
        searchKeyword: "Makeup and Beauty Cosmetics",
        isWide: false,
      },
    ],
    row2Cards: [
      {
        id: "bpc_4",
        title: "Fragrance",
        image: "assets/image/crop_fragrance.png",
        searchKeyword: "Fragrance Perfume Deo",
      },
      {
        id: "bpc_5",
        title: "Bath & Body",
        image: "assets/image/crop_bath_body.png",
        searchKeyword: "Bath and Body Wash Soap",
      },
      {
        id: "bpc_6",
        title: "Haircare",
        image: "assets/image/crop_haircare.png",
        searchKeyword: "Haircare Shampoo Oil",
      },
      {
        id: "bpc_7",
        title: "Baby Care",
        image: "assets/image/crop_baby_care.png",
        searchKeyword: "Baby Care Diapers Wipes",
      },
    ],
    row3Cards: [
      {
        id: "bpc_8",
        title: "Protein & Nutrition",
        image: "assets/image/crop_protein.png",
        searchKeyword: "Protein and Nutrition Supplements",
      },
      {
        id: "bpc_9",
        title: "Pharmacy & Wellness",
        image: "assets/image/crop_pharmacy.png",
        searchKeyword: "Pharmacy and Wellness Health",
      },
      {
        id: "bpc_10",
        title: "Feminine Hygiene",
        image: "assets/image/crop_fem_hygiene.png",
        searchKeyword: "Feminine Hygiene Sanitary Pads",
      },
      {
        id: "bpc_11",
        title: "Sexual Wellness",
        image: "assets/image/crop_sexual_wellness.png",
        searchKeyword: "Sexual Wellness",
      },
    ],
  },
  householdEssentials: {
    enabled: true,
    title: "Household Essentials",
    row1Cards: [
      {
        id: "he_1",
        title: "Home Needs",
        image: "assets/image/crop_home_needs.png",
        searchKeyword: "Home Needs Essentials",
        isWide: true,
      },
      {
        id: "he_2",
        title: "Kitchenware & Appliances",
        image: "assets/image/crop_kitchenware.png",
        searchKeyword: "Kitchenware and Appliances Cookware",
        isWide: true,
      },
    ],
    row2Cards: [
      {
        id: "he_3",
        title: "Cleaning Essentials",
        image: "assets/image/crop_cleaning.png",
        searchKeyword: "Cleaning Essentials Detergent Floor Cleaner",
      },
      {
        id: "he_4",
        title: "Electronics Store",
        image: "assets/image/crop_electronics.png",
        searchKeyword: "Electronics Accessories Cables",
      },
      {
        id: "he_5",
        title: "Pet Care",
        image: "assets/image/crop_pet_care.png",
        searchKeyword: "Pet Care Dog Cat Food",
      },
      {
        id: "he_6",
        title: "Paan Corner",
        image: "assets/image/crop_paan_corner.png",
        searchKeyword: "Paan Corner Snacks Mouth Freshener",
      },
    ],
  },
  hobbiesInterests: {
    enabled: true,
    title: "Hobbies & Interests",
    cards: [
      {
        id: "hi_1",
        title: "Toys & Games",
        image: "assets/image/crop_toys_games.png",
        searchKeyword: "Toys and Games Board Games",
      },
      {
        id: "hi_2",
        title: "Stationery & Crafts",
        image: "assets/image/crop_stationery.png",
        searchKeyword: "Stationery and Crafts Pens Notebooks",
      },
      {
        id: "hi_3",
        title: "Sports & Fitness",
        image: "assets/image/crop_sports_fitness.png",
        searchKeyword: "Sports and Fitness Gym Equipment",
      },
      {
        id: "hi_4",
        title: "Book Store",
        image: "assets/image/crop_book_store.png",
        searchKeyword: "Book Store Novels Fiction",
      },
    ],
  },
};
