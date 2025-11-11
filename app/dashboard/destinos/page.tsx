import { redirect } from "next/navigation";

import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { DashboardShell } from "../_components/dashboard-shell";
import { dashboardNavItems } from "../nav-items";
import { createDestination } from "../actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardDestinationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  const navItems = dashboardNavItems;

  const dashboardUserInfo = {
    name: session.user.fullName ?? session.user.name ?? session.user.username ?? "Administrador",
    role: session.user.role,
    imageUrl: session.user.image ?? null,
  };

  if (!prisma) {
    return (
      <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
        <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="destinations">
          <section id="destinations" className="space-y-6">
            <div className="rounded-3xl border border-rose-200/70 bg-rose-50/90 p-8 text-rose-900 shadow-sm">
              <h1 className="text-2xl font-semibold">Cadastro de destinos indisponível</h1>
              <p className="mt-3 text-sm text-rose-700">
                Não foi possível se conectar ao banco de dados. Configure a variável <code>DATABASE_URL</code> para liberar o cadastro
                de novos destinos e tente novamente.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  let destinationsCount = 0;
  let favoritesCount = 0;
  let recentDestinations: Array<{
    id: number;
    name: string;
    city: string;
    createdAt: Date;
  }> = [];

  try {
    [destinationsCount, favoritesCount, recentDestinations] = await Promise.all([
      prisma.destination.count(),
      prisma.favorite.count(),
      prisma.destination.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          city: true,
          createdAt: true,
        },
      }),
    ]);
  } catch (error) {
    console.error("Não foi possível carregar os dados do dashboard de destinos", error);

    return (
      <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
        <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="destinations">
          <section id="destinations" className="space-y-6">
            <div className="rounded-3xl border border-rose-200/70 bg-rose-50/90 p-8 text-rose-900 shadow-sm">
              <h1 className="text-2xl font-semibold">Cadastro de destinos indisponível</h1>
              <p className="mt-3 text-sm text-rose-700">
                Ocorreu um erro ao consultar o banco de dados. Verifique a configuração da variável <code>DATABASE_URL</code>
                {" "}
                e tente novamente em instantes.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  const formattedRecentDestinations = recentDestinations.map((destination) => ({
    id: destination.id,
    name: destination.name,
    city: destination.city,
    createdAt: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(destination.createdAt),
  }));

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell
        navItems={navItems}
        user={dashboardUserInfo}
        activeItemId="destinations"
      >
        <section id="destinations" className="space-y-10">
          <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
                  Gestão de catálogo
                </p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar novos destinos com eficiência
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Preencha o formulário dedicado para adicionar destinos completos ao catálogo. Utilize descrições envolventes,
                  fotos inspiradoras e valores atualizados para encantar seus clientes.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Destinos publicados
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{destinationsCount}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Favoritos registrados
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{favoritesCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <CreateDestinationForm action={createDestination} />
            </div>
            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Boas práticas de cadastro</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Utilize descrições objetivas com os diferenciais do destino.</li>
                  <li>• Priorize fotos horizontais em alta resolução para o destaque.</li>
                  <li>• Informe valores atualizados por pessoa e datas precisas da viagem.</li>
                  <li>• Defina uma nota coerente para ajudar os usuários na comparação.</li>
                </ul>
              </div>

              {formattedRecentDestinations.length > 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Últimos destinos cadastrados
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {formattedRecentDestinations.map((destination) => (
                      <li key={destination.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{destination.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{destination.city}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                          {destination.createdAt}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
