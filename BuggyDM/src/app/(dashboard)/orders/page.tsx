import { getActiveOrders } from "@/app/actions/orders";
import OrderKanban from "@/components/OrderKanban";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const initialOrders = await getActiveOrders();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b11]">
      <OrderKanban initialOrders={initialOrders} />
    </div>
  );
}
