export interface FlashDealItem {
  id: string;
  title: string;
  unit: string;
  price: string;
  mrp: string;
  image: string;
  hasSelectBadge: boolean;
  searchKeyword: string;
}

export interface FlashDealsConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  deals: FlashDealItem[];
  updatedAt?: string;
}

export const DEFAULT_FLASH_DEALS_CONFIG: FlashDealsConfig = {
  enabled: true,
  title: "Flash Deals: All Time Low",
  subtitle: "Limited Time Deals",
  deals: [
    {
      id: "flash_1",
      title: "Yoga Bar High Protein Muesli",
      unit: "1 pack (1 kg)",
      price: "₹454",
      mrp: "₹890",
      image: "assets/image/crop_flash_yogabar.png",
      hasSelectBadge: true,
      searchKeyword: "Yoga Bar High Protein Muesli",
    },
    {
      id: "flash_2",
      title: "Veeba Tomato Ketchup",
      unit: "1 pack (900 g)",
      price: "₹82",
      mrp: "₹120",
      image: "assets/image/crop_flash_veeba.png",
      hasSelectBadge: false,
      searchKeyword: "Veeba Tomato Ketchup",
    },
    {
      id: "flash_3",
      title: "Saffola Forest Honey",
      unit: "1 pc (250 g)",
      price: "₹131",
      mrp: "₹180",
      image: "assets/image/crop_flash_saffola.png",
      hasSelectBadge: false,
      searchKeyword: "Saffola Forest Honey",
    },
  ],
};
