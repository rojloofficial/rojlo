import "server-only";
import { PrismaClient } from "@prisma/client";

declare global {
  var _prismaInstance: PrismaClient | undefined;
}

/**
 * Global singleton PrismaClient instance.
 * Avoids multiple connections during Next.js Hot Module Replacement in development.
 */
export const prisma: PrismaClient =
  global._prismaInstance ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global._prismaInstance = prisma;
}

/**
 * Returns true if DATABASE_URL is configured in the environment.
 */
export function isMariaDbConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url.length > 0 && !url.includes("USERNAME:PASSWORD"));
}
