import type { Prisma } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient<
    ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
    U = "log" extends keyof ClientOptions
      ? ClientOptions["log"] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
        ? Prisma.GetEvents<ClientOptions["log"]>
        : never
      : never,
    ExtArgs extends Prisma.$Extensions.InternalArgs = Prisma.$Extensions.DefaultArgs,
  > {
    globalSetting: Prisma.GlobalSettingDelegate<ExtArgs, ClientOptions>;
    destination: Prisma.DestinationDelegate<ExtArgs, ClientOptions>;
    user: Prisma.UserDelegate<ExtArgs, ClientOptions>;
  }
}
