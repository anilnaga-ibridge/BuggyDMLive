"use server";

import {
  ProductRepository,
  type ProductUpdateData,
} from "@/repositories/database/product.repository";
import { ScheduleRepository } from "@/repositories/database/schedule.repository";
import { revalidatePath } from "next/cache";
import { Permissions, requirePermission } from "@/lib/security/authorization";
import { z } from "zod";

const ProductUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(10_000).optional(),
  price: z.number().finite().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  status: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  image: z.string().max(2_048).optional(),
  categoryId: z.number().int().positive().optional(),
  storeId: z.number().int().positive().optional(),
  tax: z.number().finite().min(0).max(100).optional(),
  discount: z.number().finite().nonnegative().optional(),
  discount_type: z.enum(["percent", "amount"]).optional(),
}).strict();

const ProductIdsSchema = z.array(z.number().int().positive()).min(1).max(1_000);

type ProductRecord = NonNullable<
  Awaited<ReturnType<typeof ProductRepository.findById>>
>;

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: boolean;
  image: string;
  category_id: string;
  store_id: string;
  tax: number;
  discount: number;
  discount_type: string;
}

const serializeProduct = (p: ProductRecord): ProductData => ({
  id: String(p.id),
  name: p.name || "",
  description: p.description || "",
  price: Number(p.price),
  stock: p.stock !== null ? Number(p.stock) : 0,
  status: Boolean(p.status),
  image: p.image || "",
  category_id: p.category_id ? String(p.category_id) : "",
  store_id: p.store_id ? String(p.store_id) : "",
  tax: Number(p.tax),
  discount: Number(p.discount),
  discount_type: p.discount_type || "percent",
});

export async function getProducts(params: {
  search?: string;
  categoryId?: number;
  storeId?: number;
  stockFilter?: string;
  page: number;
  limit: number;
  includeInactive?: boolean;
}) {
  await requirePermission(Permissions.catalogRead);

  try {
    const { items, total } = await ProductRepository.findPaginated(params);
    return {
      products: items.map(serializeProduct),
      total,
    };
  } catch (error) {
    console.error("Error loading products:", error);
    return { products: [], total: 0 };
  }
}

export async function getFilterOptions() {
  await requirePermission(Permissions.catalogRead);

  try {
    const [categories, stores] = await Promise.all([
      ProductRepository.getAllCategories(),
      ProductRepository.getAllStores(),
    ]);

    return {
      categories: categories.map((c) => ({
        id: String(c.id),
        name: c.parent_id > 0 ? ` └─ ${c.name}` : c.name,
      })),
      stores: stores.map((s) => ({ id: String(s.id), name: s.name })),
    };
  } catch (error) {
    console.error("Error loading filter options:", error);
    return { categories: [], stores: [] };
  }
}

export async function updateProductDetail(id: number, data: unknown) {
  await requirePermission(Permissions.catalogManage);

  try {
    const parsedId = ProductIdsSchema.element.safeParse(id);
    const parsedData = ProductUpdateSchema.safeParse(data);
    if (!parsedId.success || !parsedData.success) {
      return { success: false, error: "Invalid product update." };
    }
    await ProductRepository.updateProduct(parsedId.data, parsedData.data);
    revalidatePath("/products");
    revalidatePath("/bulk-editor");
    return { success: true };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product." };
  }
}

export async function bulkUpdateProductDetails(ids: number[], data: unknown) {
  await requirePermission(Permissions.catalogManage);

  try {
    const parsedIds = ProductIdsSchema.safeParse(ids);
    const parsedData = ProductUpdateSchema.safeParse(data);
    if (!parsedIds.success || !parsedData.success) {
      return { success: false, error: "Invalid bulk product update." };
    }
    await ProductRepository.bulkUpdateItems(parsedIds.data, parsedData.data);
    revalidatePath("/products");
    revalidatePath("/bulk-editor");
    return { success: true };
  } catch (error) {
    console.error("Error in bulk updates:", error);
    return { success: false, error: "Failed to batch update products." };
  }
}

export async function schedulePriceUpdate(
  itemId: number, 
  data: { newPrice: number; startTime: string; endTime: string }
) {
  await requirePermission(Permissions.catalogManage);

  try {
    const schedule = z.object({
      newPrice: z.number().finite().nonnegative(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
    }).safeParse(data);
    if (!schedule.success || Date.parse(schedule.data.endTime) <= Date.parse(schedule.data.startTime)) {
      return { success: false, error: "Invalid price schedule." };
    }
    const item = await ProductRepository.findById(itemId);
    if (!item) {
      return { success: false, error: "Product not found." };
    }

    const currentPrice = Number(item.price);

    await ScheduleRepository.createSchedule({
      itemId,
      newPrice: schedule.data.newPrice,
      oldPrice: currentPrice,
      startTime: new Date(schedule.data.startTime),
      endTime: new Date(schedule.data.endTime),
    });

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error scheduling price update:", error);
    return { success: false, error: "Failed to schedule price update." };
  }
}

export async function getProductSchedules(itemId: number) {
  await requirePermission(Permissions.catalogRead);

  try {
    const schedules = await ScheduleRepository.getSchedulesForItem(itemId);
    return schedules.map((s) => ({
      id: s.id,
      new_price: Number(s.new_price),
      old_price: Number(s.old_price),
      start_time: s.start_time ? s.start_time.toISOString() : "",
      end_time: s.end_time ? s.end_time.toISOString() : "",
      status: s.status || "pending",
    }));
  } catch (error) {
    console.error("Error fetching product schedules:", error);
    return [];
  }
}

export async function getProductCatalogMetrics() {
  await requirePermission(Permissions.catalogRead);

  try {
    return await ProductRepository.getGlobalMetrics();
  } catch (error) {
    console.error("Error fetching product catalog metrics:", error);
    return {
      totalProducts: 0,
      availableProducts: 0,
      outOfStock: 0,
      categoriesCount: 0,
      activeSchedules: 0,
    };
  }
}

export async function bulkImportProductDetails(rows: Array<{
  id: string;
  price?: number;
  stock?: number;
  status?: string;
}>) {
  await requirePermission(Permissions.catalogManage);

  try {
    const updates = rows.map(async (row) => {
      const id = parseInt(row.id, 10);
      if (isNaN(id)) return;
      
      const updateData: ProductUpdateData = {};
      if (row.price !== undefined) updateData.price = row.price;
      if (row.stock !== undefined) updateData.stock = row.stock;
      if (row.status !== undefined) {
        updateData.status = row.status.toLowerCase() === "active" ? 1 : 0;
      }
      
      await ProductRepository.updateProduct(id, updateData);
    });
    
    await Promise.all(updates);
    revalidatePath("/products");
    revalidatePath("/bulk-editor");
    return { success: true, count: rows.length };
  } catch (error) {
    console.error("CSV bulk import error:", error);
    return { success: false, error: "Failed to import items from CSV." };
  }
}
