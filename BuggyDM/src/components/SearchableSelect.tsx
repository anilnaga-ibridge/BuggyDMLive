"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search options...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div ref={dropdownRef} className={`relative w-full md:w-64 ${isOpen ? "z-50" : "z-10"}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch(""); // Reset search on open
        }}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs text-left text-white cursor-pointer select-none transition-colors"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/80 bg-slate-950/20">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-550 focus:outline-none py-0.5"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-0.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {/* "All" / Clear Option */}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900/60 flex items-center justify-between cursor-pointer"
            >
              <span>Show All</span>
              {!value && <Check className="w-3.5 h-3.5 text-emerald-450" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-650 italic text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "text-emerald-400 bg-emerald-500/5 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-450" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
