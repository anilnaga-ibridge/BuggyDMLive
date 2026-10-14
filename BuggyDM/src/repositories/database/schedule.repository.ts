import { prisma } from "@/lib/prisma";

export class ScheduleRepository {
  static async createSchedule(data: {
    itemId: number;
    newPrice: number;
    oldPrice: number;
    startTime: Date;
    endTime: Date;
  }) {
    return await prisma.panel_price_schedules.create({
      data: {
        item_id: BigInt(data.itemId),
        new_price: data.newPrice,
        old_price: data.oldPrice,
        start_time: data.startTime,
        end_time: data.endTime,
        status: "pending",
      },
    });
  }

  static async findPendingActive() {
    try {
      const now = new Date();
      return await prisma.panel_price_schedules.findMany({
        where: {
          status: "pending",
          start_time: {
            lte: now,
          },
        },
        include: {
          items: true,
        },
      });
    } catch {
      return [];
    }
  }

  static async findActiveExpired() {
    try {
      const now = new Date();
      return await prisma.panel_price_schedules.findMany({
        where: {
          status: "active",
          end_time: {
            lte: now,
          },
        },
        include: {
          items: true,
        },
      });
    } catch {
      return [];
    }
  }

  static async updateStatus(id: number, status: string) {
    try {
      return await prisma.panel_price_schedules.update({
        where: { id },
        data: {
          status,
          updated_at: new Date(),
        },
      });
    } catch {
      return null;
    }
  }

  static async getSchedulesForItem(itemId: number) {
    try {
      return await prisma.panel_price_schedules.findMany({
        where: {
          item_id: BigInt(itemId),
        },
        orderBy: {
          created_at: "desc",
        },
      });
    } catch {
      return [];
    }
  }
}
