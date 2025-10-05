import Link from "next/link";
import Hero from "components/hero";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { auth } from "@/lib/auth";
import {
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { prisma } from "@/lib/prisma";
import { MapPin, Hotel, Wand2, Headphones, Sparkles, ArrowRight, Star } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // 1) Background "global" (igual, sem mexer no backend)
  let backgroundUrl: string | null = null;
  let backgroundMode: "ALL" | "GROUP" | "SINGLE" = "ALL";
  let backgroundGroup: string | null = null;
  let backgroundImageId: number | null = null;
  try {
    const settings = await prisma.globalSetting.findUnique({
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

  // 2) Destinos (igual, sem mexer no backend)
  let destinations: SerializedDestination[] = [];
  try {
    const destinationsFromDb = await prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    destinations = destinationsFromDb.map(serializeDestination);
  } catch {
    destinations = [];
  }

  // 3) Slides do hero (igual, só organizei a leitura)
  const heroImages: string[] = [];

  try {
    if (backgroundMode === "SINGLE" && backgroundImageId) {
      const image = await prisma.backgroundImage.findUnique({
        where: { id: backgroundImageId },
        select: { url: true, isVisible: true },
      });

      if (image?.isVisible && image.url) {
        heroImages.push(image.url);
      } else if (backgroundUrl) {
        heroImages.push(backgroundUrl);
      }
    } else if (backgroundMode === "GROUP" && backgroundGroup) {
      const images = await prisma.backgroundImage.findMany({
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
      const images = await prisma.backgroundImage.findMany({
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

  if (!heroImages.length && backgroundUrl) {
    heroImages.push(backgroundUrl);
  }

  for (const destination of destinations) {
    const rec = destination as Record<string, unknown>;
    const coverUrl = rec.coverUrl;
    if (typeof coverUrl === "string" && coverUrl.trim()) {
      heroImages.push(coverUrl);
      continue;
    }
    const imageUrl = rec.imageUrl;
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      heroImages.push(imageUrl);
      continue;
    }
    const firstPhoto = destination.photos.find((p) => p.trim());
    if (typeof firstPhoto === "string" && firstPhoto.trim()) {
      heroImages.push(firstPhoto);
    }
  }

  if (!heroImages.length) {
    // Fallback (inalterado conceitualmente)
    heroImages.push(
      
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1920&auto=format&fit=crop",
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* HERO premium com carrossel (sem alterar props) */}
      <Hero images={heroImages} userName={session?.user?.name ?? null} />

      {/* Seção de destinos com estética alinhada à página /destinos */}
      <section
        id="destinos"
        className="relative mx-auto -mt-12 w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-9 md:-mt-14 lg:px-8"
      >
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/70 to-white/50 p-5 shadow-2xl shadow-black/5 backdrop-blur-xl transition-all duration-500 hover:shadow-3xl dark:from-white/[0.06] dark:to-white/[0.03] sm:p-6 md:p-8 lg:p-10">
          {/* Glow suave no hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          </div>

          <div className="relative">
            {/* Header da seção */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:gap-6">
              <div className="flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/15 to-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:text-sm">
                  <Sparkles className="size-3.5 animate-pulse sm:size-4" />
                  <span>Seleção Evastur</span>
                  <Star className="size-3 fill-primary text-primary sm:size-3.5" />
                </div>

                <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                  Destinos que contam
                  <span className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                    histórias
                  </span>
                </h2>

                <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base md:mt-3 md:leading-relaxed lg:text-lg">
                  Curadoria fina, charme local e experiências que você só descobre
                  com quem entende do assunto.
                </p>
              </div>

              <Link
                href="/destinos"
                className="group/btn relative inline-flex items-center gap-2.5 self-start overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-white/20 to-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:from-primary/20 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/25 sm:px-6 sm:py-3 sm:text-base"
                aria-label="Ver todos os destinos"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                <MapPin className="size-4 transition-all duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:text-primary sm:size-5" />
                <span>Ver todos</span>
                <ArrowRight className="size-4 transition-all duration-300 group-hover/btn:translate-x-1 sm:size-5" />
              </Link>
            </div>

            {/* Grid de destinos (sem mudar a API/props) */}
            <div className="mt-6 sm:mt-8 md:mt-10">
              <DestinationGrid destinations={destinations} />
            </div>
          </div>
        </div>
      </section>

      {/* Features/benefícios com visual coeso (só UI) */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/70 to-white/50 p-5 backdrop-blur-xl dark:from-white/[0.06] dark:to-white/[0.03] sm:p-6 md:p-8 lg:p-10">
          {/* Decoração de fundo */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute right-0 top-0 size-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 size-64 rounded-full bg-purple-500/10 blur-3xl" />
          </div>

          <div className="relative grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
            {[
              {
                title: "Hospedagens selecionadas",
                desc: "Parcerias com hotéis e villas de alto padrão.",
                Icon: Hotel,
                color: "from-blue-500/20 to-blue-600/10 text-blue-500 dark:text-blue-400",
              },
              {
                title: "Experiências exclusivas",
                desc: "Roteiros imersivos com toque local.",
                Icon: Wand2,
                color: "from-purple-500/20 to-purple-600/10 text-purple-500 dark:text-purple-400",
              },
              {
                title: "Suporte 24/7",
                desc: "Antes, durante e depois da viagem.",
                Icon: Headphones,
                color: "from-emerald-500/20 to-emerald-600/10 text-emerald-500 dark:text-emerald-400",
              },
            ].map(({ title, desc, Icon, color }, i) => (
              <div
                key={i}
                className="group/card relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/60 to-white/40 p-5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-2xl dark:from-white/[0.05] dark:to-white/[0.02] sm:p-6"
              >
                {/* Glow no hover (herda cores do item) */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100">
                  <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
                </div>

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className={`relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br shadow-lg transition-all duration-500 group-hover/card:scale-110 group-hover/card:shadow-xl sm:size-16 ${color}`}>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <Icon className="relative z-10 size-7 transition-transform duration-500 group-hover/card:rotate-12 sm:size-8" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold leading-tight sm:text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{desc}</p>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
