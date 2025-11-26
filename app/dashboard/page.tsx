import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { DashboardAnimatedWrapper } from "./dashboard-animated-wrapper";
import { ActivityTimeline, ActivityItem } from "./_components/activity-timeline";
import { DashboardShell, type DashboardNavItem } from "./_components/dashboard-shell";
import { GlobalPreferencesPanel } from "./_components/global-preferences-panel";
import { OverviewChart } from "./_components/overview-chart";
import { StatCard } from "./_components/stat-card";
import { UserManagementPanel, DashboardUser } from "./_components/user-management-panel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveBackgroundSelection } from "@/lib/backgrounds";
import { dashboardNavItems } from "./nav-items";

const PAGE_SIZE = 8;

type DashboardSearchParams = Record<string, string | string[] | undefined>;

type AdminActivityLogRecord = {
  id: number;
  action: string;
  message: string;
  createdAt: Date;
  actor?: { fullName: string | null; username: string | null } | null;
  subject?: { fullName: string | null; username: string | null } | null;
};

type AdminActivityLogDelegate = {
  findMany: (args: {
    orderBy?: { createdAt?: "asc" | "desc" };
    take?: number;
    include?: {
      actor?: { select?: { fullName?: boolean; username?: boolean } };
      subject?: { select?: { fullName?: boolean; username?: boolean } };
    };
  }) => Promise<AdminActivityLogRecord[]>;
};

interface DashboardPageProps {
  searchParams?: Promise<DashboardSearchParams>;
}

// Função utilitária para consolidar contagens por papel de usuário.
function toRoleCount(groups: { role: string; _count: { _all: number } }[]) {
  return groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.role] = group._count._all;
    return acc;
  }, {});
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams: DashboardSearchParams = (await searchParams) ?? {};
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  const currentPage = Math.max(
    1,
    Number(typeof resolvedSearchParams.page === "string" ? Number(resolvedSearchParams.page) : 1) || 1,
  );
  const searchTerm =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";

  const userFilter: Prisma.UserWhereInput = searchTerm
    ? {
        OR: [
          { fullName: { contains: searchTerm, mode: "insensitive" } },
          { username: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const lastThirtyDays = new Date();
  lastThirtyDays.setDate(lastThirtyDays.getDate() - 30);

  const sixMonthsAgo = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 5, 1);

  const navItems: DashboardNavItem[] = dashboardNavItems;

  const dashboardUserInfo = {
    name: session.user.fullName ?? session.user.name ?? session.user.username ?? "Administrador",
    role: session.user.role,
    imageUrl: session.user.image ?? null,
  };

  if (!prisma) {
    return (
      <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
        <DashboardShell
          navItems={navItems}
          user={dashboardUserInfo}
          backgroundUrl={null}
        >
          <section id="overview" className="space-y-6">
            <div className="rounded-3xl border border-rose-200/70 bg-rose-50/80 p-6 text-rose-900 shadow-sm">
              <h2 className="text-lg font-semibold">Banco de dados indisponível</h2>
              <p className="mt-2 text-sm text-rose-700">
                Não foi possível se conectar ao banco de dados. As funcionalidades administrativas estarão
                temporariamente indisponíveis até que a configuração seja corrigida.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  const [
    users,
    totalUsers,
    roleGroup,
    activeUsers,
    newUsersThisMonth,
    backgroundSettings,
    destinationsCount,
    favoritesCount,
    recentUserCreations,
  ] = await Promise.all([
    prisma.user.findMany({
      where: userFilter,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where: userFilter }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: lastThirtyDays },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    }),
    getActiveBackgroundSelection(),
    prisma.destination.count(),
    prisma.favorite.count(),
    prisma.user.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  const prismaWithActivityLog = prisma as unknown as {
    adminActivityLog?: AdminActivityLogDelegate;
  };

  const activityLogsRaw = prismaWithActivityLog.adminActivityLog
    ? await prismaWithActivityLog.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actor: { select: { fullName: true, username: true } },
          subject: { select: { fullName: true, username: true } },
        },
      })
    : [];

  // Caso não existam logs persistidos (instalação recente), utiliza-se a atualização de usuários como fallback.
  let activityItems: ActivityItem[] = activityLogsRaw.map((log) => ({
    id: log.id,
    action: log.action,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    actorName: log.actor?.fullName ?? log.actor?.username ?? null,
    subjectName: log.subject?.fullName ?? log.subject?.username ?? null,
  }));

  if (activityItems.length === 0) {
    const fallbackUsers = await prisma.user.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        username: true,
        updatedAt: true,
      },
    });

    activityItems = fallbackUsers.map((user) => ({
      id: user.id,
      action: "USER_UPDATED",
      message: `Perfil de ${user.fullName} atualizado recentemente`,
      createdAt: user.updatedAt.toISOString(),
      actorName: user.fullName ?? user.username,
    }));
  }

  const roleCount = toRoleCount(roleGroup);
  const adminCount = roleCount.admin ?? 0;
  const editorCount = roleCount.editor ?? 0;
  const viewerCount = roleCount.viewer ?? 0;

  const monthlyMap = new Map<string, number>();
  for (const user of recentUserCreations) {
    const key = `${user.createdAt.getFullYear()}-${user.createdAt.getMonth()}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }

  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      label: date.toLocaleDateString("pt-BR", { month: "short" }),
      value: monthlyMap.get(key) ?? 0,
    };
  });

  const dashboardUsers: DashboardUser[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

    const backgroundUrl =
      backgroundSettings.selectedBackgrounds[0]?.url ??
      backgroundSettings.backgroundUrl ??
      null;
    const catalogTotal = destinationsCount + favoritesCount;
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const monthlyGrowthRate = totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell
        navItems={navItems}
        user={dashboardUserInfo}
        backgroundUrl={backgroundUrl}
        activeItemId="overview"
      >
        {/* Seção principal com métricas, gráfico e linha do tempo */}
        <section id="overview" className="space-y-10">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-gradient-to-br from-slate-900 via-indigo-800 to-blue-700 p-6 text-white shadow-xl dark:border-slate-800/60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.3),transparent_40%)]" />
              <div className="relative space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                      Centro administrativo
                    </span>
                    <h1 className="text-3xl font-semibold leading-tight">Visão geral reconstruída</h1>
                    <p className="max-w-2xl text-sm text-white/80">
                      Uma disposição mais equilibrada para navegar por métricas, usuários e conteúdo. A nova hierarquia agrupa os painéis por contexto
                      e reduz a necessidade de abrir seções adicionais.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">Usuários: {totalUsers}</span>
                      <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">Destinos: {destinationsCount}</span>
                      <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">Favoritos: {favoritesCount}</span>
                    </div>
                  </div>

                  <div className="min-w-[240px] space-y-3 rounded-2xl border border-white/30 bg-white/10 p-4 shadow-lg backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Atividade recente</p>
                    <p className="text-4xl font-semibold leading-none">{activeUsersPercentage}%</p>
                    <p className="text-sm text-white/80">dos usuários ativos nos últimos 30 dias</p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${Math.min(activeUsersPercentage, 100)}%` }}
                        aria-hidden
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span>{newUsersThisMonth} novos no mês</span>
                      <span>{activeUsers} sessões</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-white/80">Catálogo</p>
                    <p className="text-2xl font-semibold text-white">{catalogTotal}</p>
                    <p className="text-sm text-white/80">{destinationsCount} destinos • {favoritesCount} favoritos</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-white/80">Equipe</p>
                    <p className="text-2xl font-semibold text-white">{adminCount} admins</p>
                    <p className="text-sm text-white/80">Editores {editorCount} • Visualizadores {viewerCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-white/80">Personalização</p>
                    <p className="text-2xl font-semibold text-white">{backgroundUrl ? "Imagem ativa" : "Tema padrão"}</p>
                    <p className="text-sm text-white/80">Fundo do painel configurável em segundos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Ritmo do mês</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Controle de cadastros</h3>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-200">
                  {monthlyGrowthRate}%
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Novos perfis</span>
                    <span>{newUsersThisMonth}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                      style={{ width: `${Math.min(monthlyGrowthRate, 100)}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Comparado ao total de contas registradas</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Usuários ativos</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{activeUsers}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Atualizados nas últimas 4 semanas</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Média mensal</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{Math.max(...chartData.map((point) => point.value), 0)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Entrada de usuários nos últimos 6 meses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  title="Usuários totais"
                  value={totalUsers.toString()}
                  subtitle="Contas cadastradas na plataforma"
                  icon="users"
                  trend={{
                    value: `${activeUsers} ativos`,
                    label: "nos últimos 30 dias",
                    isPositive: activeUsers >= totalUsers / 2,
                  }}
                />
                <StatCard
                  title="Administradores"
                  value={adminCount.toString()}
                  subtitle="Controle de permissões avançadas"
                  icon="shield-check"
                  highlight={
                    <p>
                      Editores: <strong>{editorCount}</strong> • Visualizadores: <strong>{viewerCount}</strong>
                    </p>
                  }
                />
                <StatCard
                  title="Novos no mês"
                  value={newUsersThisMonth.toString()}
                  subtitle="Cadastros confirmados desde o início do mês"
                  icon="sparkles"
                />
                <StatCard
                  title="Catálogo ativo"
                  value={catalogTotal.toString()}
                  subtitle="Destinos e favoritos registrados na plataforma"
                  icon="brush"
                  highlight={<p>{destinationsCount} destinos • {favoritesCount} favoritos</p>}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Progresso</p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Crescimento de usuários</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Comparativo dos últimos seis meses por volume de registros</p>
                  </div>
                </div>
                <div className="mt-4">
                  <OverviewChart title="" description="" points={chartData} />
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Linha do tempo</p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Atividade administrativa</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {activityItems.length} registros
                  </span>
                </div>
                <div className="mt-4">
                  <ActivityTimeline items={activityItems} />
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Checklist operacional</h3>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Mantenha os fluxos atualizados: reveja destinos, monitore as compras em andamento e acompanhe a adesão da equipe.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />Fluxo de destinos: {destinationsCount} ativos</li>
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden />Favoritos acompanhando interesses ({favoritesCount})</li>
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />Equipe dedicada: {adminCount} admins e {editorCount} editores</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Gestão de usuários */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Pessoas</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Gestão centralizada de usuários</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Filtros, paginação e cartões compactos para navegação mais confortável.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Página {currentPage}
            </span>
          </div>
          <UserManagementPanel
            users={dashboardUsers}
            total={totalUsers}
            page={currentPage}
            pageSize={PAGE_SIZE}
            searchTerm={searchTerm}
          />
        </section>

        {/* Preferências globais e ajustes finais */}
        <section id="settings" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlobalPreferencesPanel />

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Notas rápidas</h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Use as novas sessões do menu e do dashboard para entrar diretamente em cada área, mantendo a navegação principal limpa.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm font-medium text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                Reorganize os destinos periodicamente para realçar novidades e ofertas.
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm font-medium text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                Valide permissões de equipe para manter acessos críticos sob controle.
              </div>
            </div>
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
