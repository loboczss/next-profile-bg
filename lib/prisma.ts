import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: Prisma.DefaultPrismaClient | undefined;
}

const prismaClient =
  globalThis.prismaGlobal ?? (new PrismaClient() as Prisma.DefaultPrismaClient);

export const prisma = prismaClient satisfies Prisma.DefaultPrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
