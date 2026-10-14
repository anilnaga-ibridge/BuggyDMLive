import type { FestivalFont } from "./types";

export const STANDARD_FESTIVAL_FONTS: FestivalFont[] = [
  {
    id: "font_inter",
    name: "Inter",
    family: "'Inter', sans-serif",
    category: "sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    id: "font_poppins",
    name: "Poppins",
    family: "'Poppins', sans-serif",
    category: "sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    id: "font_montserrat",
    name: "Montserrat",
    family: "'Montserrat', sans-serif",
    category: "sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    id: "font_playfair",
    name: "Playfair Display",
    family: "'Playfair Display', serif",
    category: "serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap",
    weights: [400, 600, 700, 800, 900],
  },
  {
    id: "font_roboto",
    name: "Roboto",
    family: "'Roboto', sans-serif",
    category: "sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap",
    weights: [400, 500, 700, 900],
  },
  {
    id: "font_outfit",
    name: "Outfit",
    family: "'Outfit', sans-serif",
    category: "sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap",
    weights: [400, 500, 600, 700, 800, 900],
  },
];

const CUSTOM_FONTS_STORAGE_KEY = "cxp_festival_custom_fonts_v1";

export function loadCustomFestivalFonts(): FestivalFont[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomFestivalFont(font: FestivalFont): FestivalFont[] {
  const current = loadCustomFestivalFonts();
  const filtered = current.filter((f) => f.id !== font.id);
  const updated = [font, ...filtered];
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
