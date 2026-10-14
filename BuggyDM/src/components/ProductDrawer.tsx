"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { ProductData, updateProductDetail, schedulePriceUpdate, getProductSchedules } from "@/app/actions/products";
import { X, Save, AlertCircle, Calendar, Plus } from "lucide-react";
import { getProductImageUrl } from "@/lib/images";
import { getErrorMessage } from "@/lib/errors";

interface ProductDrawerProps {
  product: ProductData | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface PriceSchedule {
  id: number;
  new_price: number;
  old_price: number;
  start_time: string;
  end_time: string;
  status: string;
}

export default function ProductDrawer({ product, onClose, onSaveSuccess }: ProductDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Scheduling States
  const [schedulePrice, setSchedulePrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [schedules, setSchedules] = useState<PriceSchedule[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSchedules = async (itemId: number) => {
    const list = await getProductSchedules(itemId);
    setSchedules(list);
  };

  // Sync state with product data when drawer opens
  useEffect(() => {
    if (!product) return;
    const timer = window.setTimeout(() => {
      setName(product.name);
      setDescription(product.description);
      setPrice(String(product.price));
      setStock(String(product.stock));
      setStatus(product.status);
      setImageUrl(product.image);
      setError("");
      
      // Clear schedule fields
      setSchedulePrice("");
      setStartTime("");
      setEndTime("");
      
      // Load current schedules
      void loadSchedules(Number(product.id));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [product]);

  // Client-side image resizing and optimization before upload
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const resizedFile = await resizeImage(file, 500, 500);
      const formData = new FormData();
      formData.append("file", resizedFile);

      const response = await fetch("/BuggyDm/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      const result = await response.json();
      setImageUrl(result.url);
    } catch (error) {
      setError("Failed to upload image.");
      console.error(getErrorMessage(error, "Failed to upload image"));
    } finally {
      setUploading(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              resolve(file);
            }
          }, file.type);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    setError("");

    const updatedData = {
      name,
      description,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      status: status ? 1 : 0,
      image: imageUrl,
    };

    const result = await updateProductDetail(Number(product.id), updatedData);
    setSaving(false);

    if (result.success) {
      onSaveSuccess();
    } else {
      setError(result.error || "Failed to update product details.");
    }
  };

  // Add Price Schedule Action
  const handleAddSchedule = async () => {
    if (!product || !schedulePrice || !startTime || !endTime) {
      setError("Please fill in all scheduling fields.");
      return;
    }

    setScheduling(true);
    setError("");

    const newPriceVal = parseFloat(schedulePrice);
    if (isNaN(newPriceVal)) {
      setError("Please enter a valid schedule price.");
      setScheduling(false);
      return;
    }

    const result = await schedulePriceUpdate(Number(product.id), {
      newPrice: newPriceVal,
      startTime,
      endTime,
    });

    setScheduling(false);

    if (result.success) {
      setSchedulePrice("");
      setStartTime("");
      setEndTime("");
      loadSchedules(Number(product.id));
    } else {
      setError(result.error || "Failed to save price schedule.");
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop Close Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="w-full max-w-lg bg-[#0b0f19] border-l border-slate-800/80 h-full flex flex-col z-10 shadow-2xl relative animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 shrink-0 bg-slate-950/20">
          <div>
            <h2 className="font-bold text-white text-base">Edit Product</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">Product ID: #{product.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Product Information</h3>
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Price & Stock Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Base Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-white">Active Status</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Toggle product visibility in customer catalog</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:height-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-[#070a13] peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Image</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-800 hover:border-slate-700/80 bg-slate-950/20 rounded-xl p-4 text-center cursor-pointer relative"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageFile(e.target.files[0])}
                />
                {imageUrl ? (
                  <div className="flex items-center gap-4">
                    <NextImage src={getProductImageUrl(imageUrl)} alt="preview" width={56} height={56} unoptimized className="w-14 h-14 object-cover rounded-lg border border-slate-800" />
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 truncate">{imageUrl}</p>
                      <p className="text-[10px] font-bold text-emerald-500 mt-1">Change file</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Drag image here or click to upload</p>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center rounded-xl">
                    <span className="text-xs text-emerald-400 font-semibold">Resizing & saving...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Pricing Scheduling Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Price Scheduler</h3>
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-4">
              {/* Target Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Scheduled Target Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 9.99"
                  value={schedulePrice}
                  onChange={(e) => setSchedulePrice(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-400">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-400">End Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Submit Schedule Button */}
              <button
                type="button"
                onClick={handleAddSchedule}
                disabled={scheduling}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-violet-500 hover:bg-violet-600 active:scale-[0.98] text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all"
              >
                {scheduling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Confirm Price Schedule</span>
                  </>
                )}
              </button>
            </div>

            {/* List of current schedules */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Scheduled Updates History</p>
              
              {schedules.length === 0 ? (
                <p className="text-[10px] text-slate-650 italic">No scheduled updates configured for this item</p>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {schedules.map((sch) => {
                    const startStr = new Date(sch.start_time).toLocaleString();
                    const endStr = new Date(sch.end_time).toLocaleString();
                    
                    return (
                      <div key={sch.id} className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-[10px] flex items-center justify-between">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-slate-300">
                            Price: <span className="text-emerald-400">₹{sch.new_price.toFixed(2)}</span>
                            <span className="text-slate-500 font-normal"> (reverts to ₹{sch.old_price.toFixed(2)})</span>
                          </p>
                          <p className="text-slate-500 truncate">Start: {startStr}</p>
                          <p className="text-slate-500 truncate">End: {endStr}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[8px] tracking-wider shrink-0 ${
                          sch.status === "active"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : sch.status === "completed"
                            ? "bg-slate-800 border border-slate-700 text-slate-500"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        }`}>
                          {sch.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="h-16 flex items-center justify-end gap-3 px-6 border-t border-slate-800/80 shrink-0 bg-slate-950/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-xs font-semibold text-[#070a13] rounded-xl disabled:opacity-50 disabled:active:scale-100 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all duration-150"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-[#070a13] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Loader icon replacement helper
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
