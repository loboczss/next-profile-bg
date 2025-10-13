import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PURCHASE_STATUS_LABELS, serializePurchase, type SerializedPurchase } from "@/lib/purchases";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MinhasComprasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/minhas-compras")}`);
  }

  if (!prisma) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200/80 bg-amber-50/80 p-10 text-amber-900 shadow-md">
          <h1 className="text-2xl font-semibold">Compras indisponíveis no momento</h1>
          <p className="mt-3 text-sm">
            Não foi possível se conectar ao banco de dados. Tente novamente mais tarde ou entre em contato com nossa equipe de
            suporte.
          </p>
        </div>
      </main>
    );
  }

  const purchasesFromDb = await prisma.purchase.findMany({
    where: { userId: Number(session.user.id) },
    include: {
      package: true,
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: { dataCompra: "desc" },
  });

  const purchases: SerializedPurchase[] = purchasesFromDb.map(serializePurchase);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-4 rounded-3xl border border-blue-200/60 bg-white/80 p-10 shadow-xl backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            Minhas compras
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">Pacotes adquiridos</h1>
            <p className="text-base text-slate-600">
              Acompanhe aqui todas as suas solicitações de viagem. Atualizaremos o status assim que a emissão for concluída.
            </p>
          </div>
        </header>

        {purchases.length === 0 ? (
          <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-10 text-center shadow-xl backdrop-blur">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
              <div className="grid size-16 place-items-center rounded-full bg-slate-100 text-slate-500">
                📦
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Você ainda não comprou nenhum pacote</h2>
              <p className="text-sm text-slate-600">
                Explore nossos destinos e encontre a experiência perfeita para sua próxima viagem. O processo de compra é rápido e seguro.
              </p>
              <Link
                href="/destinos"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-500/90 hover:to-cyan-500/90"
              >
                Ver destinos disponíveis
              </Link>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            {purchases.map((purchase) => {
              const cover = purchase.package.coverPhoto ?? "/placeholder.jpg";
              const purchaseDate = dateFormatter.format(new Date(purchase.dataCompra));
              const statusLabel = PURCHASE_STATUS_LABELS[purchase.status];
              const statusColor =
                purchase.status === "EMITIDA"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700";
              const observacao = purchase.observacao.trim();

              return (
                <article
                  key={purchase.id}
                  className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-inner sm:h-32 sm:w-48">
                      <Image
                        src={cover}
                        alt={purchase.package.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 192px, 100vw"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">{purchase.package.name}</h2>
                          <p className="text-sm text-slate-500">{purchase.package.city}</p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                            statusColor
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="flex flex-col">
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Data da compra</dt>
                          <dd className="font-semibold text-slate-800">{purchaseDate}</dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Valor estimado</dt>
                          <dd className="font-semibold text-slate-800">{currencyFormatter.format(purchase.package.price)}</dd>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Observação do time</dt>
                          <dd className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {observacao ? observacao : "Sem observações até o momento."}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

