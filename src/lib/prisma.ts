import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma ?? createPrismaClient();
  // HMR keeps the old client after `prisma generate`; recreate if new models are missing.
  if (process.env.NODE_ENV !== "production" && typeof existing.judgeNote === "undefined") {
    void existing.$disconnect();
    const next = createPrismaClient();
    globalForPrisma.prisma = next;
    return next;
  }
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = existing;
  }
  return existing;
}

export const prisma = getPrismaClient();
