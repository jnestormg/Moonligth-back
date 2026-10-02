import { Prisma } from "@prisma/client";

// Prisma serializa Decimal como string vía toJSON; lo exponemos como number.
(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function (
  this: InstanceType<typeof Prisma.Decimal>,
): number {
  return Number(this.toString());
};

/** Replacer JSON global: serializa BigInt como number. */
export function bigIntDecimalReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value;
}
