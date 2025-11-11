import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Sparkles,
  Globe,
  Star,
  Luggage,
  TrendingUp,
  Waves,
  Mountain,
  Palmtree,
  Building,
  Camera,
  Ship,
  Shield,
  Clock,
  Heart,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

import { Prisma } from "@prisma/client";

import { DestinationGrid } from "@/components/destinations/destination-grid";
import {
  type DestinationDeleteState,
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function deleteDestination(
  _prevState: DestinationDeleteState,
  formData: FormData
): Promise<DestinationDeleteState> {
  "use server";

  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para excluir um destino.",
    };
  }

  const destinationIdRaw = formData.get("destinationId");
  const destinationId = Number(destinationIdRaw);

  if (!destinationIdRaw || Number.isNaN(destinationId) || !Number.isInteger(destinationId)) {
    return {
      status: "error",
      message: "Destino inválido.",
    };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Banco de dados indisponível no momento. Tente novamente mais tarde.",
    };
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, userId: true },
    });

    if (!destination) {
      return {
        status: "error",
        message: "Destino não encontrado.",
      };
    }

    if (destination.userId !== Number(user.id) && user.role !== "admin") {
      return {
        status: "error",
        message: "Você não tem permissão para excluir este destino.",
      };
    }

    await prisma.destination.delete({
      where: { id: destinationId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.warn(
        "Não foi possível conectar ao banco de dados para excluir o destino.",
        error.message
      );
      return {
        status: "error",
        message:
          "Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.",
      };
    }

    console.error("Erro ao excluir destino", error);
    return {
      status: "error",
      message: "Não foi possível excluir o destino. Tente novamente mais tarde.",
    };
  }

  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino excluído com sucesso!",
  };
}

export default async function DestinationsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const prismaClient = prisma;

  let destinations: SerializedDestination[] = [];
  let destinationsError = false;
  const favoriteDestinationIds = new Set<number>();

  if (prismaClient && session?.user?.id) {
    try {
      const favorites = await prismaClient.favorite.findMany({
        where: { userId: Number(session.user.id) },
        select: { destinationId: true },
      });
      favorites.forEach((favorite) => favoriteDestinationIds.add(favorite.destinationId));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        console.warn(
          "Não foi possível conectar ao banco de dados para carregar os favoritos. Eles serão exibidos vazios.",
          error.message
        );
      } else {
        console.error("Erro ao buscar favoritos do usuário", error);
      }
    }
  } else if (!prismaClient) {
    console.error("Prisma Client não está disponível. Lista de favoritos carregada vazia.");
  }

  if (prismaClient) {
    try {
      const destinationsFromDb = await prismaClient.destination.findMany({
        orderBy: { createdAt: "desc" },
      });
      destinations = destinationsFromDb.map((destination) => ({
        ...serializeDestination(destination),
        isFavorite: favoriteDestinationIds.has(destination.id),
      }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        console.warn(
          "Não foi possível conectar ao banco de dados para carregar os destinos. Exibindo a página sem dados dinâmicos.",
          error.message
        );
      } else {
        console.error("Erro ao buscar destinos", error);
      }
      destinationsError = true;
    }
  } else {
    destinationsError = true;
    console.error(
      "Prisma Client não está disponível. Exibindo página de destinos sem dados do banco de dados.",
    );
  }

  const destinationCount = destinations.length;
  const bestRatedDestination = destinations.reduce<SerializedDestination | null>(
    (best, current) => {
      if (!best || current.rating > best.rating) {
        return current;
      }
      return best;
    },
    null
  );
  const budgetDestination = destinations.reduce<SerializedDestination | null>(
    (best, current) => {
      if (!best || current.price < best.price) {
        return current;
      }
      return best;
    },
    null
  );
  const newestDestination = destinations[0] ?? null;

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

  const bestRatingLabel = bestRatedDestination
    ? bestRatedDestination.rating.toFixed(1)
    : "—";
  const budgetPriceLabel = budgetDestination
    ? currencyFormatter.format(budgetDestination.price)
    : "—";
  const newestCityLabel = newestDestination
    ? newestDestination.city
    : "Cadastre um novo destino e inspire os viajantes";

  const heroImage =
    newestDestination?.photos.find((photo) => photo.trim()) ??
    bestRatedDestination?.photos.find((photo) => photo.trim()) ??
    null;

  const heroHighlights = [
    {
      icon: Globe,
      label: "Experiências na vitrine",
      value:
        destinationCount > 0
          ? `${destinationCount}${destinationCount > 9 ? "+" : ""}`
          : "Em breve",
      description:
        destinationCount > 0
          ? "Coleção atualizada pela equipe Evastur"
          : "Adicione um novo destino no dashboard",
    },
    {
      icon: Star,
      label: "Melhor avaliação",
      value: bestRatingLabel,
      description: bestRatedDestination
        ? `${bestRatedDestination.city}, ${bestRatedDestination.name}`
        : "Estamos em busca do próximo favorito",
    },
    {
      icon: Luggage,
      label: "Oferta inteligente",
      value: budgetPriceLabel,
      description: budgetDestination
        ? `por pessoa em ${budgetDestination.city}`
        : "Novos pacotes serão publicados em breve",
    },
  ];

  const collectionHighlights = [
    {
      icon: Waves,
      title: "Refúgios à beira-mar",
      description:
        "Praias cinematográficas e resorts com experiências à flor do mar, perfeitos para desconectar.",
      tone: "from-sky-100 via-blue-100 to-cyan-100 text-sky-700",
    },
    {
      icon: Mountain,
      title: "Natureza exuberante",
      description:
        "Montanhas, trilhas e retiros de bem-estar em meio à vegetação nativa para renovar as energias.",
      tone: "from-emerald-100 via-lime-100 to-green-100 text-emerald-700",
    },
    {
      icon: Building,
      title: "Experiências urbanas",
      description:
        "Cidades icônicas, rooftops exclusivos e programas culturais para mergulhar na vida local.",
      tone: "from-violet-100 via-indigo-100 to-purple-100 text-indigo-700",
    },
    {
      icon: Palmtree,
      title: "Escapadas tropicais",
      description:
        "Vilas privativas, ilhas secretas e serviços sob medida para quem busca clima quente o ano todo.",
      tone: "from-amber-100 via-orange-100 to-yellow-100 text-amber-700",
    },
  ];

  const serviceHighlights = [
    {
      icon: Ship,
      title: "Cruzeiros assinados",
      description:
        "Roteiros sofisticados pelo Caribe, Mediterrâneo e Brasil com concierge dedicado.",
    },
    {
      icon: Shield,
      title: "Curadoria confiável",
      description:
        "Parcerias com hospedagens premium, guias locais e experiências imersivas selecionadas a dedo.",
    },
    {
      icon: Heart,
      title: "Detalhes personalizados",
      description:
        "Cada viagem nasce do seu estilo: celebrações, honeymoon, família ou aventuras solo.",
    },
    {
      icon: Clock,
      title: "Assistência contínua",
      description:
        "Equipe monitorando sua jornada antes, durante e depois da viagem com canais 24/7.",
    },
  ];

  const contactChannels = [
    {
      icon: Phone,
      label: "WhatsApp",
      description: "Converse com um especialista em tempo real",
    },
    {
      icon: Mail,
      label: "E-mail",
      description: "Receba um roteiro exclusivo diretamente na sua caixa de entrada",
    },
    {
      icon: MessageCircle,
      label: "Consultoria",
      description: "Agende uma chamada para cocriaremos a próxima experiência",
    },
  ];

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-muted/40">
        <div className="absolute inset-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt="Paisagem de destino em destaque"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-sky-100 via-white to-teal-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
          <div className="pointer-events-none absolute -left-20 top-16 hidden h-64 w-64 rounded-full bg-primary/20 blur-3xl sm:block" />
          <div className="pointer-events-none absolute -right-24 bottom-0 hidden h-72 w-72 rounded-full bg-sky-200/60 blur-3xl md:block" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-24 sm:px-8 lg:flex-row lg:items-end lg:px-12">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              <Sparkles className="size-4" /> Curadoria Evastur
            </span>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                Destinos para viver histórias tão grandiosas quanto a sua
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Explore coleções selecionadas pela nossa equipe para diferentes estilos de viagem. Cada experiência foi pensada para entregar conforto, autenticidade e memórias inesquecíveis.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/favoritos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                <Heart className="size-4" /> Meus favoritos
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                <MessageCircle className="size-4" /> Falar com especialista
              </Link>
            </div>
          </div>

          <dl className="grid flex-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {heroHighlights.map(({ icon: Icon, label, value, description }) => (
              <div
                key={label}
                className="group rounded-3xl border border-border/80 bg-background/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    {label}
                  </span>
                  <Icon className="size-5 text-primary transition group-hover:scale-110" />
                </div>
                <dd className="mt-4 text-3xl font-semibold text-foreground">{value}</dd>
                <dt className="mt-1 text-sm text-muted-foreground">{description}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <TrendingUp className="size-4" /> Coleções em alta
              </span>
              <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                Escolha o ritmo da sua próxima viagem
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Descubra os cenários que combinam com o seu momento: da energia das grandes metrópoles ao silêncio inspirador das montanhas.
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Atualização mais recente: {newestCityLabel}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {collectionHighlights.map(({ icon: Icon, title, description, tone }) => (
              <article
                key={title}
                className={`group flex h-full flex-col gap-4 rounded-3xl border border-border bg-gradient-to-br ${tone} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-background/70 text-primary shadow">
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-4" /> Seleção cinematográfica
              </span>
              <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                Destinos que brilham na vitrine Evastur
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Clique para explorar fotos em alta resolução, valores atualizados e detalhes das experiências.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              <Camera className="size-4" /> Gerenciar destinos
            </Link>
          </div>

          <div className="mt-10">
            {destinationsError ? (
              <div className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm sm:flex-row sm:items-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Estamos atualizando a coleção</h3>
                  <p className="text-sm text-amber-800">
                    Tente novamente em alguns instantes ou fale com nossa equipe para receber recomendações personalizadas.
                  </p>
                </div>
              </div>
            ) : (
              <DestinationGrid
                destinations={destinations}
                canFavorite={Boolean(session?.user?.id)}
                onDelete={isAdmin ? deleteDestination : undefined}
              />
            )}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                <Sparkles className="size-4" /> Experiência completa
              </span>
              <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                Mais do que destinos, criamos jornadas sob medida
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Combinamos hospedagens de alto padrão, serviços exclusivos e parceiros confiáveis para garantir que cada etapa da sua viagem aconteça com tranquilidade.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {serviceHighlights.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group flex h-full flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center gap-10 text-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <Sparkles className="size-4" /> Pronto para embarcar?
              </span>
              <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                Conte com nossa equipe para transformar ideias em roteiros personalizados
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Compartilhe seu estilo de viagem e receberá propostas exclusivas com fotografias, valores e diferenciais pensados para você.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              {contactChannels.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex h-full flex-col items-center gap-3 rounded-3xl border border-border bg-background p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <form className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Digite seu melhor e-mail"
                className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Quero receber novidades
                <ChevronRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
