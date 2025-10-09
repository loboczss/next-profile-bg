import { revalidatePath } from "next/cache";
import {
  Plane,
  MapPin,
  Ship,
  Luggage,
  Globe,
  Sparkles,
  TrendingUp,
  Heart,
  Clock,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Waves,
  Mountain,
  Palmtree,
  Building,
  Camera,
  Flame,
  Star,
} from "lucide-react";

import { DestinationGrid } from "@/components/destinations/destination-grid";
import {
  type DestinationDeleteState,
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Ação server-side responsável por remover destinos cadastrados pelo usuário.
async function deleteDestination(
  _prevState: DestinationDeleteState,
  formData: FormData
): Promise<DestinationDeleteState> {
  "use server";

  // Verifica se há um usuário autenticado antes de realizar a exclusão.
  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para excluir um destino.",
    };
  }

  const destinationIdRaw = formData.get("destinationId");
  const destinationId = Number(destinationIdRaw);

  if (!destinationIdRaw || Number.isNaN(destinationId) || !Number.isInteger(destinationId)) {
    // Bloqueia requisições com identificadores inválidos.
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

    if (destination.userId !== Number(session.user.id)) {
      // Impede que um usuário exclua destinos de terceiros.
      return {
        status: "error",
        message: "Você não tem permissão para excluir este destino.",
      };
    }

    await prisma.destination.delete({
      where: { id: destinationId },
    });
  } catch (error) {
    console.error("Erro ao excluir destino", error);
    return {
      status: "error",
      message: "Não foi possível excluir o destino. Tente novamente mais tarde.",
    };
  }

  // Revalida as páginas que exibem o destino removido.
  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino excluído com sucesso!",
  };
}

// Página que lista todos os destinos cadastrados e oferece destaque para cada experiência.
export default async function DestinationsPage() {
  const session = await auth();
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
      console.error("Erro ao buscar favoritos do usuário", error);
    }
  } else if (!prismaClient) {
    console.error("Prisma Client não está disponível. Lista de favoritos carregada vazia.");
  }
  if (prismaClient) {
    try {
      // Busca todos os destinos ordenados por data de criação.
      const destinationsFromDb = await prismaClient.destination.findMany({
        orderBy: { createdAt: "desc" },
      });
      destinations = destinationsFromDb.map((destination) => ({
        ...serializeDestination(destination),
        isFavorite: favoriteDestinationIds.has(destination.id),
      }));
    } catch (error) {
      console.error("Erro ao buscar destinos", error);
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Elementos decorativos animados de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-24 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-200 blur-3xl opacity-30"></div>
        <div className="absolute bottom-40 right-20 h-96 w-96 animate-pulse rounded-full bg-cyan-200 blur-3xl opacity-30 [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/3 h-80 w-80 animate-pulse rounded-full bg-teal-200 blur-3xl opacity-20 [animation-delay:4s]"></div>
      </div>

      {/* Seção principal de destinos destacados */}
      <section id="destinos" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-700 shadow-sm">
              <Sparkles className="h-4 w-4 animate-spin text-blue-500" style={{ animationDuration: "18s" }} />
              <span>Destaques exclusivos</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold text-slate-900 md:text-5xl">
              Conheça os destinos mais inspiradores da Evastur
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
              Explore experiências cuidadosamente selecionadas para diferentes estilos de viagem. Clique em um card para descobrir detalhes, fotos em alta resolução e dicas especiais da nossa equipe.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group flex items-center gap-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/40 text-blue-700">
                <MapPin className="h-7 w-7" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Destinos disponíveis
                </p>
                <p className="text-3xl font-bold text-slate-900">{destinationCount}</p>
                <span className="text-sm text-slate-600">experiências aguardando você</span>
              </div>
            </div>

            <div className="group flex items-center gap-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/30 text-purple-700">
                <Star className="h-7 w-7" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  Mais bem avaliado
                </p>
                <p className="text-3xl font-bold text-slate-900">{bestRatingLabel}</p>
                <span className="text-sm text-slate-600">
                  {bestRatedDestination ? bestRatedDestination.name : "Cadastre um destino para inaugurar"}
                </span>
              </div>
            </div>

            <div className="group flex items-center gap-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/30 text-amber-600">
                <Flame className="h-7 w-7" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Oferta do momento
                </p>
                <p className="text-3xl font-bold text-slate-900">{budgetPriceLabel}</p>
                <span className="text-sm text-slate-600">
                  {budgetDestination ? `no destino ${budgetDestination.name}` : "Novas promoções chegam em breve"}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-slate-600">
            Atualização mais recente: {newestCityLabel}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { icon: Waves, label: "Praias", bg: "from-blue-100/70 to-cyan-100/70", text: "text-blue-600" },
              { icon: Mountain, label: "Montanhas", bg: "from-emerald-100/70 to-lime-100/70", text: "text-emerald-600" },
              { icon: Building, label: "Cidades", bg: "from-purple-100/70 to-indigo-100/70", text: "text-purple-600" },
              { icon: Palmtree, label: "Tropical", bg: "from-orange-100/70 to-amber-100/70", text: "text-amber-600" },
              { icon: Camera, label: "Aventura", bg: "from-rose-100/70 to-pink-100/70", text: "text-rose-600" },
            ].map((category) => (
              <button
                key={category.label}
                className={`group inline-flex items-center gap-2 rounded-full border border-white/50 bg-gradient-to-r ${category.bg} px-6 py-3 text-sm font-semibold text-slate-700 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <category.icon className={`h-5 w-5 ${category.text} transition-transform duration-300 group-hover:scale-110`} />
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[32px] border border-white/30 bg-white/80 p-8 shadow-[0_30px_60px_-30px_rgba(15,118,190,0.45)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/20"></div>
            <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"></div>

            <div className="relative space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/30 text-blue-600 shadow">
                    <MapPin className="h-7 w-7 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Coleção de destinos</h2>
                    <p className="text-sm text-slate-600">
                      {destinationCount > 0
                        ? "Clique para abrir o modal com fotos, valores e detalhes exclusivos de cada experiência."
                        : "Cadastre um destino no dashboard para inaugurar esta vitrine inspiradora."}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>
                    {destinationCount}{" "}
                    {destinationCount === 1 ? "destino disponível" : "destinos disponíveis"}
                  </span>
                </div>
              </div>

              {destinationsError ? (
                <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-800 shadow-md">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ops! Estamos atualizando a vitrine</h3>
                    <p className="text-sm">
                      Tente novamente em instantes ou fale com nossa equipe para receber recomendações personalizadas.
                    </p>
                  </div>
                </div>
              ) : (
                <DestinationGrid
                  destinations={destinations}
                  canFavorite={Boolean(session?.user?.id)}
                  onDelete={session?.user ? deleteDestination : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção complementar com serviços e diferenciais da agência */}
      <section className="relative z-0">
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 px-6 py-16 shadow-[0_35px_70px_-40px_rgba(14,116,144,0.45)] backdrop-blur lg:px-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-blue-50" />
            <div className="pointer-events-none absolute -top-16 left-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow">
                  <div className="relative">
                    <Plane className="h-6 w-6" />
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yellow-500" />
                  </div>
                  Evastur, o seu parceiro de jornada
                </div>
                <h2 className="mt-6 text-3xl font-bold text-slate-900 md:text-4xl">
                  Uma experiência premium do planejamento ao pouso
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  Nossa equipe acompanha cada etapa para garantir que você tenha memórias inesquecíveis. Conte com especialistas em destinos nacionais e internacionais, prontos para personalizar cada detalhe.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Luggage, title: "Pacotes completos", desc: "Hospedagem, passeios e transfers sob medida." },
                  { icon: Ship, title: "Cruzeiros incríveis", desc: "Roteiros pelo Caribe, Mediterrâneo e Brasil." },
                  { icon: Globe, title: "Viagens internacionais", desc: "Assessoria para visto, seguro e câmbio." },
                  { icon: Shield, title: "Suporte 24/7", desc: "Atendimento dedicado durante toda a viagem." },
                ].map((service) => (
                  <div
                    key={service.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-br from-blue-500/10 to-cyan-500/20 transition-transform duration-500 group-hover:translate-y-0" />
                    <div className="relative z-10 space-y-3">
                      <service.icon className="h-8 w-8 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
                      <p className="text-sm text-slate-600">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-12 grid gap-8 rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur sm:grid-cols-3">
              {[
                { icon: TrendingUp, title: "Melhor preço garantido", desc: "Negociamos direto com fornecedores para ofertas imbatíveis." },
                { icon: Heart, title: "Atendimento humanizado", desc: "Consultores dedicados que entendem seu estilo de viagem." },
                { icon: Phone, title: "Suporte onde estiver", desc: "Fale com a Evastur por WhatsApp, telefone ou e-mail." },
              ].map((benefit) => (
                <div key={benefit.title} className="space-y-3 text-center sm:text-left">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:mx-0">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{benefit.title}</h3>
                  <p className="text-sm text-slate-600">{benefit.desc}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-white shadow-[0_45px_80px_-40px_rgba(37,99,235,0.6)]">
              <div className="absolute inset-0 bg-white/10" />
              <div className="relative z-10 text-center">
                <Heart className="mx-auto h-12 w-12 animate-pulse" />
                <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                  Pronto para sua próxima aventura?
                </h2>
                <p className="mt-3 text-base text-blue-100 md:text-lg">
                  Nossa equipe está pronta para desenhar um roteiro único para você. Entre em contato e receba propostas personalizadas em minutos.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <Mail className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                    Solicitar orçamento
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white/10">
                    <MessageCircle className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                    Falar no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
