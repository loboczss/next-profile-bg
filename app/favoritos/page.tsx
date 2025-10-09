import { redirect } from "next/navigation";

import { FavoritesGrid } from "@/components/favorites/favorites-grid";
import { auth } from "@/lib/auth";
import { serializeDestination, type SerializedDestination } from "@/lib/destinations";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function FavoritesPage() {
  const session = await auth();
  const prismaClient = prisma;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/favoritos")}`);
  }

  const userId = Number(session.user.id);

  let favoriteDestinations: SerializedDestination[] = [];
  if (prismaClient) {
    try {
      const favorites = await prismaClient.favorite.findMany({
        where: { userId },
        include: { destination: true },
        orderBy: { createdAt: "desc" },
      });

      favoriteDestinations = favorites
        .filter((favorite) => favorite.destination)
        .map((favorite) => ({
          ...serializeDestination(favorite.destination),
          isFavorite: true,
          favoriteCreatedAt: favorite.createdAt.toISOString(),
        }));
    } catch (error) {
      console.error("Erro ao carregar favoritos", error);
    }
  } else {
    console.error("Prisma Client não está disponível. Lista de favoritos carregada vazia.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-white to-sky-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-10 h-80 w-80 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl transition hover:shadow-3xl sm:p-10">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/40 bg-pink-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-pink-500 shadow-sm">
                <span className="inline-flex size-2 rounded-full bg-pink-500" />
                <span>Favoritos</span>
                <span className="inline-flex size-2 rounded-full bg-pink-500" />
              </div>
              <h1 className="text-balance text-3xl font-bold text-slate-900 sm:text-4xl">
                Seus destinos inesquecíveis
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Organize os lugares que você mais gostou e planeje sua próxima viagem com praticidade. Remova destinos quando mudar de ideia e mantenha sua lista sempre atualizada.
              </p>
            </div>
          </header>

          <div className="mt-10">
            <FavoritesGrid initialDestinations={favoriteDestinations} />
          </div>
        </div>
      </section>
    </main>
  );
}
