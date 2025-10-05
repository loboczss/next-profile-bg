import { redirect } from "next/navigation";
import Image from "next/image";
import {
  Plane,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Wand2,
  Link as LinkIcon,
} from "lucide-react";

import { ChangeBackground } from "@/components/ChangeBackground";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Página administrativa usada para visualizar e atualizar o background global do site.
export default async function DashboardPage() {
  // Verifica se o usuário está autenticado antes de liberar o painel.
  const session = await auth();

  if (!session?.user) {
    // Usuários não logados são redirecionados para a tela de login.
    redirect("/login");
  }

  let backgroundUrl: string | null = null;

  try {
    // Busca no banco a configuração mais recente do background global.
    const settings = await prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: { backgroundUrl: true },
    });

    backgroundUrl = settings?.backgroundUrl ?? null;
  } catch {
    // Se ocorrer um erro, não impede o carregamento da página; o componente exibirá um estado vazio.
    backgroundUrl = null;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Blobs suaves no fundo (consistentes com o resto do site) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      {/* Header do painel */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Plane className="h-7 w-7 text-blue-600" />
            <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">Evastur</span>
              <span className="ml-2 text-sm font-medium text-slate-600">Painel admin</span>
            </h1>
            <p className="text-xs text-slate-500">
              Olá, <strong>{session.user.name ?? "usuário"}</strong>. Gerencie aqui o background global do site.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-md sm:flex">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          Acesso autorizado
        </div>
      </header>

      {/* Conteúdo */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          {/* Card informativo + preview atual */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:p-8">
            {/* Glow sutil */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/30 bg-gradient-to-br from-blue-50 to-purple-50 shadow">
                <ImageIcon className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Background global</h2>
                <p className="text-sm text-slate-600">
                  Visualize e mantenha a imagem usada no herói e seções que consomem o background global.
                </p>
              </div>
            </div>

            {/* Preview elegante da imagem atual */}
            {backgroundUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/60">
                  <div className="relative aspect-[16/9] w-full">
                    {/* Usamos Image para carregar com qualidade se for permitido; se não, cai no bg div */}
                    {/* Como backgroundUrl vem do banco e pode ser externo, o Next/Image pode precisar de domain config.
                        Se não estiver configurado, substitua por um <div style={{ backgroundImage }} /> como seu original. */}
                    <Image
                      src={backgroundUrl}
                      alt="Background atual"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 800px"
                      priority
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-xs text-slate-600">
                  <LinkIcon className="h-4 w-4 text-blue-700" />
                  <code className="block truncate">{backgroundUrl}</code>
                </div>

                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Wand2 className="h-4 w-4 text-purple-600" />
                  Dica: use imagens horizontais (16:9), 1920px+ e compressão leve (WebP/JPEG).
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white">
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Nenhum background definido</p>
                <p className="text-xs text-slate-600">
                  Envie uma nova imagem ao lado para aplicar no site.
                </p>
              </div>
            )}
          </div>

          {/* Formulário de alteração (seu componente) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/30 bg-gradient-to-br from-blue-50 to-purple-50 shadow">
                <Wand2 className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Alterar background</h2>
                <p className="text-sm text-slate-600">
                  Faça upload de uma nova imagem ou cole a URL. A atualização é refletida no site.
                </p>
              </div>
            </div>

            {/* Form reutilizável que permite alterar a imagem de fundo global. */}
            <ChangeBackground isAuthenticated />
          </div>
        </div>
      </section>
    </main>
  );
}
