import { PrismaClient } from "@prisma/client";

type PrismaGlobal = { prisma?: PrismaClient | null };

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    const message =
      "DATABASE_URL não está definido. Recursos que dependem do banco de dados ficarão indisponíveis.";

    if (process.env.NODE_ENV === "production") {
      console.error(message);
    } else {
      console.warn(message);
    }

    return null;
  }

  try {
    return new PrismaClient();
  } catch (error) {
    console.error("Não foi possível inicializar o Prisma Client", error);
    return null;
  }
}

export const prisma =
  globalForPrisma.prisma === undefined ? createPrismaClient() : globalForPrisma.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}