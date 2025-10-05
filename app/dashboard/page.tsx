// app/dashboard/page.tsx (Server Component)
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  Image as ImageIcon,
  Wand2,
  Link as LinkIcon,
  MapPin,
  Layout,
  Camera,
} from "lucide-react";

import { ChangeBackground } from "@/components/ChangeBackground";
import { BackgroundGalleryManager } from "@/components/BackgroundGalleryManager";
import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { createDestination } from "./actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Importa o wrapper client-side com animações
import { DashboardAnimatedWrapper } from "./dashboard-animated-wrapper";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let backgroundUrl: string | null = null;

  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: { backgroundUrl: true },
    });

    backgroundUrl = settings?.backgroundUrl ?? null;
  } catch {
    backgroundUrl = null;
  }

  return (
    <DashboardAnimatedWrapper userName={session.user.name ?? "usuário"}>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

        {/* Main Content */}
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Grid Principal - Background */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Preview Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-blue-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-blue-500/20">
              <div className="relative p-8">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 shadow-lg transition-transform duration-300 hover:rotate-12">
                      <ImageIcon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Background Global</h2>
                      <p className="text-sm text-slate-600">Imagem principal do site</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                </div>

                {backgroundUrl ? (
                  <div className="space-y-4">
                    <div className="group/img relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-slate-100 to-slate-50 shadow-xl">
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                          src={backgroundUrl}
                          alt="Background atual"
                          fill
                          className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                          sizes="(max-width: 1024px) 100vw, 800px"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/img:opacity-100" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 shadow-sm">
                      <LinkIcon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                      <code className="block truncate text-xs font-medium text-blue-700">{backgroundUrl}</code>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-purple-200/60 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
                      <Wand2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                      <p className="text-xs leading-relaxed text-purple-700">
                        <span className="font-semibold">Dica:</span> Use imagens horizontais (16:9), resolução 1920px+ e formato WebP/JPEG otimizado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center">
                    <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform duration-300 hover:scale-110">
                      <Camera className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="mb-2 text-base font-bold text-slate-800">Nenhum background definido</p>
                    <p className="text-sm text-slate-600">Envie uma nova imagem para começar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-purple-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-purple-500/20">
              <div className="relative p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 shadow-lg transition-transform duration-300 hover:rotate-12">
                    <Wand2 className="h-7 w-7 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Alterar Background</h2>
                    <p className="text-sm text-slate-600">Upload ou URL externa</p>
                  </div>
                </div>

                <ChangeBackground isAuthenticated />
              </div>
            </div>
          </div>

          {/* Destination Form */}
          <div className="mb-8">
            <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-cyan-500/20">
              <div className="relative p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-50 shadow-lg transition-transform duration-300 hover:rotate-12">
                    <MapPin className="h-7 w-7 text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Cadastrar Novo Destino</h2>
                    <p className="text-sm text-slate-600">Adicione experiências únicas à sua plataforma</p>
                  </div>
                </div>

                <CreateDestinationForm action={createDestination} />
              </div>
            </div>
          </div>

          {/* Gallery Manager */}
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/20">
              <div className="relative p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 shadow-lg transition-transform duration-300 hover:rotate-12">
                    <Layout className="h-7 w-7 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Gerenciar Galeria de Backgrounds</h2>
                    <p className="text-sm text-slate-600">Organize e edite todas as imagens do site</p>
                  </div>
                </div>

                <BackgroundGalleryManager />
              </div>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="border-t border-white/20 bg-white/60 py-6 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
            <p>Evastur Admin Dashboard • Gerenciamento visual simplificado</p>
          </div>
        </footer>
      </main>
    </DashboardAnimatedWrapper>
  );
}

