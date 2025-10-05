import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DropboxUploadError, storeBackgroundImage } from "@/lib/storage";
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

const modeSchema = z.object({
  mode: z.enum(["ALL", "GROUP", "SINGLE"]).optional(),
  imageId: z
    .number({ coerce: true })
    .int("Selecione uma imagem válida")
    .positive("Selecione uma imagem válida")
    .nullable()
    .optional(),
  group: z
    .string()
    .trim()
    .min(1, "Informe um grupo")
    .max(80, "O grupo deve ter até 80 caracteres")
    .nullable()
    .optional(),
});

type BackgroundMode = "ALL" | "GROUP" | "SINGLE";

async function resolveSelectedBackgrounds({
  backgroundMode,
  backgroundGroup,
  backgroundImageId,
}: {
  backgroundMode: BackgroundMode;
  backgroundGroup: string | null;
  backgroundImageId: number | null;
}) {
  if (backgroundMode === "SINGLE" && backgroundImageId) {
    const image = await prisma.backgroundImage.findUnique({
      where: { id: backgroundImageId },
    });
    return image ? [image] : [];
  }

  if (backgroundMode === "GROUP") {
    if (!backgroundGroup) {
      return [];
    }

    return prisma.backgroundImage.findMany({
      where: {
        isVisible: true,
        groupKey: backgroundGroup,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.backgroundImage.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function GET() {
  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: {
        backgroundUrl: true,
        backgroundMode: true,
        backgroundGroup: true,
        backgroundImageId: true,
      },
    });

    const mode = settings?.backgroundMode ?? "ALL";
    const selectedBackgrounds = await resolveSelectedBackgrounds({
      backgroundMode: mode,
      backgroundGroup: settings?.backgroundGroup ?? null,
      backgroundImageId: settings?.backgroundImageId ?? null,
    });

    return NextResponse.json({
      backgroundUrl: settings?.backgroundUrl ?? null,
      mode,
      group: settings?.backgroundGroup ?? null,
      imageId: settings?.backgroundImageId ?? null,
      selectedBackgrounds,
    });
  } catch (error) {
    console.error("Erro ao obter background", error);
    return NextResponse.json(
      { error: "Erro ao obter background" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let backgroundUrl: string;
  let title: string | undefined;
  let groupKey: string | undefined;

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      const parsed = urlSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
        return NextResponse.json({ error: message }, { status: 400 });
      }
      backgroundUrl = parsed.data.url;
      title = parsed.data.title;
      groupKey = parsed.data.groupKey;
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

    const background = await prisma.backgroundImage.create({
      data: {
        url: backgroundUrl,
        title,
        groupKey,
      },
    });

    await prisma.globalSetting.upsert({
      where: { id: 1 },
      update: { backgroundUrl, backgroundImageId: background.id },
      create: { id: 1, backgroundUrl, backgroundImageId: background.id },
    });

    revalidatePath("/");
    revalidatePath("/sobre-nos");
    return NextResponse.json({ backgroundUrl });
  } catch (error) {
    console.error("Erro ao atualizar background", error);

    if (error instanceof DropboxUploadError) {
      return NextResponse.json(
        {
          error: error.message,
          errorDetails: {
            message: error.message,
            stack: error.stack,
            stage: error.stage,
            dropboxPath: error.dropboxPath,
            causeMessage: error.causeMessage,
            causeStack: error.causeStack,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Erro ao atualizar background" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = modeSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { mode, imageId, group } = parsed.data;

  try {
    if (!mode && group === undefined && imageId === undefined) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    let modeToSet: BackgroundMode | undefined;
    let groupToSet: string | null | undefined;
    let connectImageId: number | null | undefined;

    if (mode === "SINGLE") {
      if (!imageId) {
        return NextResponse.json(
          { error: "Selecione uma imagem para exibir individualmente" },
          { status: 400 },
        );
      }

      const image = await prisma.backgroundImage.findUnique({
        where: { id: imageId },
        select: { id: true },
      });

      if (!image) {
        return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
      }

      modeToSet = "SINGLE";
      groupToSet = null;
      connectImageId = image.id;
    } else if (mode === "GROUP") {
      if (!group) {
        return NextResponse.json({ error: "Informe o grupo que deseja exibir" }, { status: 400 });
      }

      modeToSet = "GROUP";
      groupToSet = group;
      connectImageId = null;
    } else if (mode === "ALL") {
      modeToSet = "ALL";
      groupToSet = null;
      connectImageId = null;
    } else {
      if (typeof imageId === "number") {
        const image = await prisma.backgroundImage.findUnique({
          where: { id: imageId },
          select: { id: true },
        });
        if (!image) {
          return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
        }
        connectImageId = image.id;
      } else if (imageId === null) {
        connectImageId = null;
      }

      if (group !== undefined) {
        groupToSet = group ?? null;
      }
    }

    if (mode && modeToSet === undefined) {
      modeToSet = mode;
    }

    const updateData: Prisma.GlobalSettingUpdateInput = {};

    if (modeToSet !== undefined) {
      updateData.backgroundMode = modeToSet;
    }

    if (groupToSet !== undefined) {
      updateData.backgroundGroup = groupToSet;
    }

    if (connectImageId !== undefined) {
      updateData.backgroundImage =
        connectImageId === null
          ? { disconnect: true }
          : { connect: { id: connectImageId } };
    }

    const existing = await prisma.globalSetting.findUnique({ where: { id: 1 } });

    if (existing) {
      await prisma.globalSetting.update({
        where: { id: 1 },
        data: updateData,
      });
    } else {
      const createData: Prisma.GlobalSettingCreateInput = {
        id: 1,
        backgroundMode: modeToSet ?? mode ?? "ALL",
        backgroundGroup: groupToSet ?? null,
      };

      if (typeof connectImageId === "number") {
        createData.backgroundImage = { connect: { id: connectImageId } };
      }

      await prisma.globalSetting.create({ data: createData });
    }

    revalidatePath("/");
    revalidatePath("/sobre-nos");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar modo do background", error);
    return NextResponse.json({ error: "Erro ao atualizar modo" }, { status: 500 });
  }
}
