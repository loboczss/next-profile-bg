import { redirect } from "next/navigation";

import { BackgroundGalleryManager } from "@/components/BackgroundGalleryManager";
import { ChangeBackground } from "@/components/ChangeBackground";
import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { DashboardShell } from "../_components/dashboard-shell";
import { dashboardNavItems } from "../nav-items";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardBackgroundsPage() {
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
        <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="backgrounds">
          <section id="backgrounds" className="space-y-6">
            <div className="rounded-3xl border border-amber-200/70 bg-amber-50/90 p-8 text-amber-900 shadow-sm">
              <h1 className="text-2xl font-semibold">Configuração de backgrounds indisponível</h1>
              <p className="mt-3 text-sm text-amber-700">
                Conecte o banco de dados configurando a variável <code>DATABASE_URL</code> para visualizar e editar os backgrounds do site.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  const [backgroundSettings, visibleBackgrounds, totalBackgrounds] = await Promise.all([
    prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: {
        backgroundUrl: true,
      },
    }),
    prisma.backgroundImage.count({ where: { isVisible: true } }),
    prisma.backgroundImage.count(),
  ]);

  const backgroundUrl = backgroundSettings?.backgroundUrl ?? null;

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell
        navItems={navItems}
        user={dashboardUserInfo}
        backgroundUrl={backgroundUrl}
        activeItemId="backgrounds"
      >
        <section id="backgrounds" className="space-y-8">
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">
                  Painel de fundos simplificado
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  Ajuste o cenário do portal sem ruído visual
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Centralize o controle do plano de fundo e mantenha uma galeria enxuta, sem opções duplicadas ou fluxos confusos.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exibidos</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{visibleBackgrounds}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Imagens ativas no site</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalBackgrounds}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Itens cadastrados na galeria</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr,1.3fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">
                      Plano de fundo principal
                    </p>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Escolha rápida e sem duplicação</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Faça upload de um visual hero ou defina uma URL já hospedada. O painel foi enxugado para evitar itens repetidos e garantir clareza.
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <ChangeBackground isAuthenticated />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Guia rápido</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Prefira imagens leves (até 500 KB) para carregamento instantâneo.</li>
                  <li>• Use proporção 16:9 para evitar cortes inesperados em telas largas.</li>
                  <li>• Atualize o fundo principal antes de liberar novas entradas da galeria.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">Galeria enxuta</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Controle apenas o essencial</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Gerencie visibilidade, destaques e informações de cada imagem sem se perder em camadas duplicadas de ações.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <BackgroundGalleryManager />
              </div>
            </div>
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
