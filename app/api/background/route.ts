import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { storeBackgroundImage } from "@/lib/storage";
import { assertImage, sanitizeExt } from "@/lib/file";

const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) {
    return cloudflareIp;
  }
  return "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return true;
}

const urlSchema = z.object({
  url: z
    .string()
    .url("Informe uma URL válida")
    .refine((value) => value.startsWith("https://"), "Use uma URL com HTTPS"),
});

export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let backgroundUrl: string;

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      const parsed = urlSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
        return NextResponse.json({ error: message }, { status: 400 });
      }
      backgroundUrl = parsed.data.url;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      backgroundUrl = await storeBackgroundImage(ext, buffer);
    } else {
      return NextResponse.json({ error: "Tipo de conteúdo não suportado" }, { status: 400 });
    }

    await prisma.globalSetting.upsert({
      where: { id: 1 },
      update: { backgroundUrl },
      create: { id: 1, backgroundUrl },
    });

    revalidatePath("/");
    return NextResponse.json({ backgroundUrl });
  } catch (error) {
    console.error("Erro ao atualizar background", error);
    return NextResponse.json({ error: "Erro ao atualizar background" }, { status: 500 });
  }
}
