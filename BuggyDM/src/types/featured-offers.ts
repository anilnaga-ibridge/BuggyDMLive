export interface FeaturedCategoryCard {
  id: string;
  name: string;
  image: string;
  searchKeyword: string;
  badgeColor?: string;
}

export interface FeaturedSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  topCategoriesText: string;
  cards: FeaturedCategoryCard[];
}

export interface TodaysOfferCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  searchKeyword: string;
  badgeText?: string;
}

export interface TodaysOffersConfig {
  enabled: boolean;
  title: string;
  viewAllText: string;
  offers: TodaysOfferCard[];
}

export interface CouponCard {
  id: string;
  discountText: string;
  offText: string;
  codeText: string;
  bgColor: string;
  borderColor: string;
  link?: string;
}

export interface CouponsOffersConfig {
  enabled: boolean;
  title: string;
  coupons: CouponCard[];
}

export interface HomeFeaturedOffersConfig {
  featured: FeaturedSectionConfig;
  todaysOffers: TodaysOffersConfig;
  coupons: CouponsOffersConfig;
  updatedAt?: string;
}

export const DEFAULT_FEATURED_OFFERS_CONFIG: HomeFeaturedOffersConfig = {
  featured: {
    enabled: true,
    title: "Featured",
    subtitle: "Everything you need, in one place",
    topCategoriesText: "TOP CATEGORIES",
    cards: [
      // Row 1
      {
        id: "feat_1",
        name: "Grocery",
        image: "assets/image/featGrocery.png",
        searchKeyword: "Grocery",
      },
      {
        id: "feat_2",
        name: "Food",
        image: "assets/image/featFood.png",
        searchKeyword: "Food Burger",
      },
      {
        id: "feat_3",
        name: "Dineout",
        image: "assets/image/featDineout.png",
        searchKeyword: "Dineout Restaurant",
      },
      {
        id: "feat_4",
        name: "Pharmacy",
        image: "assets/image/featPharmacy.png",
        searchKeyword: "Pharmacy Medicine",
      },
      {
        id: "feat_5",
        name: "Meat & Seafood",
        image: "assets/image/featMeatSeafood.png",
        searchKeyword: "Meat Seafood",
      },
      // Row 2
      {
        id: "feat_6",
        name: "Fresh",
        image: "assets/image/featFresh.png",
        searchKeyword: "Fresh Fruits",
      },
      {
        id: "feat_7",
        name: "Beauty",
        image: "assets/image/featBeauty.png",
        searchKeyword: "Beauty Cosmetics",
      },
      {
        id: "feat_8",
        name: "Flowers",
        image: "assets/image/featFlowers.png",
        searchKeyword: "Flowers Bouquet",
      },
      {
        id: "feat_9",
        name: "Parcel",
        image: "assets/image/featParcel.png",
        searchKeyword: "Parcel Courier",
      },
      {
        id: "feat_10",
        name: "Services",
        image: "assets/image/featServices.png",
        searchKeyword: "Services Repair",
      },
    ],
  },
  todaysOffers: {
    enabled: true,
    title: "Today's Offers",
    viewAllText: "View All",
    offers: [
      {
        id: "offer_1",
        title: "Up to 50% OFF",
        subtitle: "Fresh Fruits & Vegetables",
        image: "assets/image/offer_fruits_veg.png",
        searchKeyword: "Fresh Fruits and Vegetables",
      },
      {
        id: "offer_2",
        title: "Flat 40% OFF",
        subtitle: "On Top Restaurants",
        image: "assets/image/offer_restaurant.png",
        searchKeyword: "Restaurant Pizza Food",
      },
      {
        id: "offer_3",
        title: "Up to 30% OFF",
        subtitle: "Pharmacy Essentials",
        image: "assets/image/offer_pharmacy.png",
        searchKeyword: "Pharmacy Essentials Medicine",
      },
    ],
  },
  coupons: {
    enabled: true,
    title: "Coupons & Offers",
    coupons: [
      {
        id: "coupon_1",
        discountText: "FLAT\n₹50",
        offText: "OFF",
        codeText: "USE CODE: BUGGY50",
        bgColor: "#D1FAE5",
        borderColor: "#A7F3D0",
      },
      {
        id: "coupon_2",
        discountText: "FLAT\n₹100",
        offText: "OFF",
        codeText: "USE CODE: BUGGY100",
        bgColor: "#CCFBF1",
        borderColor: "#99F6E4",
      },
      {
        id: "coupon_3",
        discountText: "FLAT\n₹150",
        offText: "OFF",
        codeText: "USE CODE: BUGGY150",
        bgColor: "#E0F2FE",
        borderColor: "#BAE6FD",
      },
      {
        id: "coupon_4",
        discountText: "UPTO\n₹75",
        offText: "CASHBACK",
        codeText: "ON UPI PAYMENTS",
        bgColor: "#FEF3C7",
        borderColor: "#FDE68A",
      },
    ],
  },
};
