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
    prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: {
        backgroundUrl: true,
      },
    }),
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

  const backgroundUrl = backgroundSettings?.backgroundUrl ?? null;

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell
        navItems={navItems}
        user={dashboardUserInfo}
        backgroundUrl={backgroundUrl}
        activeItemId="overview"
      >
        {/* Seção principal com métricas, gráfico e linha do tempo */}
        <section id="overview" className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-4">
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
              value={(destinationsCount + favoritesCount).toString()}
              subtitle="Destinos e favoritos registrados na plataforma"
              icon="brush"
              highlight={<p>{destinationsCount} destinos • {favoritesCount} favoritos</p>}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <OverviewChart
                title="Crescimento de usuários"
                description="Comparativo dos últimos seis meses"
                points={chartData}
              />
            </div>
            <div className="lg:col-span-2">
              <ActivityTimeline items={activityItems} />
            </div>
          </div>
        </section>

        {/* Gestão de usuários */}
        <UserManagementPanel
          users={dashboardUsers}
          total={totalUsers}
          page={currentPage}
          pageSize={PAGE_SIZE}
          searchTerm={searchTerm}
        />

        {/* Preferências globais e ajustes finais */}
        <section id="settings" className="space-y-6">
          <GlobalPreferencesPanel />
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
