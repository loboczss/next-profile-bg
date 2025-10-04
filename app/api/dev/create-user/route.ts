import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { username, password, imageUrl } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "username e password obrigatórios" },
      { status: 400 },
    );
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  if (!normalizedUsername) {
    return NextResponse.json(
      { ok: false, error: "username inválido" },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username: normalizedUsername },
    update: {
      passwordHash: hash,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
    },
    create: {
      username: normalizedUsername,
      passwordHash: hash,
      imageUrl: imageUrl ? String(imageUrl) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      imageUrl: user.imageUrl,
    },
  });
}
