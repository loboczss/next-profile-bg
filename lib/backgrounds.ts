import type { BackgroundImage } from "@prisma/client";

import { prisma } from "./prisma";

export type ActiveBackgroundSelection = {
  backgroundUrl: string | null;
  mode: "ALL" | "GROUP" | "SINGLE";
  group: string | null;
  imageId: number | null;
  selectedBackgrounds: BackgroundImage[];
};

const defaultSelection: ActiveBackgroundSelection = {
  backgroundUrl: null,
  mode: "ALL",
  group: null,
  imageId: null,
  selectedBackgrounds: [],
};

export async function getActiveBackgroundSelection(
  options: { cleanup?: boolean } = {},
): Promise<ActiveBackgroundSelection> {
  if (!prisma) {
    return defaultSelection;
  }

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

    const fallbackUrl = settings?.backgroundUrl?.trim() || null;
    let mode = settings?.backgroundMode ?? "ALL";
    let group = settings?.backgroundGroup ?? null;
    let imageId = settings?.backgroundImageId ?? null;

    let selected: BackgroundImage[] = [];
    let needsReset = false;

    if (mode === "SINGLE" && imageId) {
      const image = await prisma.backgroundImage.findUnique({
        where: { id: imageId },
      });

      if (image?.isVisible) {
        selected = [image];
      } else {
        needsReset = true;
      }
    } else if (mode === "GROUP") {
      if (!group) {
        needsReset = true;
      } else {
        selected = await prisma.backgroundImage.findMany({
          where: { isVisible: true, groupKey: group },
          orderBy: { createdAt: "desc" },
        });

        if (!selected.length) {
          needsReset = true;
        }
      }
    }

    if (mode === "ALL" || (needsReset && selected.length === 0)) {
      selected = await prisma.backgroundImage.findMany({
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (needsReset && options.cleanup !== false) {
      try {
        await prisma.globalSetting.update({
          where: { id: 1 },
          data: {
            backgroundMode: "ALL",
            backgroundGroup: null,
            backgroundImageId: null,
          },
        });

        mode = "ALL";
        group = null;
        imageId = null;
      } catch (error) {
        console.error("Erro ao limpar configuração de background inválida", error);
      }
    }

    return {
      backgroundUrl: fallbackUrl,
      mode,
      group,
      imageId,
      selectedBackgrounds: selected,
    };
  } catch (error) {
    console.error("Erro ao obter background ativo", error);
    return defaultSelection;
  }
}
