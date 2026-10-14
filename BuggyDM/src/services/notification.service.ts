import { eventBus, DomainEvent } from "@/lib/events/event-bus";

export type NotificationChannel = "push" | "sms" | "whatsapp" | "email" | "websocket" | "voice";

export interface NotificationPayload {
  recipientId: string;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

function eventOrderId(event: DomainEvent): string {
  if (
    typeof event.payload === "object" &&
    event.payload !== null &&
    "orderId" in event.payload
  ) {
    return String(event.payload.orderId);
  }
  return "unknown";
}

export class NotificationService {
  /**
   * Initialize notification listeners subscribing to central Domain Event Bus
   */
  public static initListeners(): void {
    eventBus.subscribe("*", (event: DomainEvent) => {
      this.handleDomainEvent(event);
    });
  }

  /**
   * Process incoming domain events and dispatch multi-channel notifications
   */
  private static handleDomainEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case "sla.breached":
        console.log(`[NOTIFICATION SERVICE] 🚨 VOICE & WEBSOCKET ALERT: SLA breached for Order #${eventOrderId(event)}`);
        break;
      case "order.assigned":
        console.log(`[NOTIFICATION SERVICE] 📲 PUSH NOTIFICATION: Targeted broadcast ping for Order #${eventOrderId(event)}`);
        break;
      case "order.delivered":
        console.log(`[NOTIFICATION SERVICE] 💬 WHATSAPP & SMS: Order #${eventOrderId(event)} delivered!`);
        break;
      default:
        break;
    }
  }

  /**
   * Directly send a notification across specified channels
   */
  public static async sendNotification(payload: NotificationPayload): Promise<boolean> {
    console.log(`[NOTIFICATION SERVICE] Dispatching to ${payload.channels.join(", ")} -> ${payload.title}: ${payload.body}`);
    return true;
  }
}

// Auto-initialize notification event listeners
NotificationService.initListeners();
