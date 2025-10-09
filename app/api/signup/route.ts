import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export const runtime = "nodejs";

const ADMIN_CODE = "258790" as const;

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Usuário deve ter pelo menos 3 caracteres")
      .max(32, "Usuário deve ter no máximo 32 caracteres")
      .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, traço e sublinhado")
      .trim(),
    fullName: z
      .string()
      .min(3, "Nome completo deve ter pelo menos 3 caracteres")
      .max(80, "Nome completo deve ter no máximo 80 caracteres")
      .transform((value) => value.trim().replace(/\s+/g, " ")),
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("E-mail inválido")
      .max(160, "E-mail deve ter no máximo 160 caracteres")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(128, "Senha deve ter no máximo 128 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "Confirme sua senha")
      .max(128, "Confirmação deve ter no máximo 128 caracteres"),
    profileType: z.enum(["user", "admin"], {
      errorMap: () => ({ message: "Tipo de perfil inválido" }),
    }),
    adminCode: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem",
      });
    }

    if (data.profileType === "admin") {
      const code = data.adminCode?.trim();
      if (!code) {
        ctx.addIssue({
          path: ["adminCode"],
          code: z.ZodIssueCode.custom,
          message: "Informe o código de administrador",
        });
      } else if (code !== ADMIN_CODE) {
        ctx.addIssue({
          path: ["adminCode"],
          code: z.ZodIssueCode.custom,
          message: "Código de administrador inválido",
        });
      }
    }
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { username, password, fullName, email, profileType } = parsed.data;
  const role = profileType === "admin" ? "admin" : "user";

  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash, fullName, email, role },
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json(
      { id: user.id, username: user.username, role: user.role },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target
        : typeof target === "string"
          ? [target]
          : [];
      const message = fields.includes("email")
        ? "E-mail já cadastrado"
        : "Usuário já cadastrado";

      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("Falha ao cadastrar usuário", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
