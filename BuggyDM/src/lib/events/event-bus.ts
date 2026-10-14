import { EventEmitter } from "events";
import { getRedisClient } from "@/lib/redis";
import { serializeBigInts } from "@/lib/prisma-extension";

export type DomainEventType = 
  | "order.created"
  | "order.assigned"
  | "picking.started"
  | "picking.completed"
  | "packing.completed"
  | "dispatch.ready"
  | "rider.assigned"
  | "order.delivered"
  | "order.returned"
  | "sla.breached"
  | "experience.experiment.started"
  | "experience.experiment.ended";

export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: DomainEventType;
  timestamp: string;
  payload: T;
}

class DomainEventBus extends EventEmitter {
  private redisChannel = "qcom_domain_events";

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit a domain event in-process and broadcast over Redis Pub/Sub
   */
  public async emitEvent<T>(eventType: DomainEventType, payload: T): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = {
      eventId: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      timestamp: new Date().toISOString(),
      payload,
    };

    // 1. Emit locally via EventEmitter
    this.emit(eventType, event);
    this.emit("*", event);

    // 2. Publish to Redis Pub/Sub if available
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.publish(
          this.redisChannel,
          JSON.stringify(serializeBigInts(event)),
        );
      }
    } catch (err) {
      console.warn("EventBus Redis publish failed (falling back to local emitter):", err);
    }

    return event;
  }

  /**
   * Subscribe to specific domain event type
   */
  public subscribe<T>(eventType: DomainEventType | "*", listener: (event: DomainEvent<T>) => void): void {
    this.on(eventType, listener);
  }
}

export const eventBus = new DomainEventBus();
