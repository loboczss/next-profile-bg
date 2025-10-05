import type { Prisma } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    destination: Prisma.DestinationDelegate;
  }
}
