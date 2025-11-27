import Link from "next/link";
import Hero from "components/hero";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { PixTestButton } from "@/components/payments/pix-test-button";
import { auth } from "@/lib/auth";
import {
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { prisma } from "@/lib/prisma";
import { Hotel, Wand2, Headphones, Sparkles, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const prismaClient = prisma;

  if (!prismaClient) {
    console.error(
      "Prisma Client não está disponível. Exibindo conteúdo padrão sem dados do banco de dados.",
    );
  }

  // 1) Background "global" (igual, sem mexer no backend)
  let backgroundUrl: string | null = null;
  let backgroundMode: "ALL" | "GROUP" | "SINGLE" = "ALL";
  let backgroundGroup: string | null = null;
  let backgroundImageId: number | null = null;
  if (prismaClient) {
    try {
      const settings = await prismaClient.globalSetting.findUnique({
        where: { id: 1 },
        select: {
          backgroundUrl: true,
          backgroundMode: true,
          backgroundGroup: true,
          backgroundImageId: true,
          backgroundImage: { select: { url: true, isVisible: true } },
        },
      });
      backgroundUrl = settings?.backgroundUrl ?? null;
      backgroundMode = settings?.backgroundMode ?? "ALL";
      backgroundGroup = settings?.backgroundGroup ?? null;
      backgroundImageId = settings?.backgroundImageId ?? null;

      if (
        backgroundMode === "SINGLE" &&
        settings?.backgroundImage &&
        settings.backgroundImage.isVisible
      ) {
        backgroundUrl = settings.backgroundImage.url;
      }
    } catch {
      backgroundUrl = null;
    }
  }

  // 2) Destinos (igual, sem mexer no backend)
  let destinations: SerializedDestination[] = [];
  const favoriteDestinationIds = new Set<number>();

  if (prismaClient && session?.user?.id) {
    try {
      const favorites = await prismaClient.favorite.findMany({
        where: { userId: Number(session.user.id) },
        select: { destinationId: true },
      });
      favorites.forEach((favorite) => favoriteDestinationIds.add(favorite.destinationId));
    } catch (error) {
      console.error("Erro ao buscar favoritos do usuário", error);
    }
  }

  if (prismaClient) {
    try {
      const destinationsFromDb = await prismaClient.destination.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      });
      destinations = destinationsFromDb.map((destination) => ({
        ...serializeDestination(destination),
        isFavorite: favoriteDestinationIds.has(destination.id),
      }));
    } catch {
      destinations = [];
    }
  }

  // 3) Slides do hero (igual, só organizei a leitura)
  const heroImages: string[] = [];

  if (prismaClient) {
    try {
      if (backgroundMode === "SINGLE" && backgroundImageId) {
        const image = await prismaClient.backgroundImage.findUnique({
          where: { id: backgroundImageId },
          select: { url: true, isVisible: true },
        });

        if (image?.isVisible && image.url) {
          heroImages.push(image.url);
        } else if (backgroundUrl) {
          heroImages.push(backgroundUrl);
        }
      } else if (backgroundMode === "GROUP" && backgroundGroup) {
        const images = await prismaClient.backgroundImage.findMany({
          where: { isVisible: true, groupKey: backgroundGroup },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (images.length) {
          heroImages.push(...images.map((image) => image.url));
        } else if (backgroundUrl) {
          heroImages.push(backgroundUrl);
        }
      } else {
        const images = await prismaClient.backgroundImage.findMany({
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (images.length) {
          heroImages.push(...images.map((image) => image.url));
        }
      }
    } catch {
      if (backgroundUrl) {
        heroImages.push(backgroundUrl);
      }
    }
  }

  if (!heroImages.length && backgroundUrl) {
    heroImages.push(backgroundUrl);
  }

  if (!heroImages.length) {
    // Fallback (inalterado conceitualmente)
    heroImages.push(
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1920&auto=format&fit=crop",
    );
  }

  const featureCards = [
    {
      title: "Hospedagens selecionadas",
      description: "Parcerias com hotéis e villas de alto padrão.",
      icon: Hotel,
    },
    {
      title: "Experiências exclusivas",
      description: "Roteiros imersivos com toque local.",
      icon: Wand2,
    },
    {
      title: "Suporte 24/7",
      description: "Acompanhamento antes, durante e depois da viagem.",
      icon: Headphones,
    },
  ];

  let pixTestSuccessCount = 0;

  if (prismaClient) {
    try {
      pixTestSuccessCount = await prismaClient.pixTestPayment.count({
        where: { status: "CONCLUIDO" },
      });
    } catch (error) {
      console.error("Erro ao carregar o contador de testes Pix", error);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-white via-[#f6f8ff] to-[#fff3f6] text-foreground">
      <Hero images={heroImages} userName={session?.user?.name ?? null} />

      <section className="bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-primary)]">
                <Sparkles className="size-4" /> Destinos recentes
              </span>
              <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                Descobertas selecionadas para a sua próxima viagem
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Uma curadoria atualizada com os lugares que conquistaram nossos viajantes nas últimas semanas.
              </p>
            </div>

            <Link
              href="/destinos"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[color:var(--brand-secondary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--brand-secondary)] transition hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,transparent)] hover:text-[color:var(--brand-secondary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-secondary)]/40"
              aria-label="Ver todos os destinos"
            >
              Ver todos
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10">
            <DestinationGrid
              destinations={destinations}
              canFavorite={Boolean(session?.user?.id)}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--brand-secondary-soft)] bg-[color-mix(in_srgb,var(--brand-secondary)_6%,white)] py-16">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="flex h-full flex-col gap-3 rounded-2xl border border-[color:var(--brand-secondary-soft)] bg-white/80 p-6 shadow-[0_24px_60px_-30px_rgba(0,27,114,0.45)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-35px_rgba(234,0,42,0.35)]"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand-primary)_15%,white)] text-[color:var(--brand-primary)]">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
