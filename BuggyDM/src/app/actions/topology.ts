"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export async function getDarkStores() {
  await requirePermission(Permissions.operationsRead);

  try {
    const stores = await prisma.stores.findMany({
      where: {
        code: { not: null }
      },
      include: {
        organization: true,
        topology: true,
        inventory: {
          include: { item: true },
          take: 50
        }
      },
      orderBy: { created_at: "desc" }
    });

    return serializeBigInts(stores);
  } catch (err) {
    console.error("getDarkStores error:", err);
    throw new Error("Failed to fetch dark stores");
  }
}

export async function createDarkStore(
  name: string,
  code: string,
  address: string,
  latitude: number,
  longitude: number,
  capacityOrders: number = 100
) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const store = await prisma.stores.create({
      data: {
        name,
        phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        email: `${code.toLowerCase()}@buggydelivery.com`,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address,
        vendor_id: 1,
        module_id: 1,
        code: code.toUpperCase().trim(),
        capacity_orders: capacityOrders,
        comment: "",
        tin: "TIN-1234",
        tin_expire_date: new Date("2030-01-01"),
        tin_certificate_image: ""
      }
    });

    return serializeBigInts(store);
  } catch (err) {
    console.error("createDarkStore error:", err);
    throw new Error("Failed to create dark store");
  }
}

export async function createTopologyBin(
  storeId: string,
  zone: string,
  rackCode: string,
  shelf: string,
  binCode: string
) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const bin = await prisma.qcom_store_topology.create({
      data: {
        store_id: BigInt(storeId),
        zone,
        rack_code: rackCode.toUpperCase().trim(),
        shelf: shelf.toUpperCase().trim(),
        bin_code: binCode.toUpperCase().trim()
      }
    });

    return serializeBigInts(bin);
  } catch (err) {
    console.error("createTopologyBin error:", err);
    throw new Error("Failed to create topology bin");
  }
}

export async function updateBinStock(
  storeId: string,
  itemId: string,
  binCode: string,
  quantity: number,
  reservedQty: number = 0
) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const stock = await prisma.qcom_store_inventory.upsert({
      where: {
        store_id_item_id_bin_code: {
          store_id: BigInt(storeId),
          item_id: BigInt(itemId),
          bin_code: binCode
        }
      },
      update: {
        quantity,
        reserved_qty: reservedQty,
        updated_at: new Date()
      },
      create: {
        store_id: BigInt(storeId),
        item_id: BigInt(itemId),
        bin_code: binCode,
        quantity,
        reserved_qty: reservedQty
      }
    });

    return serializeBigInts(stock);
  } catch (err) {
    console.error("updateBinStock error:", err);
    throw new Error("Failed to update bin stock");
  }
}
