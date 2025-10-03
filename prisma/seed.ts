// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // cria usuário demo (usa upsert para não duplicar)
  const user = await prisma.user.upsert({
    where: { email: "demo@site.com" },
    update: {},
    create: {
      email: "demo@site.com",
      name: "Usuário Demo",
      profile: {
        create: {
          displayName: "Demo",
          avatarUrl: null,
        },
      },
    },
    include: { profile: true },
  });

  // adiciona um background e marca como ativo
  const bg = await prisma.background.create({
    data: {
      userId: user.id,
      imageUrl: "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1600",
      isActive: true,
    },
  });

  // conecta o background ativo ao profile
  await prisma.profile.update({
    where: { userId: user.id },
    data: { activeBgId: bg.id },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
