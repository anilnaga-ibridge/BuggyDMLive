import { Suspense } from "react";
import { getFilterOptions } from "@/app/actions/products";
import ProductsList from "@/components/ProductsList";
import { ProductMetrics, ProductMetricsSkeleton } from "@/components/ProductMetrics";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const filters = await getFilterOptions();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b11]">
      <ProductsList 
        categories={filters.categories} 
        stores={filters.stores} 
        metricsSlot={
          <Suspense fallback={<ProductMetricsSkeleton />}>
            <ProductMetrics />
          </Suspense>
        }
      />
    </div>
  );
}
