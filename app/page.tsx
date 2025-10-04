import Link from "next/link";

import { DestinationGrid } from "@/components/destinations/destination-grid";
import { auth } from "@/lib/auth";
import {
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { prisma } from "@/lib/prisma";

// Página inicial pública que apresenta o projeto e exibe os últimos destinos cadastrados.
export default async function HomePage() {
  // Recupera a sessão atual para personalizar o conteúdo quando o usuário está logado.
  const session = await auth();

  let backgroundUrl: string | null = null;
  try {
    // Busca a URL do background global configurado pelo administrador.
    const settings = await prisma.globalSetting.findUnique({
      where: { id: 1 },
      select: { backgroundUrl: true },
    });
    backgroundUrl = settings?.backgroundUrl ?? null;
  } catch {
    // Em caso de erro na consulta, apenas ignora e mantém o fundo padrão.
    backgroundUrl = null;
  }

  let destinations: SerializedDestination[] = [];
  try {
    // Carrega os destinos cadastrados, ordenando pelos mais recentes.
    const destinationsFromDb = await prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Converte os registros do banco para o formato serializado utilizado nos componentes de UI.
    destinations = destinationsFromDb.map(serializeDestination);
  } catch {
    // Caso a consulta falhe, mantém a lista vazia e o componente lidará com a ausência de dados.
    destinations = [];
  }

  return (
    // Estrutura principal com o fundo configurável pelo administrador.
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
            {/* Cartão inicial com as principais ações disponíveis para usuários logados ou visitantes. */}
            <div className="rounded-lg bg-white/80 p-6 shadow">
              <h2 className="text-2xl font-semibold">Bem-vindo!</h2>
              <p className="mt-2 text-sm text-slate-600">
                Gerencie sua identidade visual no Next Profile BG alterando a foto de perfil e o background global.
              </p>
              {/* Conteúdo condicional que exibe ações específicas para usuários autenticados. */}
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

            {/* Seção com listagem dos destinos armazenados no banco. */}
            <section
              id="destinos"
              className="rounded-lg bg-white/80 p-6 shadow"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Destinos disponíveis
                    </h3>
                    <p className="text-sm text-slate-600">
                      Confira as últimas experiências cadastradas e inspire-se para a próxima viagem.
                    </p>
                  </div>
                  <Link
                    href="/destinos"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Ver todos os destinos
                  </Link>
                </div>
                <DestinationGrid destinations={destinations} />
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  );
}
