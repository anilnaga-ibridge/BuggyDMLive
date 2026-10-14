export interface SalonHeroDeal {
  itemId?: number | null;
  itemName: string;
  itemImage: string;
  originalPrice: number;
  discountedPrice: number;
  unit?: string;
}

export interface SalonMiniCard {
  id: string;
  title: string;
  badgeText: string;
  image: string;
  searchKeyword: string;
}

export interface SalonShowcaseConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  sponsorText: string;
  sponsorName: string;
  heroDeal: SalonHeroDeal;
  miniCards: SalonMiniCard[];
}

export interface BloomBannerConfig {
  enabled: boolean;
  title: string;
  mediaType?: "image" | "video";
  image: string;
  videoUrl?: string;
  searchKeyword: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface HomeSalonShowcaseConfig {
  salon: SalonShowcaseConfig;
  bloom: BloomBannerConfig;
  updatedAt?: string;
}

export const DEFAULT_SALON_SHOWCASE_CONFIG: HomeSalonShowcaseConfig = {
  salon: {
    enabled: true,
    title: "Salon at Home",
    subtitle: "Professional Care",
    sponsorText: "Powered by",
    sponsorName: "L'ORÉAL",
    heroDeal: {
      itemId: null,
      itemName: "L'Oreal Absolut Repair Shampoo",
      itemImage: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80",
      originalPrice: 795,
      discountedPrice: 715,
      unit: "300 ml",
    },
    miniCards: [
      {
        id: "salon_card_1",
        title: "Premium Hair Care Range",
        badgeText: "UP TO 50% OFF",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
        searchKeyword: "Premium Hair Care",
      },
      {
        id: "salon_card_2",
        title: "Daily Hair Care",
        badgeText: "UP TO 70% OFF",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
        searchKeyword: "Daily Hair Care",
      },
      {
        id: "salon_card_3",
        title: "Hair Colour & Styling",
        badgeText: "UP TO 65% OFF",
        image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop&q=80",
        searchKeyword: "Hair Colour",
      },
      {
        id: "salon_card_4",
        title: "Hair Growth & Supplement",
        badgeText: "UP TO 45% OFF",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
        searchKeyword: "Hair Growth Supplement",
      },
    ],
  },
  bloom: {
    enabled: true,
    title: "Bloom Fresh Fruits Banner",
    mediaType: "image",
    image: "assets/image/bloom_fruit_banner.png",
    videoUrl: "",
    searchKeyword: "Fresh Fruits and Vegetables",
    autoPlay: true,
    loop: true,
    muted: true,
  },
};
