import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  fullName: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(3, "Informe pelo menos 3 caracteres")
    .max(120, "Nome pode ter no máximo 120 caracteres"),
  username: z
    .string({ required_error: "Usuário é obrigatório" })
    .trim()
    .min(3, "Informe pelo menos 3 caracteres")
    .max(40, "Usuário pode ter no máximo 40 caracteres")
    .regex(/^[a-z0-9_.-]+$/i, "Use apenas letras, números ou ._-"),
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido"),
  password: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0 ? undefined : value,
      z
        .string()
        .min(8, "A senha precisa de pelo menos 8 caracteres")
        .max(100, "A senha pode ter no máximo 100 caracteres"),
    )
    .optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Dados inválidos", fieldErrors }, { status: 400 });
  }

  const { fullName, username, email, password } = parsed.data;
  const userId = Number(session.user.id);

  try {
    const [usernameExists, emailExists] = await Promise.all([
      prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
        select: { id: true },
      }),
    ]);

    if (usernameExists) {
      return NextResponse.json(
        { error: "Nome de usuário já está em uso", fieldErrors: { username: ["Nome de usuário já está em uso"] } },
        { status: 409 },
      );
    }

    if (emailExists) {
      return NextResponse.json(
        { error: "E-mail já cadastrado", fieldErrors: { email: ["E-mail já cadastrado"] } },
        { status: 409 },
      );
    }

    const updateData: {
      fullName: string;
      username: string;
      email: string;
      passwordHash?: string;
    } = { fullName, username, email };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: {
        ...updated,
        id: updated.id.toString(),
      },
      message: "Dados atualizados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o perfil agora" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
