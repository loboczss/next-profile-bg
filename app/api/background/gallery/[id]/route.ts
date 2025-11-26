import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  url: z
    .string()
    .url("Informe uma URL válida")
    .refine((value) => value.startsWith("https://"), "Use uma URL com HTTPS")
    .optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe um título")
    .max(120, "O título deve ter até 120 caracteres")
    .nullable()
    .optional(),
  groupKey: z
    .string()
    .trim()
    .min(1, "Informe um grupo")
    .max(80, "O grupo deve ter até 80 caracteres")
    .nullable()
    .optional(),
  isVisible: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const idParam = pathname.split("/").filter(Boolean).at(-1);
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const exists = await prisma.backgroundImage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    const data = parsed.data;

    const updated = await prisma.backgroundImage.update({
      where: { id },
      data: {
        url: data.url,
        title: data.title === undefined ? undefined : data.title,
        groupKey: data.groupKey === undefined ? undefined : data.groupKey,
        isVisible: data.isVisible,
      },
    });

    if (data.isVisible === false) {
      await prisma.globalSetting.updateMany({
        where: {
          OR: [{ backgroundImageId: id }, { backgroundUrl: updated.url }],
        },
        data: {
          backgroundImageId: null,
          backgroundMode: "ALL",
          backgroundGroup: null,
          backgroundUrl: null,
        },
      });
    }

    return NextResponse.json({ image: updated });
  } catch (error) {
    console.error("Erro ao atualizar imagem de background", error);
    return NextResponse.json({ error: "Erro ao atualizar imagem" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const idParam = pathname.split("/").filter(Boolean).at(-1);
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const deleted = await prisma.backgroundImage.delete({
      where: { id },
    });

    await prisma.globalSetting.updateMany({
      where: { OR: [{ backgroundImageId: id }, { backgroundUrl: deleted.url }] },
      data: {
        backgroundImageId: null,
        backgroundMode: "ALL",
        backgroundGroup: null,
        backgroundUrl: null,
      },
    });

    return NextResponse.json({ image: deleted });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2025") {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    console.error("Erro ao excluir imagem de background", error);
    return NextResponse.json({ error: "Erro ao excluir imagem" }, { status: 500 });
  }
}
