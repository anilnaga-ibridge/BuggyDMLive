export interface CuratedProductItem {
  id: string | number;
  name: string;
  unit: string;
  price: number;
  originalPrice: number;
  image: string;
  searchQuery: string;
}

export interface CuratedProductsConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllQuery: string;
  products: CuratedProductItem[];
  updatedAt?: string;
}

export const DEFAULT_CURATED_PRODUCTS_CONFIG: CuratedProductsConfig = {
  enabled: true,
  title: "Curated for you",
  subtitle: "Handpicked products just for you",
  viewAllText: "View All",
  viewAllQuery: "Curated",
  products: [
    {
      id: "curated_1",
      name: "Fresh Tomato",
      unit: "1 kg",
      price: 557,
      originalPrice: 576,
      image: "assets/image/curated_tomato.png",
      searchQuery: "Fresh Tomato",
    },
    {
      id: "curated_2",
      name: "Aashirvaad Atta / Godihittu – Whole Wheat",
      unit: "5 kg",
      price: 306,
      originalPrice: 318,
      image: "assets/image/curated_atta.png",
      searchQuery: "Aashirvaad Atta",
    },
    {
      id: "curated_3",
      name: "Fortune Sun Lite – Sunflower Refined Oil",
      unit: "1 L",
      price: 113,
      originalPrice: 125,
      image: "assets/image/curated_oil.png",
      searchQuery: "Fortune Sun Lite Oil",
    },
    {
      id: "curated_4",
      name: "Britannia Good Day Butter Cookies",
      unit: "300 g",
      price: 67,
      originalPrice: 103,
      image: "assets/image/curated_cookies.png",
      searchQuery: "Britannia Good Day",
    },
    {
      id: "curated_5",
      name: "India Gate Basmati Rice Mini Mogra",
      unit: "1 kg",
      price: 339,
      originalPrice: 375,
      image: "assets/image/curated_rice.png",
      searchQuery: "India Gate Basmati Rice",
    },
    {
      id: "curated_6",
      name: "Beauty Essentials",
      unit: "1 unit",
      price: 199,
      originalPrice: 211,
      image: "assets/image/curated_beauty.png",
      searchQuery: "Beauty Cosmetics",
    },
  ],
};
