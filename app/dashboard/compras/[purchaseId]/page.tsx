import type React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, FileText, Plane, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { PURCHASE_STATUS_LABELS, type PurchaseStatusValue, serializePurchase } from "@/lib/purchases";
import { cn } from "@/lib/utils";
import { DashboardAnimatedWrapper } from "../../dashboard-animated-wrapper";
import { DashboardShell } from "../../_components/dashboard-shell";
import { dashboardNavItems } from "../../nav-items";

const STATUS_STYLES: Record<PurchaseStatusValue, string> = {
  AGUARDANDO_EMISSAO: "bg-amber-100 text-amber-800 ring-amber-200",
  EMITIDA: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const STATUS_ICONS: Record<PurchaseStatusValue, React.ReactNode> = {
  AGUARDANDO_EMISSAO: <Clock3 className="h-4 w-4" />,
  EMITIDA: <CheckCircle2 className="h-4 w-4" />,
};

function StatusBadge({ status }: { status: PurchaseStatusValue }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_ICONS[status]}
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  );
}

export default async function PurchaseDetailsPage({
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
            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-amber-900 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Painel de compras</p>
              <h1 className="mt-3 text-2xl font-bold text-amber-900">Gestão de compras indisponível</h1>
              <p className="mt-2 text-sm leading-relaxed text-amber-800/90">
                Não foi possível se conectar ao banco de dados. Configure a variável <code>DATABASE_URL</code> e tente novamente.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
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

  const purchase = serializePurchase(purchaseFromDb);

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

  const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "Cliente";
  const buyerEmail = purchase.user?.email ?? "—";

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Compra #{purchase.id}</p>
              <h1 className="text-3xl font-bold text-slate-900">{purchase.package.name}</h1>
              <p className="text-sm text-slate-600">
                {buyerName} · <span className="text-slate-500">{buyerEmail}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={purchase.status} />
              <Button asChild variant="outline">
                <Link href="/dashboard/compras" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para lista
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Resumo da compra</p>
                    <h2 className="text-lg font-semibold text-slate-900">Informações principais</h2>
                  </div>
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Data da compra</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {dateFormatter.format(new Date(purchase.dataCompra))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Data da viagem</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {dateFormatter.format(new Date(purchase.package.startDate))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Pacote</p>
                    <p className="text-sm font-semibold text-slate-900">{purchase.package.city}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Quantidade de passageiros</p>
                    <p className="text-sm font-semibold text-slate-900">{purchase.seatCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Passageiros</p>
                    <h2 className="text-lg font-semibold text-slate-900">Dados cadastrados</h2>
                  </div>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-4 space-y-3">
                  {purchase.passengers.length === 0 ? (
                    <p className="text-sm text-slate-600">Nenhum passageiro informado.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                      {purchase.passengers.map((passenger) => (
                        <li key={passenger.id} className="grid gap-2 px-4 py-3 md:grid-cols-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{passenger.fullName}</p>
                            <p className="text-xs text-slate-500">CPF: {passenger.cpf}</p>
                          </div>
                          <div className="text-sm text-slate-700">
                            <p>Nascimento: {dateFormatter.format(new Date(passenger.birthDate))}</p>
                            <p>Telefone: {passenger.phone}</p>
                          </div>
                          <p className="text-sm text-slate-700">{passenger.email}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Observações</p>
                    <h2 className="text-lg font-semibold text-slate-900">Informações adicionais</h2>
                  </div>
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                  {purchase.observacao?.trim() ? purchase.observacao : "Nenhuma observação registrada."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Pagamento</p>
                    <h2 className="text-lg font-semibold text-slate-900">Status financeiro</h2>
                  </div>
                  <Plane className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-900">Status</span>
                    <span className="text-slate-800">
                      {purchase.payment ? PAYMENT_STATUS_LABELS[purchase.payment.status] : "Não informado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-900">Método</span>
                    <span className="text-slate-800">
                      {purchase.payment ? PAYMENT_METHOD_LABELS[purchase.payment.method] : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-900">Valor</span>
                    <span className="text-slate-800">
                      {purchase.payment ? currencyFormatter.format(purchase.payment.amount) : "—"}
                    </span>
                  </div>
                  {purchase.payment?.externalReference && (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-900">Referência</span>
                      <span className="text-slate-800">{purchase.payment.externalReference}</span>
                    </div>
                  )}
                  {purchase.payment?.receiptUrl && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-900">Comprovante</p>
                      <Link
                        href={purchase.payment.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                      >
                        Abrir comprovante
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Bilhete</p>
                    <h2 className="text-lg font-semibold text-slate-900">Dados de emissão</h2>
                  </div>
                  <Plane className="h-5 w-5 text-slate-400" />
                </div>
                {purchase.ticketDetails ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="grid gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Localizador</p>
                        <p className="font-semibold text-slate-900">{purchase.ticketDetails.locator}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Companhia / Voo</p>
                        <p className="font-semibold text-slate-900">
                          {purchase.ticketDetails.airline} {purchase.ticketDetails.flightNumber}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Ida</p>
                        <p className="font-semibold text-slate-900">
                          {dateFormatter.format(new Date(purchase.ticketDetails.departureDate))} · {purchase.ticketDetails.outboundDepartureTime} - {purchase.ticketDetails.outboundArrivalTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Volta</p>
                        <p className="font-semibold text-slate-900">
                          {dateFormatter.format(new Date(purchase.ticketDetails.returnDate))} · {purchase.ticketDetails.returnDepartureTime} - {purchase.ticketDetails.returnArrivalTime}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">Tarifa</p>
                      <p className="font-semibold text-slate-900">{purchase.ticketDetails.fareType}</p>
                      <p className="mt-2 text-xs text-slate-500">Passageiros</p>
                      <p className="text-sm font-semibold text-slate-900">{purchase.ticketDetails.passengerNames.join(", ")}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Nenhum dado de emissão registrado para esta compra.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
