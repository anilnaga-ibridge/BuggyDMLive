import { eventBus, DomainEventType } from "@/lib/events/event-bus";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";

export type QComOrderStage = "Queue" | "Picking" | "Packing" | "Dispatch" | "Enroute" | "Delivered" | "Returned";

export interface WorkflowTransitionResult {
  success: boolean;
  orderId: string;
  previousStage: string;
  currentStage: QComOrderStage;
  message: string;
}

export class WorkflowEngine {
  private static validTransitions: Record<string, QComOrderStage[]> = {
    "Queue": ["Picking", "Returned"],
    "Picking": ["Packing", "Queue", "Returned"],
    "Packing": ["Dispatch", "Picking", "Returned"],
    "Dispatch": ["Enroute", "Returned"],
    "Enroute": ["Delivered", "Returned"],
    "Delivered": ["Returned"],
    "Returned": []
  };

  /**
   * Transition an order safely to the next stage in the fulfillment workflow
   */
  public static async transitionOrder(
    orderId: string,
    targetStage: QComOrderStage,
    operatorId?: string,
    notes?: string
  ): Promise<WorkflowTransitionResult> {
    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) }
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    const currentStage = (order.qcom_stage || "Queue") as QComOrderStage;
    const allowed = this.validTransitions[currentStage] || [];

    if (!allowed.includes(targetStage)) {
      throw new Error(`Invalid workflow transition from '${currentStage}' to '${targetStage}' for Order #${orderId}`);
    }

    // Update order in database
    await prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: {
        qcom_stage: targetStage,
        updated_at: new Date()
      }
    });

    // Map targetStage to Domain Event
    const eventMap: Record<QComOrderStage, DomainEventType> = {
      "Queue": "order.created",
      "Picking": "picking.started",
      "Packing": "picking.completed",
      "Dispatch": "packing.completed",
      "Enroute": "dispatch.ready",
      "Delivered": "order.delivered",
      "Returned": "order.returned"
    };

    const domainEventType = eventMap[targetStage];
    if (domainEventType) {
      await eventBus.emitEvent(domainEventType, {
        orderId,
        previousStage: currentStage,
        currentStage: targetStage,
        operatorId,
        notes
      });
    }

    return serializeBigInts({
      success: true,
      orderId,
      previousStage: currentStage,
      currentStage: targetStage,
      message: `Order #${orderId} successfully transitioned to ${targetStage}`
    });
  }
}
