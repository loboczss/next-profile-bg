import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DropboxConnectionTest } from "@/components/DropboxConnectionTest";

export default async function HomePage() {
  const session = await auth();

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
    <main
      className="min-h-dvh bg-slate-100 text-slate-900"
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="min-h-dvh bg-white/70 flex flex-col">
        <section className="flex-1">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
            <div className="rounded-lg bg-white/80 p-6 shadow">
              <h2 className="text-2xl font-semibold">Bem-vindo!</h2>
              <p className="mt-2 text-sm text-slate-600">
                Gerencie sua identidade visual no Next Profile BG alterando a foto de perfil e o background global.
              </p>
              {session?.user ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-700">
                    Usuário logado: <strong>{session.user.name ?? "Usuário"}</strong>
                  </p>
                  {session.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt="Foto atual"
                      className="h-20 w-20 rounded-full border object-cover"
                    />
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/usuario"
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Acessar página do usuário
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Ir para o painel admin
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-700">
                  Não possui conta? <Link className="text-blue-600" href="/signup">Cadastre-se</Link>.
                </p>
              )}
            </div>

            <DropboxConnectionTest />
          </div>
        </section>
      </div>
    </main>
  );
}
