import Link from "next/link";
import Hero from "components/hero";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { auth } from "@/lib/auth";
import {
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { prisma } from "@/lib/prisma";
import { MapPin, Hotel, Wand2, Headphones, Sparkles } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // 1) Background "global" (opcional)
  let backgroundUrl: string | null = null;
  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: { backgroundUrl: true },
    });
    backgroundUrl = settings?.backgroundUrl ?? null;
  } catch {
    backgroundUrl = null;
  }

  // 2) Destinos
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

  // 3) Monta lista de slides do hero: background global + imagens dos destinos
  const heroImages: string[] = [];
  if (backgroundUrl) heroImages.push(backgroundUrl);

  for (const destination of destinations) {
    const destinationRecord = destination as Record<string, unknown>;

    const coverUrl = destinationRecord.coverUrl;
    if (typeof coverUrl === "string" && coverUrl.trim()) {
      heroImages.push(coverUrl);
      continue;
    }

    const imageUrl = destinationRecord.imageUrl;
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      heroImages.push(imageUrl);
      continue;
    }

    const firstPhoto = destination.photos.find((photo) => photo.trim());
    if (typeof firstPhoto === "string" && firstPhoto.trim()) {
      heroImages.push(firstPhoto);
    }
  }

  // Fallback com links da internet (Unsplash)
  if (!heroImages.length) {
    heroImages.push(
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1920&auto=format&fit=crop",
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* HERO premium com carrossel (componente em ./components/hero) */}
      <Hero images={heroImages} userName={session?.user?.name ?? null} />

      {/* Seção de destinos com “look” premium */}
      <section
        id="destinos"
        className="relative mx-auto -mt-14 w-full max-w-7xl px-6 pb-16"
      >
        <div className="rounded-3xl border border-white/10 bg-white/60 p-6 shadow-xl backdrop-blur-md dark:bg-white/[0.04] md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" />
                Seleção Evastur
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Destinos que contam histórias
              </h2>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground md:text-base">
                Curadoria fina, charme local e experiências que você só descobre
                com quem entende do assunto.
              </p>
            </div>

            <Link
              href="/destinos"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/20"
            >
              <MapPin className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Ver todos os destinos
            </Link>
          </div>

          <div className="mt-6 md:mt-8">
            <DestinationGrid destinations={destinations} />
          </div>
        </div>
      </section>

      {/* Seção “confiança/selos” com ícones (todos locais → substituídos por ícones Lucide) */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/60 p-6 backdrop-blur md:grid-cols-3 md:p-8 dark:bg-white/[0.04]">
          {[
            {
              title: "Hospedagens selecionadas",
              desc: "Parcerias com hotéis e villas de alto padrão.",
              Icon: Hotel,
            },
            {
              title: "Experiências exclusivas",
              desc: "Roteiros imersivos com toque local.",
              Icon: Wand2,
            },
            {
              title: "Suporte 24/7",
              desc: "Antes, durante e depois da viagem.",
              Icon: Headphones,
            },
          ].map(({ title, desc, Icon }, i) => (
            <div
              key={i}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
              <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/60 dark:bg-white/[0.06]">
                <Icon className="size-6 opacity-80 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
