import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ProductFilterParams {
  search?: string;
  categoryId?: number;
  storeId?: number;
  stockFilter?: string;
  page: number;
  limit: number;
  includeInactive?: boolean;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: boolean | 0 | 1;
  image?: string;
  categoryId?: number;
  storeId?: number;
  tax?: number;
  discount?: number;
  discount_type?: "percent" | "amount";
}

export type ProductBulkUpdateData = Pick<
  ProductUpdateData,
  | "price"
  | "stock"
  | "status"
  | "categoryId"
  | "storeId"
  | "tax"
  | "discount"
  | "discount_type"
>;

export class ProductRepository {
  static async findPaginated({
    search,
    categoryId,
    storeId,
    stockFilter,
    page,
    limit,
    includeInactive
  }: ProductFilterParams) {
    const where: Prisma.itemsWhereInput = {};

    if (!includeInactive) where.status = true;

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (categoryId) {
      // Find any child subcategories of this parent category
      const subcategories = await prisma.categories.findMany({
        where: { parent_id: categoryId },
        select: { id: true },
      });

      const targetCategoryIds = [
        BigInt(categoryId),
        ...subcategories.map((sub) => BigInt(sub.id)),
      ];

      where.category_id = {
        in: targetCategoryIds,
      };
    }

    if (storeId) {
      where.store_id = BigInt(storeId);
    }

    if (stockFilter) {
      if (stockFilter === "in_stock") {
        where.stock = { gt: 0 };
      } else if (stockFilter === "out_of_stock") {
        where.OR = [
          { stock: { lte: 0 } },
          { stock: null },
        ];
      } else if (stockFilter === "low_stock") {
        where.stock = {
          lte: 5,
          gt: 0,
        };
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.items.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          status: true,
          image: true,
          category_id: true,
          store_id: true,
          tax: true,
          discount: true,
          discount_type: true,
        },
        skip,
        take: limit,
        orderBy: {
          id: "desc",
        },
      }),
      prisma.items.count({ where }),
    ]);

    return { items, total };
  }

  static async findById(id: number) {
    return await prisma.items.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        status: true,
        image: true,
        category_id: true,
        store_id: true,
        tax: true,
        discount: true,
        discount_type: true,
      },
    });
  }

  static async getAllCategories() {
    return await prisma.categories.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        parent_id: true,
        position: true,
      },
      orderBy: [
        { parent_id: "asc" },
        { name: "asc" },
      ],
    });
  }

  static async getAllStores() {
    return await prisma.stores.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async updateProduct(id: number, data: ProductUpdateData) {
    const finalData: Prisma.itemsUncheckedUpdateInput = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.status !== undefined ? { status: Boolean(data.status) } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.categoryId !== undefined ? { category_id: BigInt(data.categoryId) } : {}),
      ...(data.storeId !== undefined ? { store_id: BigInt(data.storeId) } : {}),
      ...(data.tax !== undefined ? { tax: data.tax } : {}),
      ...(data.discount !== undefined ? { discount: data.discount } : {}),
      ...(data.discount_type !== undefined ? { discount_type: data.discount_type } : {}),
    };

    // Default rule: if stock is <= 0 or null, status must be inactive
    if (data.stock !== undefined) {
      if (data.stock <= 0) {
        finalData.status = false;
      } else {
        // Only set status to true if not explicitly set to false in request
        if (finalData.status === undefined) {
          finalData.status = true;
        }
      }
    }

    if (finalData.status !== undefined) {
      // Check stock limit for status override
      const currentItem = await this.findById(id);
      const stockCheck = data.stock !== undefined ? data.stock : currentItem?.stock;
      if (
        finalData.status &&
        (stockCheck === null || stockCheck === undefined || stockCheck <= 0)
      ) {
        finalData.status = false;
      }
    }

    return await prisma.items.update({
      where: { id: BigInt(id) },
      data: {
        ...finalData,
        updated_at: new Date(),
      },
    });
  }

  static async bulkUpdateItems(ids: number[], data: ProductBulkUpdateData) {
    const updateData: Prisma.itemsUpdateManyMutationInput = {
      updated_at: new Date(),
    };

    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) {
      updateData.stock = data.stock;
      if (data.stock === null || data.stock <= 0) {
        updateData.status = false;
      } else {
        if (data.status === undefined) {
          updateData.status = true;
        }
      }
    }
    if (data.status !== undefined) {
      // Ensure items with no stock remain inactive even if setting status to true
      if (data.status) {
        if (data.stock !== undefined) {
          updateData.status = data.stock <= 0 ? false : true;
        }
        // If stock is not passed in bulk request, we do updateMany where we verify or let DB handle it.
        // For simplicity, update status directly unless stock <= 0
      } else {
        updateData.status = false;
      }
    }
    if (data.categoryId !== undefined) updateData.category_id = BigInt(data.categoryId);
    if (data.storeId !== undefined) updateData.store_id = BigInt(data.storeId);
    if (data.tax !== undefined) updateData.tax = data.tax;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;

    // First do the status override for zero stock items in this bulk batch
    const result = await prisma.items.updateMany({
      where: {
        id: {
          in: ids.map((id) => BigInt(id)),
        },
      },
      data: updateData,
    });

    // Enforce that any item in the batch with stock <= 0 or null is immediately set to inactive (status = 0)
    await prisma.items.updateMany({
      where: {
        id: {
          in: ids.map((id) => BigInt(id)),
        },
        OR: [
          { stock: { lte: 0 } },
          { stock: null },
        ],
      },
      data: {
        status: false,
      },
    });

    return result;
  }

  static async getGlobalMetrics() {
    const rawItemsPromise = (async () => {
      try {
        const stats = await prisma.$queryRaw<
          Array<{ total: number | bigint; available: number | bigint; outOfStock: number | bigint }>
        >`
          SELECT 
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN stock > 0 AND (status = 1 OR status = TRUE) THEN 1 ELSE 0 END), 0) AS available,
            COALESCE(SUM(CASE WHEN stock <= 0 OR stock IS NULL THEN 1 ELSE 0 END), 0) AS outOfStock
          FROM items
        `;
        if (stats && stats[0]) {
          return {
            totalProducts: Number(stats[0].total || 0),
            availableProducts: Number(stats[0].available || 0),
            outOfStock: Number(stats[0].outOfStock || 0),
          };
        }
      } catch {
        // Fallback to standard Prisma count queries if queryRaw fails
      }
      const [total, avail, out] = await Promise.all([
        prisma.items.count(),
        prisma.items.count({ where: { stock: { gt: 0 }, status: true } }),
        prisma.items.count({ where: { OR: [{ stock: { lte: 0 } }, { stock: null }] } }),
      ]);
      return { totalProducts: total, availableProducts: avail, outOfStock: out };
    })();

    const [itemStats, categoriesCount, activeSchedules] = await Promise.all([
      rawItemsPromise,
      prisma.categories.count({
        where: {
          parent_id: 0,
        },
      }),
      prisma.panel_price_schedules.count({
        where: {
          status: { in: ["active", "pending"] },
        },
      }).catch(() => 0),
    ]);

    return {
      totalProducts: itemStats.totalProducts,
      availableProducts: itemStats.availableProducts,
      outOfStock: itemStats.outOfStock,
      categoriesCount,
      activeSchedules,
    };
  }
}
