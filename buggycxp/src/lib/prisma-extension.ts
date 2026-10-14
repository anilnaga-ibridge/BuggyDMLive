/** JSON-safe serialization for BigInt, Date and Prisma Decimal-like values. */
type DecimalLike = { toNumber?: () => number; toString: () => string; constructor?: { name?: string }; d?: unknown; s?: unknown };

declare global {
  interface BigInt { toJSON(): string }
}

if (!BigInt.prototype.toJSON) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    value(this: bigint) { return this.toString(); }, configurable: true, writable: true,
  });
}

export function serializeBigInts<T>(obj: T): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return Number.isNaN(obj.getTime()) ? null : obj.toISOString();
  if (typeof obj === "object") {
    const decimal = obj as DecimalLike;
    if (typeof decimal.toNumber === "function" || decimal.constructor?.name === "Decimal" || (decimal.d !== undefined && decimal.s !== undefined)) {
      return typeof decimal.toNumber === "function" ? decimal.toNumber() : Number(decimal.toString());
    }
  }
  if (Array.isArray(obj)) return obj.map((value) => serializeBigInts(value));
  if (typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([key, value]) => [key, serializeBigInts(value)]));
  }
  return obj;
}
