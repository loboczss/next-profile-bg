import { redirect } from "next/navigation";
import { Brush, Image, LayoutDashboard, NotebookPen, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Prisma } from "@prisma/client";

import { BackgroundGalleryManager } from "@/components/BackgroundGalleryManager";
import { ChangeBackground } from "@/components/ChangeBackground";
import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { DashboardAnimatedWrapper } from "./dashboard-animated-wrapper";
import { BackgroundPresets } from "./_components/background-presets";
import { ActivityTimeline, ActivityItem } from "./_components/activity-timeline";
import { DashboardShell } from "./_components/dashboard-shell";
import { GlobalPreferencesPanel } from "./_components/global-preferences-panel";
import { OverviewChart } from "./_components/overview-chart";
import { StatCard } from "./_components/stat-card";
import { UserManagementPanel, DashboardUser } from "./_components/user-management-panel";
import { createDestination } from "./actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 8;

interface DashboardPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

// Função utilitária para consolidar contagens por papel de usuário.
function toRoleCount(groups: { role: string; _count: { _all: number } }[]) {
  return groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.role] = group._count._all;
    return acc;
  }, {});
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  const currentPage = Math.max(
    1,
    Number(typeof searchParams?.page === "string" ? Number(searchParams.page) : 1) || 1,
  );
  const searchTerm = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";

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

  const [users, totalUsers, roleGroup, activeUsers, newUsersThisMonth, backgroundSettings, backgroundCount, destinationsCount, favoritesCount, activityLogsRaw, recentUserCreations] =
    await Promise.all([
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
      prisma.backgroundImage.count({ where: { isVisible: true } }),
      prisma.destination.count(),
      prisma.favorite.count(),
      prisma.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actor: { select: { fullName: true, username: true } },
          subject: { select: { fullName: true, username: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

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

  const navItems = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "backgrounds", label: "Backgrounds", icon: Image },
    { id: "content", label: "Conteúdos", icon: NotebookPen },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell
        navItems={navItems}
        user={{
          name: session.user.fullName ?? session.user.name ?? session.user.username ?? "Administrador",
          role: session.user.role,
          imageUrl: session.user.image ?? null,
        }}
        backgroundUrl={backgroundUrl}
      >
        {/* Seção principal com métricas, gráfico e linha do tempo */}
        <section id="overview" className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-4">
            <StatCard
              title="Usuários totais"
              value={totalUsers.toString()}
              subtitle="Contas cadastradas na plataforma"
              icon={Users}
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
              icon={ShieldCheck}
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
              icon={Sparkles}
            />
            <StatCard
              title="Conteúdos publicados"
              value={(destinationsCount + favoritesCount).toString()}
              subtitle="Destinos ativos e favoritos registrados"
              icon={Brush}
              highlight={<p>{destinationsCount} destinos • {backgroundCount} backgrounds visíveis</p>}
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

        {/* Configurações de background e galeria */}
        <section id="backgrounds" className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <BackgroundPresets />
          </div>
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Upload personalizado</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Envie uma imagem ou utilize uma URL externa para compor o cenário principal do site.
              </p>
              <div className="mt-4">
                <ChangeBackground isAuthenticated />
              </div>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Galeria avançada</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controle agrupamentos, visibilidade e destaque das imagens do site.
              </p>
              <div className="mt-4">
                <BackgroundGalleryManager />
              </div>
            </div>
          </div>
        </section>

        {/* Conteúdos e módulos adicionais */}
        <section id="content" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastrar destino destaque</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registre novas experiências para alimentar o catálogo principal do site.
            </p>
            <div className="mt-4">
              <CreateDestinationForm action={createDestination} />
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500 shadow-inner backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Módulos expansíveis</h4>
            <p>
              Utilize este espaço para futuras integrações: formulários customizados, notificações ou pacotes promocionais. A
              arquitetura do painel foi projetada para receber novos cards sem alterar a base existente.
            </p>
          </div>
        </section>

        {/* Preferências globais e ajustes finais */}
        <section id="settings" className="space-y-6">
          <GlobalPreferencesPanel />
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
