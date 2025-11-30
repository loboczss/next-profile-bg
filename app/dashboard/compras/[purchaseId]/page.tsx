import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { DashboardAnimatedWrapper } from "../../dashboard-animated-wrapper";
import { DashboardShell } from "../../_components/dashboard-shell";
import { dashboardNavItems } from "../../nav-items";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { PURCHASE_STATUS_LABELS, serializePurchase, type SerializedPurchase } from "@/lib/purchases";

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function renderStatusBadge(status: SerializedPurchase["status"]) {
  const baseClass =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]";

  const colorMap = {
    AGUARDANDO_EMISSAO: "bg-amber-100 text-amber-700 border border-amber-200",
    EMITIDA: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  } as const;

  return <span className={`${baseClass} ${colorMap[status]}`}>{PURCHASE_STATUS_LABELS[status]}</span>;
}

export default async function AdminPurchaseDetailsPage({
  params,
}: {
  params: { purchaseId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  if (!prisma) {
    notFound();
  }

  const purchaseId = Number(params.purchaseId);

  if (Number.isNaN(purchaseId)) {
    notFound();
  }

  const purchaseFromDb = await prisma.purchase.findUnique({
    where: { id: purchaseId },
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
  });

  if (!purchaseFromDb) {
    notFound();
  }

  const purchase = serializePurchase(purchaseFromDb) as SerializedPurchase;
  const navItems = dashboardNavItems;
  const dashboardUserInfo = {
    name: session.user.fullName ?? session.user.name ?? session.user.username ?? "Administrador",
    role: session.user.role,
    imageUrl: session.user.image ?? null,
  };

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

  const paymentStatus = purchase.payment?.status ?? "PENDENTE";
  const paymentMethod = purchase.payment?.paymentMethod ?? "PIX";

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Compra #{purchase.id}</p>
              <h1 className="text-3xl font-bold text-slate-900">Detalhes da compra</h1>
              <p className="text-sm text-slate-600">Visualize todos os dados da venda em uma única página.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {renderStatusBadge(purchase.status)}
              <Link
                href="/dashboard/compras"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              >
                Voltar para lista
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Pacote</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{purchase.package.name}</h2>
                  <p className="text-sm text-slate-600">{purchase.package.city}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Viagem: {formatDate(purchase.package.startDate)}</p>
                  <p>Compra: {formatDate(purchase.dataCompra)}</p>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comprador</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {purchase.user?.fullName ?? purchase.user?.username ?? "Cliente"}
                  </p>
                  <p className="text-sm text-slate-600">{purchase.user?.email ?? "Sem e-mail informado"}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pagamento</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {PAYMENT_STATUS_LABELS[paymentStatus]}
                  </p>
                  <p className="text-sm text-slate-600">Método: {PAYMENT_METHOD_LABELS[paymentMethod]}</p>
                  {purchase.payment?.amount && (
                    <p className="text-sm font-semibold text-slate-800">
                      Valor: {currencyFormatter.format(purchase.payment.amount)}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Detalhes do ticket</p>
                    <h3 className="text-lg font-semibold text-slate-900">Emissão e voos</h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {purchase.ticketDetails?.locator ?? "Sem localizador"}
                  </span>
                </div>

                {purchase.ticketDetails ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">Companhia / Voo</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {purchase.ticketDetails.airline} · {purchase.ticketDetails.flightNumber}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">Tarifa</p>
                      <p className="text-sm font-semibold text-slate-900">{purchase.ticketDetails.fareType}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">Ida</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(purchase.ticketDetails.departureDate)} · {purchase.ticketDetails.outboundDepartureTime}
                        {" "}
                        → {purchase.ticketDetails.outboundArrivalTime}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">Volta</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(purchase.ticketDetails.returnDate)} · {purchase.ticketDetails.returnDepartureTime} →
                        {" "}
                        {purchase.ticketDetails.returnArrivalTime}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    Nenhum dado de emissão disponível para esta compra.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-inner">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Passageiros</p>
                    <h3 className="text-lg font-semibold text-slate-900">Lista completa</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {purchase.passengers.length} passageiros
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-700">
                    <thead className="bg-slate-50/70 text-xs uppercase tracking-[0.15em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome completo</th>
                        <th className="px-4 py-3 text-left">CPF</th>
                        <th className="px-4 py-3 text-left">Nascimento</th>
                        <th className="px-4 py-3 text-left">Contato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {purchase.passengers.map((passenger) => (
                        <tr key={passenger.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{passenger.fullName}</td>
                          <td className="px-4 py-3">{passenger.cpf}</td>
                          <td className="px-4 py-3">{formatDate(passenger.birthDate)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span>{passenger.email}</span>
                              <span className="text-slate-500">{passenger.phone}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Resumo</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Pacote</span>
                    <span className="font-semibold text-slate-900">{purchase.package.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data da viagem</span>
                    <span className="font-semibold text-slate-900">{formatDate(purchase.package.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pagamento</span>
                    <span className="font-semibold text-slate-900">{PAYMENT_STATUS_LABELS[paymentStatus]}</span>
                  </div>
                  {purchase.payment?.amount && (
                    <div className="flex items-center justify-between">
                      <span>Valor</span>
                      <span className="font-semibold text-slate-900">
                        {currencyFormatter.format(purchase.payment.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Status</p>
                <p className="mt-2 text-lg font-semibold text-blue-900">{PURCHASE_STATUS_LABELS[purchase.status]}</p>
                <p className="text-sm text-blue-800/80">Dados sincronizados diretamente do pedido.</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sobre esta página</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use esta visualização dedicada para compartilhar ou imprimir os dados completos da compra.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
