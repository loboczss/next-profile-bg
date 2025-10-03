import { PrismaClient } from "@prisma/client";
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
