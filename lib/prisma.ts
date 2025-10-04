import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type PrismaGlobal = { prisma?: Prisma.DefaultPrismaClient };

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

export const prisma: Prisma.DefaultPrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
