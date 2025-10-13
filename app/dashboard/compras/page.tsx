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
          <section className="space-y-6">
            <div className="rounded-3xl border border-amber-200/70 bg-amber-50/80 p-8 text-amber-900 shadow-lg">
              <h1 className="text-2xl font-semibold">Gestão de compras indisponível</h1>
              <p className="mt-3 text-sm">
                Não foi possível se conectar ao banco de dados. Configure a variável <code>DATABASE_URL</code> e tente novamente.
              </p>
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
    },
    orderBy: { dataCompra: "desc" },
  });

  const purchases: SerializedPurchase[] = purchasesFromDb.map(serializePurchase);

  const totalPurchases = purchases.length;
  const totalPending = purchases.filter((purchase) => purchase.status === "AGUARDANDO_EMISSAO").length;
  const totalIssued = purchases.filter((purchase) => purchase.status === "EMITIDA").length;

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
        <section className="space-y-10">
          <header className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Administração de compras</p>
                <h1 className="text-3xl font-bold text-slate-900">Monitoramento de pacotes vendidos</h1>
                <p className="text-sm text-slate-600">
                  Acompanhe o progresso das solicitações, atualize o status de emissão e registre observações importantes para o atendimento ao cliente.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{totalPurchases}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Aguardando</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{totalPending}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Emitidas</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">{totalIssued}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            <AdminPurchasesTable purchases={purchases} />
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}

