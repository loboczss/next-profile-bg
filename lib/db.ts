import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
  prismaInitError?: unknown;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL || globalForPrisma.prismaInitError) {
    return undefined;
  }

  try {
    return new PrismaClient({
      log: ["warn", "error"],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to initialize PrismaClient", error);
    }
    globalForPrisma.prismaInitError = error;
    globalForPrisma.prisma = null;
    return undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (prisma && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
