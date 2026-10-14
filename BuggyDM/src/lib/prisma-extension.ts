import type { Prisma } from "@prisma/client";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

if (!("toJSON" in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    value(this: bigint) {
      return this.toString();
    },
    configurable: true,
    writable: true,
  });
}

export type Serialized<T> =
  T extends bigint ? string
    : T extends Date ? string | null
      : T extends Prisma.Decimal | Prisma.DecimalJsLike ? number
        : T extends readonly (infer Item)[] ? Serialized<Item>[]
          : T extends object ? { [Key in keyof T]: Serialized<T[Key]> }
            : T;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
  constructor?: { name?: string };
  d?: unknown;
  s?: unknown;
};

function isDecimalLike(value: object): value is DecimalLike {
  const candidate = value as DecimalLike;
  return (
    typeof candidate.toNumber === "function" ||
    candidate.constructor?.name === "Decimal" ||
    (candidate.d !== undefined && candidate.s !== undefined)
  );
}

export function serializeBigInts<T>(value: T): Serialized<T> {
  if (value === null || value === undefined) {
    return value as Serialized<T>;
  }
  if (typeof value === "bigint") {
    return value.toString() as Serialized<T>;
  }
  if (value instanceof Date) {
    return (Number.isNaN(value.getTime())
      ? null
      : value.toISOString()) as Serialized<T>;
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInts) as Serialized<T>;
  }
  if (typeof value === "object") {
    if (isDecimalLike(value)) {
      const numericValue =
        typeof value.toNumber === "function"
          ? value.toNumber()
          : Number(value.toString());
      return numericValue as Serialized<T>;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        serializeBigInts(child),
      ]),
    ) as Serialized<T>;
  }
  return value as Serialized<T>;
}
