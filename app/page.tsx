import Link from "next/link";
import Hero from "components/hero";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import { PixTestButton } from "@/components/payments/pix-test-button";
import { auth } from "@/lib/auth";
import { getActiveBackgroundSelection } from "@/lib/backgrounds";
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

  const backgroundSelection = await getActiveBackgroundSelection();

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

  // 3) Slides do hero (iguais para todas as páginas)
  const heroImages: string[] = backgroundSelection.selectedBackgrounds
    .map((item) => item.url)
    .filter((url) => typeof url === "string" && url.trim().length > 0);

  if (!heroImages.length && backgroundSelection.backgroundUrl) {
    heroImages.push(backgroundSelection.backgroundUrl);
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

      <footer className="border-t border-[color:var(--brand-secondary-soft)] bg-white/90 py-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 text-center sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-primary)]">
            <Sparkles className="size-4" /> Pix Banco Cora
          </span>
          <div className="space-y-3">
            <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
              Faça um Pix de teste de R$ 5,00 diretamente pela nossa integração com o Banco Cora
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Use o botão abaixo para gerar um pagamento simbólico e validar a chave Pix configurada no seu ambiente.
            </p>
          </div>
          <PixTestButton initialCount={pixTestSuccessCount} />
          <p className="text-xs text-muted-foreground">
            Certifique-se de manter a variável <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-600">CORA_PIX_API_KEY</code> preenchida para que o gateway possa autorizar os testes.
          </p>
        </div>
      </footer>
    </main>
  );
}
