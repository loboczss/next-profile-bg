import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  url: z
    .string()
    .url("Informe uma URL válida")
    .refine((value) => value.startsWith("https://"), "Use uma URL com HTTPS"),
  title: z
    .string()
    .trim()
    .min(1, "Informe um título")
    .max(120, "O título deve ter até 120 caracteres")
    .optional(),
  groupKey: z
    .string()
    .trim()
    .min(1, "Informe um grupo")
    .max(80, "O grupo deve ter até 80 caracteres")
    .optional(),
});

export async function GET() {
  try {
    const images = await prisma.backgroundImage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Erro ao listar backgrounds", error);
    return NextResponse.json({ error: "Erro ao listar backgrounds" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const created = await prisma.backgroundImage.create({
      data: {
        url: parsed.data.url,
        title: parsed.data.title,
        groupKey: parsed.data.groupKey,
      },
    });

    return NextResponse.json({ image: created }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar imagem de background", error);
    return NextResponse.json({ error: "Erro ao criar imagem" }, { status: 500 });
  }
}
