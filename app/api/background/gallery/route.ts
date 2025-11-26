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

  if (!prisma) {
    return NextResponse.json(
      { error: "Banco de dados indisponível. Configure o DATABASE_URL." },
      { status: 500 },
    );
  }

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const title = formData.get("title");
      const groupKey = formData.get("groupKey");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
      }

      try {
        assertImage(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Arquivo inválido";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const ext = sanitizeExt(file.type);
      const buffer = Buffer.from(await file.arrayBuffer());
      const storedUrl = await storeBackgroundImage(ext, buffer);

      const created = await prisma.backgroundImage.create({
        data: {
          url: storedUrl,
          title: typeof title === "string" && title.trim().length ? title : undefined,
          groupKey:
            typeof groupKey === "string" && groupKey.trim().length
              ? groupKey
              : undefined,
        },
      });

      return NextResponse.json({ image: created }, { status: 201 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
      return NextResponse.json({ error: message }, { status: 400 });
    }

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

    if (error instanceof DropboxUploadError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Erro ao criar imagem" }, { status: 500 });
  }
}
