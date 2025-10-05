import { PrismaClient } from "@prisma/client";

type PrismaGlobal = { prisma?: PrismaClient };

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
