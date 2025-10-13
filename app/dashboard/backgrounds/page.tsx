import { redirect } from "next/navigation";

import { BackgroundGalleryManager } from "@/components/BackgroundGalleryManager";
import { ChangeBackground } from "@/components/ChangeBackground";
import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { BackgroundPresets } from "../_components/background-presets";
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
        <section id="backgrounds" className="space-y-10">
          <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
                  Identidade visual do portal
                </p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Gerencie o cenário principal e a galeria de fundos
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Ajuste rapidamente o plano de fundo do site, organize grupos de imagens e destaque suas paisagens favoritas para cada campanha.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ativos visíveis</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{visibleBackgrounds}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Itens na galeria</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalBackgrounds}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,1.4fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Plano de fundo principal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Faça upload de uma imagem personalizada ou defina uma URL externa para alterar o cenário padrão exibido aos usuários logados e visitantes.
                </p>
                <div className="mt-4">
                  <ChangeBackground isAuthenticated />
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Coleções e presets</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Escolha rapidamente combinações prontas ou reorganize os grupos para manter a identidade visual sempre atualizada.
                </p>
                <div className="mt-4">
                  <BackgroundPresets />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Galeria avançada</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controle visibilidade, destaques e informações de cada imagem cadastrada. Ideal para campanhas sazonais e vitrines temáticas.
              </p>
              <div className="mt-4">
                <BackgroundGalleryManager />
              </div>
            </div>
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
