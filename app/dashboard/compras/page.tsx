import { redirect } from "next/navigation";

import { AdminPurchasesTable } from "@/components/purchases/admin-purchases-table";
import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { DashboardShell } from "../_components/dashboard-shell";
import { dashboardNavItems } from "../nav-items";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePurchase, type SerializedPurchase } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export default async function DashboardPurchasesPage() {
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
      <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
        <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
          <section className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-amber-900 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85)_0,_transparent_45%)]" aria-hidden />
              <div className="relative space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Painel de compras</p>
                <h1 className="text-3xl font-bold text-amber-900">Gestão de compras indisponível</h1>
                <p className="text-sm leading-relaxed text-amber-800/90">
                  Não foi possível se conectar ao banco de dados. Configure a variável <code>DATABASE_URL</code> e tente novamente.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
                    Sistema em modo offline
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
                    Atualize as credenciais e recarregue a página
                  </span>
                </div>
              </div>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  const purchasesFromDb = await prisma.purchase.findMany({
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
      passengers: true,
      payment: true,
    },
    orderBy: { dataCompra: "desc" },
  });

  const purchases: SerializedPurchase[] = purchasesFromDb.map(serializePurchase);

  const totalPurchases = purchases.length;
  const totalPending = purchases.filter((purchase) => purchase.status === "AGUARDANDO_EMISSAO").length;
  const totalIssued = purchases.filter((purchase) => purchase.status === "EMITIDA").length;
  const uniquePackages = new Set(purchases.map((purchase) => purchase.package.id)).size;
  const totalPassengers = purchases.reduce((count, purchase) => count + purchase.passengers.length, 0);
  const upcomingDepartures = purchases.filter((purchase) => new Date(purchase.package.startDate) >= new Date()).length;
  const emissionRate = totalPurchases === 0 ? 0 : Math.round((totalIssued / totalPurchases) * 100);
  const latestPurchase = purchases[0];
  const lastPurchaseDate = latestPurchase ? new Date(latestPurchase.dataCompra) : null;

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
        <section className="space-y-10">
          <header className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-8 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.12),transparent_25%)]" aria-hidden />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Painel de compras</p>
                <h1 className="text-3xl font-bold text-slate-900">Controle avançado de emissões</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  Acompanhe a fila de solicitações, priorize clientes sensíveis ao tempo e verifique a saúde das operações em tempo real. O painel foi reimaginado para reduzir retrabalho e dar clareza ao time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                    {uniquePackages} pacotes ativos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200">
                    {totalPassengers} passageiros registrados
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                    Taxa de emissão {emissionRate}%
                  </span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
                <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Solicitações registradas</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{totalPurchases}</p>
                  <p className="mt-2 text-xs text-slate-500">Inclui pedidos em qualquer estágio de emissão.</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Última atualização</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{lastPurchaseDate ? lastPurchaseDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem histórico"}</p>
                  <p className="mt-2 text-xs text-slate-500">Dados carregados diretamente do banco.</p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Emitidas</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-800">{totalIssued}</p>
                  <p className="mt-1 text-sm text-emerald-700/80">Clientes já com ticket emitido.</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-emerald-700 shadow-inner">
                  <span className="text-lg font-semibold">✔︎</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-xs font-semibold text-emerald-700 shadow-inner ring-1 ring-emerald-100">
                Taxa de emissão estável em {emissionRate}% do total.
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Aguardando</p>
                  <p className="mt-2 text-3xl font-bold text-amber-800">{totalPending}</p>
                  <p className="mt-1 text-sm text-amber-700/80">Pedidos prontos para validação e emissão.</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-amber-700 shadow-inner">
                  <span className="text-lg font-semibold">⏳</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-xs font-semibold text-amber-700 shadow-inner ring-1 ring-amber-100">
                Revise pendências críticas antes do horário limite.
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Próximas partidas</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900">{upcomingDepartures}</p>
                  <p className="mt-1 text-sm text-slate-600">Pacotes com início igual ou após hoje.</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 shadow-inner">
                  <span className="text-lg font-semibold">✈︎</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 shadow-inner ring-1 ring-blue-100">
                Organize a emissão por proximidade de embarque.
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Fila operacional</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Distribuição atual de pedidos</p>
                </div>
                <div className="flex gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">{totalIssued} emitidas</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">{totalPending} aguardando</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Taxa de emissão</p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-3xl font-bold text-slate-900">{emissionRate}%</p>
                    <p className="text-xs font-semibold text-emerald-600">{totalIssued} liberadas</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${emissionRate}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Capacidade e passageiros</p>
                  <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-800">
                    <span>{totalPassengers} passageiros</span>
                    <span>{uniquePackages} pacotes</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Use essa visão para antecipar alocações e priorizar grupos.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">Checklist rápido</p>
              <p className="mt-2 text-lg font-semibold">Ordem sugerida para reduzir gargalos</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-100/90">
                <li className="flex gap-2"><span className="mt-1 text-indigo-200">•</span> Valide pagamentos com recibo antes de emitir.</li>
                <li className="flex gap-2"><span className="mt-1 text-indigo-200">•</span> Priorize pacotes com início em até 72h.</li>
                <li className="flex gap-2"><span className="mt-1 text-indigo-200">•</span> Confirme nomes dos passageiros e datas de nascimento.</li>
                <li className="flex gap-2"><span className="mt-1 text-indigo-200">•</span> Registre observações importantes para o pós-venda.</li>
              </ul>
              <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold text-indigo-50 ring-1 ring-white/15">
                Painel atualizado {lastPurchaseDate ? lastPurchaseDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : "sem data"}. Utilize a tabela abaixo para editar rapidamente cada solicitação.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lista detalhada</p>
                <p className="text-lg font-semibold text-slate-900">Pedidos prontos para ação</p>
              </div>
              <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 sm:inline-flex">
                Interface renovada para evitar sobreposição e manter leitura estável.
              </div>
            </div>
            <AdminPurchasesTable purchases={purchases} />
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}

