import { redirect } from "next/navigation";

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
    // Estrutura com o cartão informativo e o formulário de alteração de background.
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="rounded-lg bg-white/80 p-6 shadow space-y-3">
        <h1 className="text-2xl font-semibold">Painel admin</h1>
        <p className="text-slate-600">
          Olá, <strong>{session.user.name ?? "usuário"}</strong>. Utilize esta página para gerenciar o background global do site.
        </p>
        {backgroundUrl && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Background atual:</p>
            <div className="overflow-hidden rounded-lg border">
              <div
                className="h-40 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundUrl})` }}
              />
            </div>
            <code className="block truncate rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">{backgroundUrl}</code>
          </div>
        )}
      </div>

      {/* Formulário reutilizável que permite alterar a imagem de fundo global. */}
      <ChangeBackground isAuthenticated />
    </div>
  );
}
