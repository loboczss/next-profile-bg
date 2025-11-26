import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { assertImage, sanitizeExt } from "@/lib/file";
import { DropboxUploadError, storeBackgroundImage } from "@/lib/storage";

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
  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

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
  const contentType = request.headers.get("content-type") ?? "";
  const createWithUrl = async () => {
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
      return { error: message } as const;
    }

    return {
      url: parsed.data.url,
      title: parsed.data.title,
      groupKey: parsed.data.groupKey,
    };
  };

  const createWithFile = async () => {
    if (!contentType.includes("multipart/form-data")) {
      return null;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { error: "Arquivo não enviado" } as const;
    }

    try {
      assertImage(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arquivo inválido";
      return { error: message } as const;
    }

    const ext = sanitizeExt(file.type);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const backgroundUrl = await storeBackgroundImage(ext, buffer);
    const rawTitle = formData.get("title");
    const rawGroup = formData.get("groupKey");

    const title = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle.trim() : undefined;
    const groupKey = typeof rawGroup === "string" && rawGroup.trim().length ? rawGroup.trim() : undefined;

    return { url: backgroundUrl, title, groupKey };
  };

  const payload = contentType.includes("application/json")
    ? await createWithUrl()
    : await createWithFile();

  if (!payload || "error" in payload) {
    const message = payload?.error ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const created = await prisma.backgroundImage.create({
      data: {
        url: payload.url,
        title: payload.title,
        groupKey: payload.groupKey,
      },
    });

    revalidatePath("/");
    revalidatePath("/sobre-nos");

    return NextResponse.json({ image: created }, { status: 201 });
  } catch (error) {
    if (error instanceof DropboxUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    console.error("Erro ao criar imagem de background", error);
    return NextResponse.json({ error: "Erro ao criar imagem" }, { status: 500 });
  }
}
