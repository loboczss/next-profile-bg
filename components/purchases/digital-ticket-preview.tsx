"use client";

import { useMemo } from "react";
import { Eye, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SerializedPurchase } from "@/lib/purchases";

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "Não informado";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", options ?? {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPrintableHtml({
  purchase,
  reservationInfo,
  passengers,
  itinerary,
  rules,
}: {
  purchase: SerializedPurchase;
  reservationInfo: { label: string; value: string }[];
  passengers: { name: string; email?: string; document?: string }[];
  itinerary: { origin: string; connections: string; destination: string; period: string };
  rules: { title: string; description: string; bullets: string[] }[];
}) {
  const passengerItems = passengers
    .map(
      (passenger) => `
      <li class="passenger-item">
        <strong>${escapeHtml(passenger.name)}</strong>
        <span>${escapeHtml(passenger.document ?? "")}${passenger.document && passenger.email ? " • " : ""}${escapeHtml(
          passenger.email ?? ""
        )}</span>
      </li>
    `
    )
    .join("");

  const reservationItems = reservationInfo
    .map(
      (item) => `
      <div class="info-card">
        <p class="label">${escapeHtml(item.label)}</p>
        <p class="value">${escapeHtml(item.value)}</p>
      </div>
    `
    )
    .join("");

  const ruleItems = rules
    .map(
      (rule) => `
      <section class="rule">
        <h3>${escapeHtml(rule.title)}</h3>
        <p>${escapeHtml(rule.description)}</p>
        <ul>
          ${rule.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
      </section>
    `
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Passagem digital - ${escapeHtml(purchase.package.name)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        padding: 32px;
        background: #f4f7fb;
        color: #0f172a;
      }
      .ticket-wrapper {
        max-width: 960px;
        margin: 0 auto;
        background: #fff;
        border-radius: 32px;
        padding: 40px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
        font-size: 28px;
      }
      h2 {
        font-size: 18px;
        margin-bottom: 16px;
      }
      .section {
        margin-top: 32px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .info-card {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
        background: #f8fafc;
      }
      .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #64748b;
        margin-bottom: 6px;
      }
      .value {
        font-size: 15px;
        font-weight: 600;
      }
      .passenger-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
      }
      .passenger-item {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 14px 18px;
        background: #fff;
      }
      .passenger-item span {
        display: block;
        font-size: 13px;
        color: #475569;
        margin-top: 4px;
      }
      .itinerary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .itinerary-card {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
        background: #f8fafc;
      }
      .rule {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
        margin-top: 16px;
        background: #fff;
      }
      .rule ul {
        margin-top: 12px;
        padding-left: 20px;
      }
      .rule li {
        margin-bottom: 6px;
        color: #334155;
      }
      @media print {
        body {
          padding: 0;
          background: #fff;
        }
        .ticket-wrapper {
          border: none;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <article class="ticket-wrapper">
      <header>
        <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 11px; color: #6366f1;">Passagem digital</p>
        <h1>${escapeHtml(purchase.package.name)}</h1>
        <p style="color:#475569; font-size: 14px;">${escapeHtml(purchase.package.city)} • Localizador ${escapeHtml(
    reservationInfo[0]?.value ?? ""
  )}</p>
      </header>
      <section class="section">
        <h2>Dados da reserva</h2>
        <div class="info-grid">
          ${reservationItems}
        </div>
      </section>
      <section class="section">
        <h2>Lista de passageiros</h2>
        <ul class="passenger-list">
          ${passengerItems || "<li class=\"passenger-item\">Nenhum passageiro cadastrado.</li>"}
        </ul>
      </section>
      <section class="section">
        <h2>Itinerário</h2>
        <div class="itinerary-grid">
          <div class="itinerary-card"><p class="label">Origem</p><p class="value">${escapeHtml(itinerary.origin)}</p></div>
          <div class="itinerary-card"><p class="label">Conexões</p><p class="value">${escapeHtml(itinerary.connections)}</p></div>
          <div class="itinerary-card"><p class="label">Destino final</p><p class="value">${escapeHtml(itinerary.destination)}</p></div>
          <div class="itinerary-card" style="grid-column: 1 / -1"><p class="label">Período</p><p class="value">${escapeHtml(
            itinerary.period
          )}</p></div>
        </div>
      </section>
      <section class="section">
        <h2>Regras da tarifa e informações úteis</h2>
        ${ruleItems}
      </section>
    </article>
  </body>
</html>`;
}

export function DigitalTicketPreview({ purchase }: { purchase: SerializedPurchase }) {
  const ticketDetails = purchase.ticketDetails;
  const reservationInfo = useMemo(
    () => [
      { label: "Localizador", value: ticketDetails?.locator || "Aguardando confirmação" },
      { label: "Companhia aérea", value: ticketDetails?.airline || "A confirmar" },
      { label: "Número do voo", value: ticketDetails?.flightNumber || "Não informado" },
      {
        label: "Ida",
        value: ticketDetails
          ? `${formatDate(ticketDetails.departureDate)} • Embarque ${ticketDetails.outboundDepartureTime || "—"} • Chegada ${ticketDetails.outboundArrivalTime || "—"}`
          : "Dados indisponíveis",
      },
      {
        label: "Volta",
        value: ticketDetails
          ? `${formatDate(ticketDetails.returnDate)} • Embarque ${ticketDetails.returnDepartureTime || "—"} • Chegada ${ticketDetails.returnArrivalTime || "—"}`
          : "Dados indisponíveis",
      },
    ],
    [ticketDetails]
  );

  const passengerEntries = useMemo(
    () =>
      purchase.passengers.map((passenger) => ({
        id: passenger.id,
        name: passenger.fullName,
        email: passenger.email,
        document: `CPF: ${passenger.cpf}`,
      })),
    [purchase.passengers]
  );

  const itinerary = useMemo(
    () => ({
      origin: purchase.package.departureLocation ?? "A definir",
      connections: ticketDetails?.fareType
        ? `Tarifa ${ticketDetails.fareType} • consulte escala no check-in`
        : "Conexões não informadas",
      destination: purchase.package.city ?? purchase.package.name,
      period: `${formatDate(purchase.package.startDate)} até ${formatDate(purchase.package.endDate)}`,
    }),
    [
      purchase.package.departureLocation,
      purchase.package.city,
      purchase.package.name,
      purchase.package.startDate,
      purchase.package.endDate,
      ticketDetails,
    ]
  );

  const rules = useMemo(
    () => [
      {
        title: "Bagagem (Mão e Despachada)",
        description:
          "Confira sua franquia antes do embarque. Recomenda-se chegar ao aeroporto com antecedência para despacho de volumes.",
        bullets: [
          "1 bagagem de mão de até 10 kg por passageiro",
          "1 bagagem despachada de até 23 kg incluída nesta tarifa",
          "Excesso de peso ou peças adicionais podem gerar custos extras no balcão",
        ],
      },
      {
        title: "Remarcação",
        description: `Alterações seguem as regras da ${ticketDetails?.fareType ?? "tarifa padrão"}.`,
        bullets: [
          "Requisições devem ser feitas com no mínimo 48h de antecedência",
          "Sujeito à disponibilidade de assentos e eventuais diferenças tarifárias",
          "Taxa administrativa fixa de R$ 180,00 por passageiro",
        ],
      },
      {
        title: "Cancelamento",
        description: "Cancelamentos podem ser solicitados até 24h antes do embarque inicial.",
        bullets: [
          "Aplicável multa de 20% do valor do bilhete",
          "Após o horário de embarque, o bilhete é considerado no-show",
          "Valores promocionais podem ter condições adicionais",
        ],
      },
      {
        title: "Reembolso",
        description: "Após validação, o reembolso será efetuado no mesmo meio de pagamento utilizado na compra.",
        bullets: [
          "Prazo médio de processamento: até 10 dias úteis",
          "Pagamentos no cartão retornam como estorno na fatura",
          "Pagamentos via PIX ou boleto são creditados em conta informada pelo cliente",
        ],
      },
    ],
    [ticketDetails]
  );

  const printContent = useMemo(
    () =>
      buildPrintableHtml({
        purchase,
        reservationInfo,
        passengers: passengerEntries,
        itinerary,
        rules,
      }),
    [purchase, reservationInfo, passengerEntries, itinerary, rules]
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!printWindow) {
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-500 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30">
          <Eye className="size-4" /> Ver Detalhes e Imprimir Passagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="gap-2 text-left">
          <DialogTitle>Passagem digital — {purchase.package.name}</DialogTitle>
          <DialogDescription>
            Visualize todas as informações da reserva e gere uma cópia pronta para impressão quando precisar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-slate-800">
            <Printer className="size-4" /> Imprimir
          </Button>
        </div>

        <div className="space-y-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-700">
          <section className="space-y-3">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Dados da reserva</p>
              <h3 className="text-xl font-semibold text-slate-900">Resumo do bilhete</h3>
            </header>
            <dl className="grid gap-4 md:grid-cols-2">
              {reservationInfo.map((info) => (
                <div key={info.label} className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{info.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">{info.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-3">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Lista de passageiros</p>
              <h3 className="text-xl font-semibold text-slate-900">Quem embarca</h3>
            </header>
            {passengerEntries.length > 0 ? (
              <ul className="grid gap-3">
                {passengerEntries.map((passenger) => (
                  <li key={passenger.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <p className="text-base font-semibold text-slate-900">{passenger.name}</p>
                    <p className="text-xs text-slate-500">{passenger.document}</p>
                    {passenger.email ? (
                      <p className="text-xs text-slate-500">{passenger.email}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Nenhum passageiro cadastrado até o momento.</p>
            )}
          </section>

          <section className="space-y-3">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Itinerário</p>
              <h3 className="text-xl font-semibold text-slate-900">Detalhes do trajeto</h3>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              {[{ label: "Origem", value: itinerary.origin }, { label: "Conexões", value: itinerary.connections }, { label: "Destino final", value: itinerary.destination }].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600">Período</p>
              <p className="mt-1 text-base font-semibold text-emerald-800">{itinerary.period}</p>
            </div>
          </section>

          <section className="space-y-3">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Regras da tarifa e informações úteis</p>
              <h3 className="text-xl font-semibold text-slate-900">Antes de embarcar</h3>
            </header>
            <div className="space-y-4">
              {rules.map((rule) => (
                <article key={rule.title} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <h4 className="text-base font-semibold text-slate-900">{rule.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">{rule.description}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {rule.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

