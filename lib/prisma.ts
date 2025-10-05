import { Prisma, PrismaClient } from "@prisma/client";

type ExtendedPrismaClient = PrismaClient & {
  destination: Prisma.DestinationDelegate;
};

type PrismaGlobal = { prisma?: ExtendedPrismaClient };

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

export const prisma =
  globalForPrisma.prisma ?? (new PrismaClient() as ExtendedPrismaClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
