import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "demo";
  const password = "changeme";
  const avatarUrl = "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1600";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, imageUrl: avatarUrl },
    create: {
      username,
      passwordHash,
      imageUrl: avatarUrl,
    },
    select: { id: true, username: true },
  });

  await prisma.globalSetting.upsert({
    where: { id: 1 },
    update: { backgroundUrl: avatarUrl },
    create: { id: 1, backgroundUrl: avatarUrl },
  });

  const destinationName = "Ilha dos Sonhos";
  const hasDestination = await prisma.destination.findFirst({
    where: { name: destinationName },
    select: { id: true },
  });

  if (!hasDestination) {
    await prisma.destination.create({
      data: {
        name: destinationName,
        city: "Fortaleza - CE",
        description:
          "Uma experiência completa em um paraíso tropical com hospedagem premium, passeios guiados e gastronomia local.",
        price: new Prisma.Decimal(2499.9),
        peopleCount: 2,
        startDate: new Date("2025-01-15T12:00:00.000Z"),
        endDate: new Date("2025-01-22T12:00:00.000Z"),
        rating: 4.8,
        photos: [
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600",
          "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=1600",
        ],
        userId: user.id,
      },
    });
  }

  console.log(`Seed concluído. Usuário padrão: ${user.username} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
