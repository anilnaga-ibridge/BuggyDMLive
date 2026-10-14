export interface PreviewProduct {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  unit: string;
  discount?: string;
  badge?: string;
  icon: string;
}

export interface PreviewCategory {
  id: string;
  name: string;
  icon: string;
  bg?: string;
}

export interface PreviewStore {
  id: string;
  name: string;
  eta: string;
  distance: string;
  rating: number;
  badge?: string;
}

export const PREVIEW_PRODUCTS: PreviewProduct[] = [
  { id: "p1", name: "Fortune Sunlite Refined Oil", price: "₹132", mrp: "₹160", unit: "1 L", discount: "18% OFF", icon: "🌻" },
  { id: "p2", name: "Aashirvaad Superior Sharbati Atta", price: "₹318", mrp: "₹399", unit: "5 kg", discount: "20% OFF", icon: "🌾" },
  { id: "p3", name: "Tata Salt Vacuum Evaporated", price: "₹28", mrp: "₹30", unit: "1 kg", discount: "7% OFF", icon: "🧂" },
  { id: "p4", name: "Maggi 2-Minute Noodles", price: "₹52", mrp: "₹60", unit: "280 g", discount: "15% OFF", icon: "🍜" },
  { id: "p5", name: "Amul Taaza Homogenised Toned Milk", price: "₹72", mrp: "₹76", unit: "1 L", discount: "5% OFF", icon: "🥛" },
  { id: "p6", name: "Coca-Cola Zero Sugar", price: "₹40", mrp: "₹45", unit: "750 ml", discount: "11% OFF", icon: "🥤" },
];

export const PREVIEW_CATEGORIES: PreviewCategory[] = [
  { id: "c1", name: "Fresh Vegetables", icon: "🥦", bg: "#ecfdf5" },
  { id: "c2", name: "Fresh Fruits", icon: "🍎", bg: "#fef2f2" },
  { id: "c3", name: "Dairy, Bread & Eggs", icon: "🧀", bg: "#fffbeb" },
  { id: "c4", name: "Atta, Rice & Dal", icon: "🌾", bg: "#fefce8" },
  { id: "c5", name: "Oils, Ghee & Masala", icon: "🌻", bg: "#fff7ed" },
  { id: "c6", name: "Munchies & Snacks", icon: "🍿", bg: "#eff6ff" },
  { id: "c7", name: "Cold Drinks & Juices", icon: "🧃", bg: "#faf5ff" },
  { id: "c8", name: "Cleaning & Household", icon: "🧼", bg: "#f0fdfa" },
];

export const PREVIEW_STORES: PreviewStore[] = [
  { id: "s1", name: "Quick Prime Superstore", eta: "8-10 mins", distance: "0.8 km", rating: 4.8, badge: "FASTEST" },
  { id: "s2", name: "Organic Harvest Hub", eta: "12-15 mins", distance: "1.4 km", rating: 4.9, badge: "ORGANIC" },
  { id: "s3", name: "Fresh Express Mart", eta: "10-12 mins", distance: "1.1 km", rating: 4.7 },
];

export const PREVIEW_STEAL_DEALS = [
  { id: "sd1", name: "Koparo Clean Natural All-Purpose Cleaner", price: "₹897", mrp: "₹897", unit: "80 g", badge: "3 PACKS Multi Pack", icon: "🧴" },
  { id: "sd2", name: "Cool Drinks", price: "₹20", mrp: "₹20", unit: "1 pack (237 g)", badge: "Multi Pack", icon: "🥤" },
  { id: "sd3", name: "DP Yellow Sticky Notes", price: "₹198", mrp: "₹198", unit: "1 pack (17 g)", badge: "2 PACKS Multi Pack", icon: "📝" },
  { id: "sd4", name: "SE7EN Fancy Birthday Cap", price: "₹10", mrp: "₹10", unit: "100 ml", badge: "", icon: "🎉" },
  { id: "sd5", name: "Patanjali Super Dishwash Bar", price: "₹10", mrp: "₹10", unit: "400 g", badge: "3 PACKS Multi Pack", icon: "🧼" },
  { id: "sd6", name: "Bodyguard Herbal Mosquito Spray", price: "₹10", mrp: "₹10", unit: "100 ml", badge: "Multi Pack", icon: "🌿" },
];
