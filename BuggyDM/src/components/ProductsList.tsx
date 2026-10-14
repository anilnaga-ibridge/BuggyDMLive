"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ProductData, getProducts } from "@/app/actions/products";
import ProductDrawer from "@/components/ProductDrawer";
import SearchableSelect from "@/components/SearchableSelect";
import { getProductImageUrl } from "@/lib/images";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Edit, 
  Grid, 
  List, 
  Layers, 
  ShoppingBag,
  TrendingDown,
  Calendar,
  AlertCircle
} from "lucide-react";

interface FilterOption {
  id: string;
  name: string;
}

interface Metrics {
  totalProducts: number;
  availableProducts: number;
  outOfStock: number;
  categoriesCount: number;
  activeSchedules: number;
}

interface ProductsListProps {
  categories: FilterOption[];
  stores: FilterOption[];
  initialMetrics?: Metrics;
  metricsSlot?: React.ReactNode;
}

function ProductCardImage({ image, name }: { image: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return <Package className="w-12 h-12 text-slate-700" />;
  }

  return (
    <Image
      src={getProductImageUrl(image)}
      alt={name}
      fill
      sizes="(max-width: 768px) 50vw, 25vw"
      unoptimized
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function ProductTableRowImage({ image, name }: { image: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-center text-slate-600">
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <Image
      src={getProductImageUrl(image)}
      alt={name}
      width={40}
      height={40}
      unoptimized
      className="w-10 h-10 object-cover rounded-lg border border-slate-800"
      onError={() => setHasError(true)}
    />
  );
}

export default function ProductsList({ categories, stores, initialMetrics, metricsSlot }: ProductsListProps) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Filter states
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  // View state: grid or list
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load products list based on filters
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: search || undefined,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        storeId: storeId ? parseInt(storeId, 10) : undefined,
        stockFilter: stockFilter || undefined,
        page,
        limit,
      });
      setProducts(response.products);
      setTotal(response.total);
    } catch (err) {
      console.error("Error loading products list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void getProducts({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      storeId: storeId ? parseInt(storeId, 10) : undefined,
      stockFilter: stockFilter || undefined,
      page,
      limit,
    }).then((response) => {
      if (cancelled) return;
      setProducts(response.products);
      setTotal(response.total);
      setLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error("Error loading products list:", error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId, limit, page, stockFilter, storeId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
        <p className="text-slate-400 text-xs mt-1">Manage single items, check discount offers, and edit details</p>
      </div>

      {/* Metrics Row */}
      {metricsSlot ? (
        metricsSlot
      ) : initialMetrics ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Products */}
          <div className="kpi-gradient-total p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Products</p>
              <p className="text-lg font-bold text-white mt-1">{initialMetrics.totalProducts}</p>
            </div>
            <Package className="w-5 h-5 text-emerald-450 opacity-80" />
          </div>

          {/* Available Products */}
          <div className="kpi-gradient-available p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Available</p>
              <p className="text-lg font-bold text-emerald-450 mt-1">{initialMetrics.availableProducts}</p>
            </div>
            <ShoppingBag className="w-5 h-5 text-sky-400 opacity-80" />
          </div>

          {/* Out of Stock */}
          <div className="kpi-gradient-outOfStock p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Out of Stock</p>
              <p className="text-lg font-bold text-rose-450 mt-1">{initialMetrics.outOfStock}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-rose-450 opacity-80" />
          </div>

          {/* Categories count */}
          <div className="kpi-gradient-categories p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Categories</p>
              <p className="text-lg font-bold text-violet-400 mt-1">{initialMetrics.categoriesCount}</p>
            </div>
            <Layers className="w-5 h-5 text-violet-400 opacity-80" />
          </div>

          {/* Active Schedules */}
          <div className="kpi-gradient-schedules p-4 rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pricing Crons</p>
              <p className="text-lg font-bold text-amber-500 mt-1">{initialMetrics.activeSchedules}</p>
            </div>
            <Calendar className="w-5 h-5 text-amber-500 opacity-80" />
          </div>
        </div>
      ) : null}

      {/* Filters Toolbar */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800/80">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search items catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Searchable Category Select */}
          <SearchableSelect
            options={categories}
            value={categoryId}
            onChange={(val) => {
              setCategoryId(val);
              setPage(1);
            }}
            placeholder="Filter Category"
            searchPlaceholder="Search categories..."
          />

          {/* Searchable Store Select */}
          <SearchableSelect
            options={stores}
            value={storeId}
            onChange={(val) => {
              setStoreId(val);
              setPage(1);
            }}
            placeholder="Filter Store"
            searchPlaceholder="Search stores..."
          />

          {/* Searchable Stock Select */}
          <SearchableSelect
            options={[
              { id: "in_stock", name: "In Stock" },
              { id: "out_of_stock", name: "Out of Stock" },
              { id: "low_stock", name: "Low Stock (<= 5)" }
            ]}
            value={stockFilter}
            onChange={(val) => {
              setStockFilter(val);
              setPage(1);
            }}
            placeholder="Filter Stock"
            searchPlaceholder="Search stock levels..."
          />

          {/* Grid / List Layout Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-emerald-500/10 text-emerald-450"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-emerald-500/10 text-emerald-450"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Catalog Display Grid / List */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
            <p className="text-xs text-slate-400 font-semibold">No catalog items matching filters</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const discountedPrice = product.discount > 0
                ? product.discount_type === "percent"
                  ? product.price - (product.price * product.discount) / 100
                  : product.price - product.discount
                : product.price;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border border-slate-800 flex flex-col cursor-pointer transition-all duration-300"
                >
                  {/* Product Thumbnail */}
                  <div className="aspect-square w-full bg-slate-950/40 relative flex items-center justify-center border-b border-slate-800/40">
                    <ProductCardImage image={product.image} name={product.name} />

                    {/* Discount Badge */}
                    {product.discount > 0 && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500 text-slate-950 shadow-md flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        <span>
                          {product.discount_type === "percent"
                            ? `${product.discount}% OFF`
                            : `₹${product.discount.toFixed(0)} OFF`}
                        </span>
                      </span>
                    )}

                    {/* Status Pill */}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      product.status
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/25 text-rose-450"
                    }`}>
                      {product.status ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white truncate">{product.name}</h3>
                      <p className="text-slate-400 text-[10px] mt-0.5 truncate">{product.description || "No description provided."}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Price */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                          {product.discount > 0 ? "Offer Price" : "Base Price"}
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-sm font-extrabold text-emerald-450 flex items-center">
                            <span className="mr-0.5 text-xs font-bold">₹</span>
                            {discountedPrice.toFixed(2)}
                          </span>
                          {product.discount > 0 && (
                            <span className="text-[10px] line-through text-slate-550 font-medium">
                              ₹{product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Stock</span>
                        <span className={`text-xs font-semibold ${product.stock <= 5 ? "text-rose-400" : "text-slate-350"}`}>
                          {product.stock} units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout */
          <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="py-3.5 px-4 w-20">Image</th>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4 w-32">Category</th>
                    <th className="py-3.5 px-4 w-44">Price Details</th>
                    <th className="py-3.5 px-4 w-32">Stock</th>
                    <th className="py-3.5 px-4 w-28">Status</th>
                    <th className="py-3.5 px-4 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {products.map((product) => {
                    const discountedPrice = product.discount > 0
                      ? product.discount_type === "percent"
                        ? product.price - (product.price * product.discount) / 100
                        : product.price - product.discount
                      : product.price;

                    // Match option name for category
                    const matchedCategory = categories.find((c) => c.id === product.category_id)?.name.replace(/^[ └─]+/g, "");

                    return (
                      <tr key={product.id} className="hover:bg-slate-900/10 transition-colors">
                        {/* Thumbnail */}
                        <td className="py-2.5 px-4">
                          <ProductTableRowImage image={product.image} name={product.name} />
                        </td>

                        {/* Name & ID */}
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-white truncate max-w-xs">{product.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">#{product.id}</p>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-4 text-slate-400 font-medium truncate max-w-[120px]">
                          {matchedCategory || "General"}
                        </td>

                        {/* Pricing */}
                        <td className="py-2.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-450 flex items-center">
                                <span className="mr-0.5 text-[10px] font-bold">₹</span>
                                {discountedPrice.toFixed(2)}
                              </span>
                              {product.discount > 0 && (
                                <span className="text-[10px] line-through text-slate-550 font-medium">
                                  ₹{product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {product.discount > 0 && (
                              <span className="text-[9px] font-extrabold text-amber-500">
                                {product.discount_type === "percent"
                                  ? `${product.discount}% OFF`
                                  : `₹${product.discount.toFixed(0)} OFF`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-2.5 px-4">
                          <span className={`font-semibold ${product.stock <= 5 ? "text-rose-450 font-bold" : "text-slate-300"}`}>
                            {product.stock} units
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border ${
                            product.status
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-450"
                          }`}>
                            {product.status ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>

                        {/* Edit Action */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/20 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span className="text-xs text-slate-500">
            Showing <span className="text-slate-300">{(page - 1) * limit + 1}</span> to{" "}
            <span className="text-slate-300">
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="text-slate-300">{total}</span> products
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-out Edit Drawer */}
      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSaveSuccess={() => {
          setSelectedProduct(null);
          loadProducts();
        }}
      />
    </div>
  );
}
