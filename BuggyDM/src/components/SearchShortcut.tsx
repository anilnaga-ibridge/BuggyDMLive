"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { globalSearch, SearchResultItem } from "@/app/actions/search";
import { Search, ShoppingBag, Layers, Package, FileText, X } from "lucide-react";

export default function SearchShortcut() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Listen to Cmd/Ctrl + K and Esc keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch results when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      const resetTimer = window.setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const items = await globalSearch(query);
      setResults(items);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);

    if (item.type === "product") {
      router.push(`/products?search=${encodeURIComponent(item.title)}`);
    } else if (item.type === "order") {
      router.push(`/orders`);
    } else if (item.type === "store") {
      router.push(`/products?storeId=${item.id}`);
    } else if (item.type === "category") {
      router.push(`/products?categoryId=${item.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs pt-[15vh] px-4">
      {/* Backdrop Close Click */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      {/* Search Dialog Box */}
      <div className="w-full max-w-lg bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/20">
          <Search className="w-4.5 h-4.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search products, orders, categories, stores... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-350 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Searching inventory...</div>
          ) : query.trim().length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Type a search query to lookup live platform entities
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No results matching query.</div>
          ) : (
            <div className="space-y-1.5">
              {results.map((item) => {
                const Icon = 
                  item.type === "product" ? Package :
                  item.type === "order" ? FileText :
                  item.type === "store" ? ShoppingBag : Layers;

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-900/50 cursor-pointer group transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.title}</p>
                      {item.subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{item.subtitle}</p>}
                    </div>
                    <span className="text-[8px] font-bold tracking-wider px-2 py-0.5 bg-slate-950 border border-slate-850 text-slate-500 group-hover:border-slate-800 rounded uppercase">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
