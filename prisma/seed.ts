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

  const destinationsCount = await prisma.destination.count();

  if (destinationsCount === 0) {
    const demoDestinations = [
      {
        name: "Praia do Paraíso",
        city: "Fortaleza - CE",
        description:
          "Pacote completo para curtir o litoral cearense com hospedagem em resort pé na areia, traslado e café da manhã incluso.",
        price: new Prisma.Decimal("1999.90"),
        peopleCount: 2,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-22"),
        rating: 4.8,
        photos: [
          "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?w=1600",
          "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1600",
        ],
      },
      {
        name: "Campos do Jordão Charmoso",
        city: "Campos do Jordão - SP",
        description:
          "Fim de semana romântico nas montanhas com hospedagem em hotel boutique, fondue incluso e passeio guiado pela cidade.",
        price: new Prisma.Decimal("1390.00"),
        peopleCount: 2,
        startDate: new Date("2025-06-06"),
        endDate: new Date("2025-06-09"),
        rating: 4.6,
        photos: [
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600",
        ],
      },
      {
        name: "Aventura em Foz do Iguaçu",
        city: "Foz do Iguaçu - PR",
        description:
          "Explore as Cataratas com passeio de barco Macuco, visita ao Parque das Aves e hospedagem em hotel 4 estrelas.",
        price: new Prisma.Decimal("2490.50"),
        peopleCount: 4,
        startDate: new Date("2025-03-10"),
        endDate: new Date("2025-03-15"),
        rating: 4.9,
        photos: [
          "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=1600",
          "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600",
        ],
      },
    ];

    await Promise.all(
      demoDestinations.map((destination) =>
        prisma.destination.create({
          data: {
            ...destination,
            userId: user.id,
          },
        })
      )
    );
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
