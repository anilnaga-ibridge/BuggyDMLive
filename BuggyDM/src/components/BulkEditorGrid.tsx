"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ProductData, getProducts, updateProductDetail, bulkUpdateProductDetails, bulkImportProductDetails } from "@/app/actions/products";
import Papa from "papaparse";
import { getErrorMessage } from "@/lib/errors";
import { 
  Search, 
  Grid, 
  Percent, 
  Loader2, 
  AlertCircle,
  Database,
  Download,
  Upload,
  Package,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface Metrics {
  totalProducts: number;
  availableProducts: number;
  outOfStock: number;
  categoriesCount: number;
  activeSchedules: number;
}

interface FilterOption {
  id: string;
  name: string;
}

interface BulkEditorGridProps {
  initialMetrics: Metrics;
  categories: FilterOption[];
  stores: FilterOption[];
}

export default function BulkEditorGrid({ initialMetrics, categories, stores }: BulkEditorGridProps) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dynamic Select Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState("all");

  // Input states for bulk actions
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const [successCellId, setSuccessCellId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [isPending, startTransition] = useTransition();

  // Load products list with filters
  const loadProductsList = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: search || undefined,
        categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
        storeId: selectedStore !== "all" ? Number(selectedStore) : undefined,
        stockFilter: selectedStockFilter !== "all" ? selectedStockFilter : undefined,
        page: 1,
        limit: 100, // Load a large batch of products for bulk editing
        includeInactive: true,
      });
      setProducts(response.products);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setError("Failed to load catalog products.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when dynamic select filters change
  useEffect(() => {
    let cancelled = false;
    void getProducts({
      categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
      storeId: selectedStore !== "all" ? Number(selectedStore) : undefined,
      stockFilter: selectedStockFilter !== "all" ? selectedStockFilter : undefined,
      page: 1,
      limit: 100,
      includeInactive: true,
    }).then((response) => {
      if (cancelled) return;
      setProducts(response.products);
      setSelectedIds(new Set());
      setLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error(error);
      setError("Failed to load catalog products.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, selectedStore, selectedStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProductsList();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStore("all");
    setSelectedStockFilter("all");
    setError("");
    setSuccessMsg("");
  };

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const updated = new Set(selectedIds);
    if (checked) {
      updated.add(id);
    } else {
      updated.delete(id);
    }
    setSelectedIds(updated);
  };

  // Inline Cell Save
  const handleCellBlurOrEnter = async (
    productId: string, 
    field: "price" | "stock", 
    originalValue: number, 
    newValueStr: string,
    cellId: string
  ) => {
    const newValue = field === "stock" ? parseInt(newValueStr, 10) : parseFloat(newValueStr);
    if (isNaN(newValue) || newValue === originalValue) return;

    setSavingCellId(cellId);
    setError("");
    setSuccessMsg("");

    const updateData = { [field]: newValue };
    const result = await updateProductDetail(Number(productId), updateData);
    
    setSavingCellId(null);

    if (result.success) {
      setSuccessCellId(cellId);
      // Update local state value
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, [field]: newValue } : p))
      );
      // Remove success animation class after 1.5s
      setTimeout(() => setSuccessCellId(null), 1500);
    } else {
      setError(result.error || "Failed to update item details.");
    }
  };

  // Bulk Actions
  const handleApplyBulkDiscount = async () => {
    const discountVal = parseFloat(bulkDiscount);
    if (isNaN(discountVal) || selectedIds.size === 0) return;

    setError("");
    setSuccessMsg("");
    const ids = Array.from(selectedIds).map(Number);
    
    startTransition(async () => {
      const result = await bulkUpdateProductDetails(ids, { discount: discountVal, discount_type: "percent" });
      if (result.success) {
        setBulkDiscount("");
        setSuccessMsg(`Successfully applied ${discountVal}% discount to ${ids.length} selected items.`);
        loadProductsList();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(result.error || "Failed to apply bulk discount.");
      }
    });
  };

  const handleApplyBulkStock = async () => {
    const stockVal = parseInt(bulkStock, 10);
    if (isNaN(stockVal) || selectedIds.size === 0) return;

    setError("");
    setSuccessMsg("");
    const ids = Array.from(selectedIds).map(Number);

    startTransition(async () => {
      const result = await bulkUpdateProductDetails(ids, { stock: stockVal });
      if (result.success) {
        setBulkStock("");
        setSuccessMsg(`Successfully set stock level to ${stockVal} for ${ids.length} items.`);
        loadProductsList();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(result.error || "Failed to update bulk stock.");
      }
    });
  };

  const handleBulkToggleStatus = async (status: boolean) => {
    if (selectedIds.size === 0) return;

    setError("");
    setSuccessMsg("");
    const ids = Array.from(selectedIds).map(Number);

    startTransition(async () => {
      const result = await bulkUpdateProductDetails(ids, { status });
      if (result.success) {
        setSuccessMsg(`Successfully set status of ${ids.length} items to ${status ? "Active" : "Inactive"}.`);
        loadProductsList();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(result.error || "Failed to toggle status.");
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const targetProducts = selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p.id))
      : products;

    const csvData = targetProducts.map((p) => ({
      ID: p.id,
      Name: p.name,
      Description: p.description,
      Price: p.price,
      Stock: p.stock,
      Status: p.status ? "Active" : "Inactive",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_bulk_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`Exported ${targetProducts.length} items to CSV.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Import from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccessMsg("");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.map((row) => ({
            id: row.ID || row.id,
            price: row.Price || row.price ? parseFloat(row.Price || row.price) : undefined,
            stock: row.Stock || row.stock ? parseInt(row.Stock || row.stock, 10) : undefined,
            status: row.Status || row.status || undefined,
          })).filter((row) => row.id);

          if (rows.length === 0) {
            setError("No valid products with matching ID column found in CSV.");
            return;
          }

          setLoading(true);
          const result = await bulkImportProductDetails(rows);
          if (result.success) {
            setSuccessMsg(`Successfully imported and updated ${result.count} products from CSV.`);
            loadProductsList();
            setTimeout(() => setSuccessMsg(""), 5000);
          } else {
            setError(result.error || "Failed to import CSV rows.");
            setLoading(false);
          }
        } catch (error) {
          setError(getErrorMessage(error, "CSV parsing error"));
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="p-4 space-y-3 flex-1 flex flex-col h-full text-white min-h-0">
      {/* Header and Mini KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Bulk Catalog Editor</h1>
          </div>
        </div>

        {/* Mini KPI Badge Row */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Catalog: <strong className="text-white font-mono font-bold">{initialMetrics.totalProducts}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Package className="w-3.5 h-3.5 text-emerald-500/60" />
            <span>In Stock: <strong className="text-emerald-400 font-mono font-bold">{initialMetrics.availableProducts}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500/60" />
            <span>Out of Stock: <strong className="text-rose-455 font-mono font-bold">{initialMetrics.outOfStock}</strong></span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-violet-500/60" />
            <span>Categories: <strong className="text-violet-400 font-mono font-bold">{initialMetrics.categoriesCount}</strong></span>
          </div>
        </div>

        {/* CSV & Reset Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            id="csv-file-import"
          />
          <button
            onClick={() => document.getElementById("csv-file-import")?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs rounded-lg flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Unified Search & Dropdown Filters Bar */}
      <div className="glass-panel p-2 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            placeholder="Search product code/name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
        </form>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Store:</span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock:</span>
          <select
            value={selectedStockFilter}
            onChange={(e) => setSelectedStockFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="out_of_stock">Out of Stock (&le; 0)</option>
            <option value="low_stock">Critical Low (&le; 5)</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Control Actions (Bulk Operations) */}
      <div className="glass-panel p-2 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-4">
        {/* Bulk Discount */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-500" /> Discount:
          </span>
          <input
            type="number"
            placeholder="e.g. 10%"
            value={bulkDiscount}
            onChange={(e) => setBulkDiscount(e.target.value)}
            className="w-20 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleApplyBulkDiscount}
            disabled={selectedIds.size === 0 || isPending}
            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-[#070a13] font-bold text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-40"
          >
            Apply
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Bulk Stock */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-violet-400" /> Set Stock:
          </span>
          <input
            type="number"
            placeholder="Qty"
            value={bulkStock}
            onChange={(e) => setBulkStock(e.target.value)}
            className="w-16 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleApplyBulkStock}
            disabled={selectedIds.size === 0 || isPending}
            className="px-2.5 py-1 bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-40"
          >
            Apply
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Status Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Status Actions:</span>
          <button
            onClick={() => handleBulkToggleStatus(true)}
            disabled={selectedIds.size === 0 || isPending}
            className="px-2.5 py-1 border border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400 disabled:opacity-40 font-bold text-xs rounded-lg cursor-pointer transition-all"
          >
            Make Active
          </button>
          <button
            onClick={() => handleBulkToggleStatus(false)}
            disabled={selectedIds.size === 0 || isPending}
            className="px-2.5 py-1 border border-rose-500/20 hover:bg-rose-500/5 text-rose-455 disabled:opacity-40 font-bold text-xs rounded-lg cursor-pointer transition-all"
          >
            Make Inactive
          </button>
        </div>

        <div className="ml-auto text-right">
          <span className="text-xs text-slate-400">
            Selected: <span className="text-emerald-400 font-bold font-mono">{selectedIds.size}</span> products
          </span>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 glass-panel rounded-xl border border-slate-800/80 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              {products.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No catalog items found matching active filters.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 sticky top-0 z-10 border-b border-slate-800/80 backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedIds.size === products.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="cursor-pointer rounded border-slate-850 text-emerald-500 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-2.5 px-4 w-20">ID</th>
                      <th className="py-2.5 px-4 w-80">Product Name</th>
                      <th className="py-2.5 px-4 w-40">Base Price (₹)</th>
                      <th className="py-2.5 px-4 w-40">Stock</th>
                      <th className="py-2.5 px-4 w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {products.map((product) => {
                      const isSelected = selectedIds.has(product.id);
                      const priceCellId = `${product.id}-price`;
                      const stockCellId = `${product.id}-stock`;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-slate-900/10 transition-colors ${
                            isSelected ? "bg-emerald-500/2" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                              className="cursor-pointer rounded border-slate-850 text-emerald-500 focus:ring-emerald-500"
                            />
                          </td>

                          {/* ID */}
                          <td className="py-2 px-4 text-slate-500 font-bold">#{product.id}</td>

                          {/* Name */}
                          <td className="py-2 px-4 font-semibold text-white truncate max-w-xs">
                            {product.name}
                          </td>

                          {/* Price Cell */}
                          <td
                            className={`py-1.5 px-3 relative transition-all duration-300 ${
                              successCellId === priceCellId ? "flash-success" : ""
                            }`}
                          >
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                key={`${product.id}-price-${product.price}`}
                                defaultValue={product.price.toFixed(2)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) =>
                                  handleCellBlurOrEnter(
                                    product.id,
                                    "price",
                                    product.price,
                                    e.target.value,
                                    priceCellId
                                  )
                                }
                                className="w-full bg-slate-900/40 border border-slate-800/80 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                              />
                              {savingCellId === priceCellId && (
                                <Loader2 className="absolute right-2 top-1 w-3 h-3 text-emerald-500 animate-spin" />
                              )}
                            </div>
                          </td>

                          {/* Stock Cell */}
                          <td
                            className={`py-1.5 px-3 relative transition-all duration-300 ${
                              successCellId === stockCellId ? "flash-success" : ""
                            }`}
                          >
                            <div className="relative">
                              <input
                                type="number"
                                key={`${product.id}-stock-${product.stock}`}
                                defaultValue={product.stock}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) =>
                                  handleCellBlurOrEnter(
                                    product.id,
                                    "stock",
                                    product.stock,
                                    e.target.value,
                                    stockCellId
                                  )
                                }
                                className="w-full bg-slate-900/40 border border-slate-800/80 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                              />
                              {savingCellId === stockCellId && (
                                <Loader2 className="absolute right-2 top-1 w-3 h-3 text-emerald-500 animate-spin" />
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-2 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border ${
                                product.status
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-455"
                              }`}
                            >
                              {product.status ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer with dynamic counts */}
            <div className="bg-slate-950/60 px-4 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span>Showing</span>
                <strong className="text-white font-mono">{products.length}</strong>
                <span>filtered products in view</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Total Catalog: <strong className="text-white font-mono">{initialMetrics.totalProducts}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Available: <strong className="text-emerald-400 font-mono">{initialMetrics.availableProducts}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Out Of Stock: <strong className="text-rose-455 font-mono">{initialMetrics.outOfStock}</strong></span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
