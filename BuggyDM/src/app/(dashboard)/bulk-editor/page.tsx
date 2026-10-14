import { getFilterOptions, getProductCatalogMetrics } from "@/app/actions/products";
import BulkEditorGrid from "@/components/BulkEditorGrid";

export const dynamic = "force-dynamic";

export default async function BulkEditorPage() {
  const [filters, metrics] = await Promise.all([
    getFilterOptions(),
    getProductCatalogMetrics(),
  ]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b11]">
      <BulkEditorGrid
        initialMetrics={metrics}
        categories={filters.categories}
        stores={filters.stores}
      />
    </div>
  );
}
