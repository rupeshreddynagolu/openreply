/**
 * JSON Array Helper
 *
 * Automation.keywords and Automation.publicReplyMessages are stored as a
 * Json column on MySQL (Prisma has no scalar-list support for MySQL), so
 * Prisma's generated type for them is Prisma.JsonValue rather than
 * string[]. This narrows a JsonValue read back from Prisma down to a
 * string[], for the handful of call sites that need one.
 */

import type { Prisma } from "@/app/generated/prisma/client";

export function asStringArray(
  value: Prisma.JsonValue | null | undefined
): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
