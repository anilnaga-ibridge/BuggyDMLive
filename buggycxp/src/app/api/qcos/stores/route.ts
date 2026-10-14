import { NextResponse } from "next/server";

interface StoreItem {
  id: number | string;
  name: string;
  rating: number;
  reviewsCount?: number;
  distance?: string;
  eta?: string;
  isNew?: boolean;
  isVerified?: boolean;
  coverPhoto?: string;
  logo?: string;
  categoryNames?: string[];
  discountLabel?: string;
  freeDelivery?: boolean;
}

const FALLBACK_STORES: StoreItem[] = [
  {
    id: 2,
    name: "Quick Store Grocery",
    rating: 4.8,
    reviewsCount: 154,
    distance: "1.2 km",
    eta: "10-15 mins",
    isNew: false,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Atta, Flours & Sooji", "Dairy, Bread & Eggs", "Fresh Produce"],
    discountLabel: "Flat ₹50 OFF",
    freeDelivery: true,
  },
  {
    id: 3,
    name: "Quick Fresh Supermarket",
    rating: 4.9,
    reviewsCount: 320,
    distance: "1.8 km",
    eta: "12-18 mins",
    isNew: true,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Fruits & Vegetables", "Beverages", "Snacks"],
    discountLabel: "20% OFF up to ₹100",
    freeDelivery: true,
  },
  {
    id: 4,
    name: "Organic Harvest Hub",
    rating: 4.7,
    reviewsCount: 88,
    distance: "2.4 km",
    eta: "15-20 mins",
    isNew: false,
    isVerified: true,
    coverPhoto: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Organic Staples", "Cold Pressed Oils", "Dry Fruits"],
    discountLabel: "Free Delivery",
    freeDelivery: true,
  },
  {
    id: 5,
    name: "Daily Essentials Mart",
    rating: 4.6,
    reviewsCount: 64,
    distance: "3.1 km",
    eta: "20-25 mins",
    isNew: false,
    isVerified: false,
    coverPhoto: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=700&q=80",
    categoryNames: ["Cleaning & Household", "Personal Care", "Stationery"],
    discountLabel: "Buy 1 Get 1 Free",
    freeDelivery: false,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  const customerApi = process.env.BUGGY_CUSTOMER_API_URL || "http://127.0.0.1:8000";
  const moduleId = process.env.BUGGY_PREVIEW_MODULE_ID || "2";
  const zoneId = process.env.BUGGY_PREVIEW_ZONE_ID || "2";

  try {
    const endpoint = `${customerApi}/api/v1/stores/get-stores/all?offset=1&limit=10`;
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "X-localization": "en",
        moduleId,
        zoneId: `[${zoneId}]`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      const stores = data?.stores || [];

      if (Array.isArray(stores) && stores.length > 0) {
        const mappedStores: StoreItem[] = stores.map((s: any, idx: number) => {
          let coverUrl = s.cover_photo_full_url;
          if (!coverUrl && s.cover_photo) {
            coverUrl = `${customerApi}/storage/app/public/store/cover/${s.cover_photo}`;
          }
          if (!coverUrl) {
            coverUrl = FALLBACK_STORES[idx % FALLBACK_STORES.length].coverPhoto;
          }

          return {
            id: s.id,
            name: s.name || `Store #${s.id}`,
            rating: Number(s.avg_rating) > 0 ? Number(s.avg_rating) : 4.8,
            reviewsCount: s.reviews_count || s.rating_count || 42,
            distance: s.distance ? `${(Number(s.distance) / 1000).toFixed(1)} km` : `${(1 + idx * 0.6).toFixed(1)} km`,
            eta: s.min_delivery_time ? `${s.min_delivery_time}-${Number(s.min_delivery_time) + 10} mins` : "15-20 mins",
            isNew: Boolean(s.is_new ?? (idx === 1)),
            isVerified: Boolean(s.verified_seller === 1 || true),
            coverPhoto: coverUrl,
            logo: s.logo_full_url || undefined,
            categoryNames: s.category_names && s.category_names.length > 0
              ? s.category_names
              : ["Atta, Flours & Sooji", "Dairy & Eggs", "Beverages"],
            discountLabel: s.discount?.discount ? `${s.discount.discount}% OFF` : (idx % 2 === 0 ? "Flat ₹50 OFF" : "Free Delivery"),
            freeDelivery: Boolean(s.free_delivery || idx % 2 === 0),
          };
        });

        // If backend returned fewer than 3 stores, pad with complementary curated stores
        let combined = [...mappedStores];
        if (combined.length < 4) {
          const existingIds = new Set(combined.map(s => String(s.id)));
          for (const fallback of FALLBACK_STORES) {
            if (!existingIds.has(String(fallback.id))) {
              combined.push(fallback);
            }
          }
        }

        // Filter if requested
        let filtered = combined;
        if (filter === "newly_joined") {
          filtered = combined.filter(st => st.isNew);
          if (filtered.length === 0) filtered = [combined[0]];
        } else if (filter === "top_rated") {
          filtered = [...combined].sort((a, b) => b.rating - a.rating);
        }

        return NextResponse.json({
          success: true,
          source: "Quick Backend Live",
          stores: filtered.length > 0 ? filtered : FALLBACK_STORES,
        });
      }
    }
  } catch {
    // Graceful fallback below
  }

  // Fallback
  let filtered = FALLBACK_STORES;
  if (filter === "newly_joined") {
    filtered = FALLBACK_STORES.filter(s => s.isNew);
  } else if (filter === "top_rated") {
    filtered = [...FALLBACK_STORES].sort((a, b) => b.rating - a.rating);
  }

  return NextResponse.json({
    success: true,
    source: "fallback",
    stores: filtered,
  });
}
