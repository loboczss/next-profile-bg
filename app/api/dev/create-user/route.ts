import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { username, password, imageUrl, fullName, email, role } = await request.json();

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
  const normalizedFullName =
    typeof fullName === "string" && fullName.trim().length > 0
      ? fullName.trim()
      : normalizedUsername;
  const normalizedEmail =
    typeof email === "string" && email.trim().length > 0
      ? String(email).trim().toLowerCase()
      : `${normalizedUsername}@example.com`;
  const normalizedRole = role === "admin" ? "admin" : "user";

  if (!prisma) {
    return NextResponse.json(
      { ok: false, error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  const user = await prisma.user.upsert({
    where: { username: normalizedUsername },
    update: {
      passwordHash: hash,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      fullName: normalizedFullName,
      email: normalizedEmail,
      role: normalizedRole,
    },
    create: {
      username: normalizedUsername,
      passwordHash: hash,
      imageUrl: imageUrl ? String(imageUrl) : null,
      fullName: normalizedFullName,
      email: normalizedEmail,
      role: normalizedRole,
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
