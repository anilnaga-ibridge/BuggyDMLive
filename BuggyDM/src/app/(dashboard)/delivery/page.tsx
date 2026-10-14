import { getDeliveryBoysMetrics } from "@/app/actions/delivery";
import DeliveryBoysList from "@/components/DeliveryBoysList";

export const dynamic = "force-dynamic";

export default async function DeliveryBoysPage() {
  const metrics = await getDeliveryBoysMetrics();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b11]">
      <DeliveryBoysList initialMetrics={metrics} />
    </div>
  );
}
