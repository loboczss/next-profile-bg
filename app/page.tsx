import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePhoto } from "@/components/ChangePhoto";
import { ChangeBackground } from "@/components/ChangeBackground";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

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
        <header className="w-full border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-semibold">next-profile-bg</h1>
            <nav className="flex items-center gap-3 text-sm">
              {session?.user ? (
                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded-md border px-3 py-2 font-medium hover:bg-slate-100"
                  >
                    Sair
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md border px-3 py-2 font-medium hover:bg-slate-100"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>

        <section className="flex-1">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
            <div className="rounded-lg bg-white/80 p-6 shadow">
              <h2 className="text-2xl font-semibold">Bem-vindo!</h2>
              <p className="mt-2 text-sm text-slate-600">
                Configure sua foto de perfil e o background global. Faça login para alterar sua foto.
              </p>
              {session?.user ? (
                <div className="mt-4 space-y-2">
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
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-700">
                  Não possui conta? <Link className="text-blue-600" href="/signup">Cadastre-se</Link>.
                </p>
              )}
            </div>

            {session?.user && <ChangePhoto />}
            <ChangeBackground />
          </div>
        </section>
      </div>
    </main>
  );
}
