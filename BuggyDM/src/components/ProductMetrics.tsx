import { getProductCatalogMetrics } from "@/app/actions/products";
import { Package, ShoppingBag, AlertCircle, Layers, Calendar } from "lucide-react";

export async function ProductMetrics() {
  const metrics = await getProductCatalogMetrics();

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Total Products */}
      <div className="kpi-gradient-total p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Products</p>
          <p className="text-lg font-bold text-white mt-1">{metrics.totalProducts}</p>
        </div>
        <Package className="w-5 h-5 text-emerald-450 opacity-80" />
      </div>

      {/* Available Products */}
      <div className="kpi-gradient-available p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Available</p>
          <p className="text-lg font-bold text-emerald-450 mt-1">{metrics.availableProducts}</p>
        </div>
        <ShoppingBag className="w-5 h-5 text-sky-400 opacity-80" />
      </div>

      {/* Out of Stock */}
      <div className="kpi-gradient-outOfStock p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Out of Stock</p>
          <p className="text-lg font-bold text-rose-450 mt-1">{metrics.outOfStock}</p>
        </div>
        <AlertCircle className="w-5 h-5 text-rose-450 opacity-80" />
      </div>

      {/* Categories count */}
      <div className="kpi-gradient-categories p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Categories</p>
          <p className="text-lg font-bold text-violet-400 mt-1">{metrics.categoriesCount}</p>
        </div>
        <Layers className="w-5 h-5 text-violet-400 opacity-80" />
      </div>

      {/* Active Schedules */}
      <div className="kpi-gradient-schedules p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pricing Crons</p>
          <p className="text-lg font-bold text-amber-500 mt-1">{metrics.activeSchedules}</p>
        </div>
        <Calendar className="w-5 h-5 text-amber-500 opacity-80" />
      </div>
    </div>
  );
}

export function ProductMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between animate-pulse"
        >
          <div className="space-y-2">
            <div className="w-20 h-2.5 rounded bg-slate-800/80" />
            <div className="w-12 h-5 rounded bg-slate-800/90" />
          </div>
          <div className="w-5 h-5 rounded-md bg-slate-800/80" />
        </div>
      ))}
    </div>
  );
}
