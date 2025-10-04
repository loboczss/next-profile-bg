import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: Prisma.DefaultPrismaClient | undefined;
}

const prismaClient = globalThis.prismaGlobal ?? new PrismaClient();

export const prisma: Prisma.DefaultPrismaClient = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prismaClient;
}
