import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const { email, name, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "email e password obrigatórios" }, { status: 400 });
  }
  if (!prisma) {
    return NextResponse.json(
      {
        ok: false,
        error: "Banco de dados indisponível. Defina DATABASE_URL para usar este endpoint.",
      },
      { status: 503 },
    );
  }
  const hash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.upsert({
    where: { email: String(email).toLowerCase() },
    update: { name, passwordHash: hash },
    create: { email: String(email).toLowerCase(), name, passwordHash: hash },
  });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
