import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(32, "Usuário deve ter no máximo 32 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, traço e sublinhado"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { username, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Usuário já cadastrado" }, { status: 409 });
    }

    console.error("Falha ao cadastrar usuário", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
