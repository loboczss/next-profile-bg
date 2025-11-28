"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock3, Filter, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PURCHASE_STATUS_LABELS,
  type PurchaseStatusValue,
  type SerializedPurchase,
  type TicketDetails,
} from "@/lib/purchases";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type PaymentStatusValue } from "@/lib/payments";
import { cn } from "@/lib/utils";

interface AdminPurchasesTableProps {
  purchases: SerializedPurchase[];
}

type PassengerDraft = {
  id: number;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};

type FiltersState = {
  search: string;
  status: PurchaseStatusValue | "ALL" | "CANCELADA";
  packageId: number | "all";
  startDate: string;
  endDate: string;
};

type EmissionDraft = {
  locator: string;
  airline: string;
  fareType: string;
  flightNumber: string;
  departureDate: string;
  outboundDepartureTime: string;
  outboundArrivalTime: string;
  returnDate: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
};

const emptyEmission: EmissionDraft = {
  locator: "",
  airline: "",
  fareType: "",
  flightNumber: "",
  departureDate: "",
  outboundDepartureTime: "",
  outboundArrivalTime: "",
  returnDate: "",
  returnDepartureTime: "",
  returnArrivalTime: "",
};

function formatDateToInput(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function createEmissionDraftFromTicket(ticketDetails: TicketDetails | null): EmissionDraft {
  if (!ticketDetails) return emptyEmission;

  return {
    locator: ticketDetails.locator,
    airline: ticketDetails.airline,
    fareType: ticketDetails.fareType,
    flightNumber: ticketDetails.flightNumber,
    departureDate: formatDateToInput(ticketDetails.departureDate),
    outboundDepartureTime: ticketDetails.outboundDepartureTime,
    outboundArrivalTime: ticketDetails.outboundArrivalTime,
    returnDate: formatDateToInput(ticketDetails.returnDate),
    returnDepartureTime: ticketDetails.returnDepartureTime,
    returnArrivalTime: ticketDetails.returnArrivalTime,
  };
}

function createPassengerDrafts(passengers: SerializedPurchase["passengers"]): PassengerDraft[] {
  return passengers.map((passenger) => ({
    id: passenger.id,
    fullName: passenger.fullName,
    cpf: passenger.cpf,
    birthDate: formatDateToInput(passenger.birthDate),
    phone: passenger.phone,
    email: passenger.email,
  }));
}

const STATUS_BADGE: Record<PurchaseStatusValue | "CANCELADA", string> = {
  AGUARDANDO_EMISSAO: "bg-amber-100 text-amber-700 border border-amber-200",
  EMITIDA: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  CANCELADA: "bg-rose-100 text-rose-700 border border-rose-200",
};

const FILTER_PRESET: FiltersState = {
  search: "",
  status: "ALL",
  packageId: "all",
  startDate: "",
  endDate: "",
};

export function AdminPurchasesTable({ purchases }: AdminPurchasesTableProps) {
  const [purchaseList, setPurchaseList] = useState<SerializedPurchase[]>(purchases);
  const [filters, setFilters] = useState<FiltersState>(FILTER_PRESET);
  const [draftFilters, setDraftFilters] = useState<FiltersState>(FILTER_PRESET);
  const [selectedPurchase, setSelectedPurchase] = useState<SerializedPurchase | null>(null);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(null);
  const [emissionDraft, setEmissionDraft] = useState<EmissionDraft>(emptyEmission);
  const [passengerDrafts, setPassengerDrafts] = useState<PassengerDraft[]>([]);
  const [statusDraft, setStatusDraft] = useState<PurchaseStatusValue | "CANCELADA">("AGUARDANDO_EMISSAO");
  const [statusPreset, setStatusPreset] = useState<PurchaseStatusValue | null>(null);
  const [saving, setSaving] = useState(false);

  const packagesOptions = useMemo(() => {
    const unique = new Map<number, string>();

    purchaseList.forEach((purchase) => {
      unique.set(purchase.package.id, purchase.package.name);
    });

    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [purchaseList]);

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((purchase) => {
      const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "";
      const buyerEmail = purchase.user?.email ?? "";
      const packageMatch =
        filters.packageId === "all" ? true : Number(filters.packageId) === purchase.package.id;
      const searchMatch =
        filters.search.trim().length === 0
          ? true
          : `${buyerName} ${buyerEmail}`
              .toLowerCase()
              .includes(filters.search.trim().toLowerCase());

      const statusMatch =
        filters.status === "ALL"
          ? true
          : filters.status === "CANCELADA"
            ? false
            : purchase.status === filters.status;

      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      const travelDate = new Date(purchase.package.startDate);

      const dateMatch =
        !startDate && !endDate
          ? true
          : startDate && endDate
            ? travelDate >= startDate && travelDate <= endDate
            : startDate
              ? travelDate >= startDate
              : travelDate <= (endDate as Date);

      return packageMatch && searchMatch && statusMatch && dateMatch;
    });
  }, [filters, purchaseList]);

  useEffect(() => {
    setPurchaseList(purchases);
  }, [purchases]);

  useEffect(() => {
    if (!expandedPurchaseId) return;

    const updated = purchaseList.find((purchase) => purchase.id === expandedPurchaseId);
    if (updated) {
      setSelectedPurchase(updated);
    }
  }, [expandedPurchaseId, purchaseList]);

  useEffect(() => {
    if (!selectedPurchase) return;

    setEmissionDraft(createEmissionDraftFromTicket(selectedPurchase.ticketDetails));
    setPassengerDrafts(createPassengerDrafts(selectedPurchase.passengers));
    setStatusDraft(statusPreset ?? selectedPurchase.status);
    setStatusPreset(null);
  }, [selectedPurchase, statusPreset]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }),
    []
  );

  const handleApplyFilters = () => {
    setFilters(draftFilters);
  };

  const handleClearFilters = () => {
    setDraftFilters(FILTER_PRESET);
    setFilters(FILTER_PRESET);
  };

  const handleToggleExpand = (purchase: SerializedPurchase) => {
    const isSamePurchase = expandedPurchaseId === purchase.id;

    if (isSamePurchase) {
      setExpandedPurchaseId(null);
      setSelectedPurchase(null);
      return;
    }

    setExpandedPurchaseId(purchase.id);
    setSelectedPurchase(purchase);
    setStatusPreset(null);
  };

  const updatePurchaseLocally = (updated: SerializedPurchase) => {
    setPurchaseList((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedPurchase(updated);
  };

  const buildTicketDetailsPayload = (): TicketDetails => {
    return {
      locator: emissionDraft.locator.trim(),
      airline: emissionDraft.airline.trim(),
      fareType: emissionDraft.fareType.trim(),
      flightNumber: emissionDraft.flightNumber.trim(),
      departureDate: emissionDraft.departureDate,
      returnDate: emissionDraft.returnDate,
      outboundDepartureTime: emissionDraft.outboundDepartureTime,
      outboundArrivalTime: emissionDraft.outboundArrivalTime,
      returnDepartureTime: emissionDraft.returnDepartureTime,
      returnArrivalTime: emissionDraft.returnArrivalTime,
      passengerNames: passengerDrafts.map((passenger) => passenger.fullName.trim()).filter(Boolean),
    };
  };

  const isEmissionComplete = () => {
    const details = buildTicketDetailsPayload();
    return (
      !!details.locator &&
      !!details.airline &&
      !!details.fareType &&
      !!details.flightNumber &&
      !!details.departureDate &&
      !!details.returnDate &&
      !!details.outboundDepartureTime &&
      !!details.outboundArrivalTime &&
      !!details.returnDepartureTime &&
      !!details.returnArrivalTime &&
      details.passengerNames.length > 0
    );
  };

  const sendUpdate = async (
    purchaseId: number,
    payload: Partial<{
      status: PurchaseStatusValue;
      ticketDetails: TicketDetails;
      passengers: PassengerDraft[];
    }>,
    successMessage = "Dados atualizados com sucesso"
  ) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          passengers: payload.passengers?.map((passenger) => ({
            id: passenger.id,
            fullName: passenger.fullName.trim(),
            cpf: passenger.cpf.trim(),
            birthDate: passenger.birthDate,
            phone: passenger.phone.trim(),
            email: passenger.email.trim(),
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as { purchase?: SerializedPurchase; message?: string } | null;

      if (!response.ok) {
        toast.error(data?.message ?? "Não foi possível salvar.");
        return;
      }

      if (data?.purchase) {
        updatePurchaseLocally(data.purchase);
      }

      toast.success(data?.message ?? successMessage);
    } catch (error) {
      console.error("Erro ao atualizar compra", error);
      toast.error("Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmission = () => {
    if (!selectedPurchase) return;
    if (!isEmissionComplete()) {
      toast.error("Preencha todos os campos obrigatórios para emissão.");
      return;
    }

    sendUpdate(selectedPurchase.id, { ticketDetails: buildTicketDetailsPayload() }, "Dados para emissão salvos");
  };

  const handleSavePassengers = () => {
    if (!selectedPurchase) return;
    sendUpdate(selectedPurchase.id, { passengers: passengerDrafts }, "Passageiros atualizados");
  };

  const handleSaveAll = () => {
    if (!selectedPurchase) return;
    if (statusDraft === "EMITIDA" && !isEmissionComplete()) {
      toast.error("Para emitir, complete os dados obrigatórios.");
      return;
    }

    const payload: {
      status?: PurchaseStatusValue;
      ticketDetails?: TicketDetails;
      passengers?: PassengerDraft[];
    } = {};

    if (statusDraft !== selectedPurchase.status && statusDraft !== "CANCELADA") {
      payload.status = statusDraft;
    }

    if (isEmissionComplete()) {
      payload.ticketDetails = buildTicketDetailsPayload();
    }

    if (passengerDrafts.length > 0) {
      payload.passengers = passengerDrafts;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    sendUpdate(selectedPurchase.id, payload, "Alterações salvas");
  };

  const handleMarkAsIssued = () => {
    if (!selectedPurchase) return;
    if (!isEmissionComplete()) {
      toast.error("Preencha os dados obrigatórios antes de marcar como emitido.");
      return;
    }
    setStatusDraft("EMITIDA");
    sendUpdate(selectedPurchase.id, {
      status: "EMITIDA",
      ticketDetails: buildTicketDetailsPayload(),
    }, "Compra marcada como emitida");
  };

  const handleCancel = () => {
    toast.warning("Fluxo de cancelamento não disponível neste ambiente.");
  };

  const addPassenger = () => {
    const nextId = Math.max(0, ...passengerDrafts.map((p) => p.id)) + 1;
    setPassengerDrafts((previous) => [
      ...previous,
      { id: nextId, fullName: "", cpf: "", birthDate: "", phone: "", email: "" },
    ]);
  };

  const removePassenger = (id: number) => {
    setPassengerDrafts((previous) => previous.filter((passenger) => passenger.id !== id));
  };

  const updatePassengerField = (id: number, field: keyof PassengerDraft, value: string) => {
    setPassengerDrafts((previous) =>
      previous.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger))
    );
  };

  const renderStatusBadge = (status: PurchaseStatusValue | "CANCELADA") => {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
          STATUS_BADGE[status]
        )}
      >
        {status === "EMITIDA" && <CheckCircle2 className="h-4 w-4" />}
        {status === "AGUARDANDO_EMISSAO" && <Clock3 className="h-4 w-4" />}
        {status === "CANCELADA" && <XCircle className="h-4 w-4" />}
        {status === "CANCELADA" ? "Cancelada" : PURCHASE_STATUS_LABELS[status]}
      </span>
    );
  };

  const activeEmpty = filteredPurchases.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Filtros</p>
            <h2 className="text-xl font-semibold text-slate-900">Refine a visualização</h2>
          </div>
          <Filter className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Busca</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 shadow-inner">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="border-0 focus-visible:ring-0"
                placeholder="Nome ou e-mail do comprador"
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Status</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, status: event.target.value as FiltersState["status"] }))
              }
            >
              <option value="ALL">Todos</option>
              <option value="AGUARDANDO_EMISSAO">Aguardando emissão</option>
              <option value="EMITIDA">Emitido</option>
              <option value="CANCELADA">Cancelado</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Pacote</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner"
              value={draftFilters.packageId}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, packageId: event.target.value === "all" ? "all" : Number(event.target.value) }))
              }
            >
              <option value="all">Todos os pacotes</option>
              {packagesOptions.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Data inicial</label>
            <Input
              type="date"
              className="mt-2"
              value={draftFilters.startDate}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Data final</label>
            <Input
              type="date"
              className="mt-2"
              value={draftFilters.endDate}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={handleApplyFilters} disabled={saving}>
            Aplicar filtros
          </Button>
          <button className="text-sm font-semibold text-slate-600 underline" onClick={handleClearFilters} disabled={saving}>
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lista de compras</p>
            <h2 className="text-xl font-semibold text-slate-900">Pacotes vendidos</h2>
          </div>
          <span className="text-sm text-slate-500">{filteredPurchases.length} compras</span>
        </div>
        {activeEmpty ? (
          <div className="p-10 text-center text-slate-600">
            Nenhuma compra encontrada com os filtros atuais.
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-slate-100">
              {filteredPurchases.map((purchase) => {
                const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "Cliente";
                const buyerEmail = purchase.user?.email ?? "—";
                const travelDate = dateFormatter.format(new Date(purchase.package.startDate));
                const createdAt = dateFormatter.format(new Date(purchase.dataCompra));
                const paymentStatus = (purchase.payment?.status ?? "PENDENTE") as PaymentStatusValue;
                const canIssue = purchase.status !== "EMITIDA";
                const isExpanded = expandedPurchaseId === purchase.id;
                const isCurrentSelection = selectedPurchase?.id === purchase.id;

                return (
                  <li
                    key={purchase.id}
                    className={cn(
                      "flex flex-col gap-3 px-6 py-5 transition-colors lg:flex-row lg:items-center lg:justify-between",
                      isExpanded ? "bg-slate-50/80" : ""
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <Image
                          src={purchase.package.coverPhoto ?? "/placeholder.jpg"}
                          alt={purchase.package.name}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{purchase.package.name}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {purchase.package.city}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {buyerName} · <span className="text-slate-500">{buyerEmail}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>Viagem: {travelDate}</span>
                          <span>Compra: {createdAt}</span>
                          <span>Status pagamento: {PAYMENT_STATUS_LABELS[paymentStatus]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      {renderStatusBadge(purchase.status)}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleToggleExpand(purchase)}>
                          {isExpanded ? "Recolher" : "Detalhes"}
                        </Button>
                        {canIssue && (
                          <Button
                            variant="default"
                            onClick={() => {
                              setStatusPreset("EMITIDA");
                              if (!isExpanded) {
                                handleToggleExpand(purchase);
                              }
                              toast.message("Prepare os dados de emissão antes de confirmar.");
                            }}
                          >
                            Marcar como emitido
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && isCurrentSelection && selectedPurchase && (
                      <div className="mt-4 w-full rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                              Detalhes da compra
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {selectedPurchase.package.name}
                            </h3>
                            <p className="text-sm text-slate-600">Código #{selectedPurchase.id}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleExpand(purchase)}>
                            Fechar painel
                          </Button>
                        </div>

                        <div className="mt-6 space-y-6">
                          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.9fr]">
                            {/* COLUNA 1 – DADOS GERAIS + PASSAGEIROS */}
                            <div className="space-y-5">
                              <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                      Dados da compra
                                    </p>
                                    <h4 className="text-lg font-semibold text-slate-900">
                                      Informações gerais
                                    </h4>
                                  </div>
                                  <span className="text-xs font-medium text-slate-600">
                                    {dateFormatter.format(new Date(selectedPurchase.dataCompra))}
                                  </span>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Status atual</p>
                                    <div className="mt-1">{renderStatusBadge(selectedPurchase.status)}</div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Trechos</p>
                                    <p className="font-semibold text-slate-900">Ida e volta</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Companhia / Voo</p>
                                    <p className="font-semibold text-slate-900">
                                      {selectedPurchase.ticketDetails?.airline ?? "—"}{" "}
                                      {selectedPurchase.ticketDetails?.flightNumber ? selectedPurchase.ticketDetails.flightNumber : ""}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Observações</p>
                                    <p className="text-sm text-slate-700">
                                      {selectedPurchase.observacao || "Nenhuma observação registrada."}
                                    </p>
                                  </div>
                                </div>
                                <hr className="my-4 border-slate-200" />
                                <div className="grid gap-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Cliente</p>
                                  <div className="rounded-xl border border-white/60 bg-white/80 p-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedPurchase.user?.fullName ?? selectedPurchase.user?.username ?? "Cliente"}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {selectedPurchase.user?.email ?? "E-mail não informado"}
                                    </p>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                      Passageiros vinculados
                                    </p>
                                    <h4 className="text-lg font-semibold text-slate-900">Dados dos viajantes</h4>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={addPassenger}>
                                      Adicionar passageiro
                                    </Button>
                                    <Button onClick={handleSavePassengers} disabled={saving}>
                                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar passageiros"}
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-4 space-y-4">
                                  {passengerDrafts.map((passenger) => (
                                    <div
                                      key={passenger.id}
                                      className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner"
                                    >
                                      <div className="flex flex-wrap justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-800">Passageiro</p>
                                        <button className="text-xs font-semibold text-rose-600" onClick={() => removePassenger(passenger.id)}>
                                          Remover
                                        </button>
                                      </div>
                                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        <Input
                                          placeholder="Nome completo"
                                          value={passenger.fullName}
                                          onChange={(event) => updatePassengerField(passenger.id, "fullName", event.target.value)}
                                        />
                                        <Input
                                          placeholder="CPF"
                                          value={passenger.cpf}
                                          onChange={(event) => updatePassengerField(passenger.id, "cpf", event.target.value)}
                                        />
                                        <Input
                                          type="date"
                                          placeholder="Data de nascimento"
                                          value={passenger.birthDate}
                                          onChange={(event) => updatePassengerField(passenger.id, "birthDate", event.target.value)}
                                        />
                                        <Input
                                          placeholder="Telefone"
                                          value={passenger.phone}
                                          onChange={(event) => updatePassengerField(passenger.id, "phone", event.target.value)}
                                        />
                                        <Input
                                          placeholder="E-mail"
                                          value={passenger.email}
                                          onChange={(event) => updatePassengerField(passenger.id, "email", event.target.value)}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  {passengerDrafts.length === 0 && <p className="text-sm text-slate-600">Nenhum passageiro vinculado ainda.</p>}
                                </div>
                              </section>
                            </div>

                            {/* COLUNA 2 – AÇÕES + PAGAMENTO */}
                            <div className="space-y-5">
                              <section className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700">
                                      Ações do pedido
                                    </p>
                                    <h4 className="text-lg font-semibold text-slate-900">Controle rápido</h4>
                                  </div>
                                  <Button onClick={handleMarkAsIssued} disabled={saving || selectedPurchase.status === "EMITIDA"}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marcar como emitido"}
                                  </Button>
                                </div>
                                <hr className="my-4 border-amber-200" />
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <label className="text-sm font-semibold text-slate-700" htmlFor={`status-${selectedPurchase.id}`}>
                                      Status do pedido
                                    </label>
                                    <select
                                      id={`status-${selectedPurchase.id}`}
                                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner"
                                      value={statusDraft}
                                      onChange={(event) => setStatusDraft(event.target.value as typeof statusDraft)}
                                    >
                                      <option value="AGUARDANDO_EMISSAO">Aguardando emissão</option>
                                      <option value="EMITIDA">Emitida</option>
                                    </select>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={handleCancel}>
                                      Cancelar compra
                                    </Button>
                                    <Button variant="secondary" onClick={handleSaveAll} disabled={saving}>
                                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar todas as alterações"}
                                    </Button>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Pagamento</p>
                                    <h4 className="text-lg font-semibold text-slate-900">Resumo financeiro</h4>
                                  </div>
                                  <span className="text-xs font-medium text-slate-600">Identificador</span>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Meio de pagamento</p>
                                    <p className="text-base font-semibold text-slate-900">
                                      {selectedPurchase.payment ? PAYMENT_METHOD_LABELS[selectedPurchase.payment.method] : "Não registrado"}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Status do pagamento</p>
                                    <p className="text-base font-semibold text-slate-900">
                                      {PAYMENT_STATUS_LABELS[(selectedPurchase.payment?.status ?? "PENDENTE") as PaymentStatusValue]}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Valor registrado</p>
                                    <p className="text-base font-semibold text-slate-900">
                                      {selectedPurchase.payment ? currencyFormatter.format(selectedPurchase.payment.amount) : "—"}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Identificador</p>
                                    <p className="text-base font-semibold text-slate-900">
                                      {selectedPurchase.payment?.externalReference ?? "Não informado"}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-500">Comprovante</p>
                                    {selectedPurchase.payment?.receiptUrl ? (
                                      <a
                                        href={selectedPurchase.payment.receiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-semibold text-blue-700 underline hover:text-blue-900"
                                      >
                                        Abrir arquivo enviado
                                      </a>
                                    ) : (
                                      <p className="text-sm text-slate-600">Nenhum comprovante anexado.</p>
                                    )}
                                  </div>
                                </div>
                              </section>
                            </div>
                          </div>

                          {/* EMISSÃO EM LARGURA TOTAL */}
                          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">
                                  Dados para emissão *
                                </p>
                                <h4 className="text-lg font-semibold text-slate-900">Informações obrigatórias</h4>
                              </div>
                              <Button onClick={handleSaveEmission} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar dados para emissão"}
                              </Button>
                            </div>
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Localizador (PNR)</label>
                                <Input
                                  value={emissionDraft.locator}
                                  onChange={(event) =>
                                    setEmissionDraft((prev) => ({
                                      ...prev,
                                      locator: event.target.value,
                                    }))
                                  }
                                  placeholder="AB1234"
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Companhia aérea</label>
                                <Input
                                  value={emissionDraft.airline}
                                  onChange={(event) =>
                                    setEmissionDraft((prev) => ({
                                      ...prev,
                                      airline: event.target.value,
                                    }))
                                  }
                                  placeholder="Azul, Gol, Latam..."
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Tipo de tarifa</label>
                                <Input
                                  value={emissionDraft.fareType}
                                  onChange={(event) =>
                                    setEmissionDraft((prev) => ({
                                      ...prev,
                                      fareType: event.target.value,
                                    }))
                                  }
                                  placeholder="Flex, Light, Promo..."
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Número do voo</label>
                                <Input
                                  value={emissionDraft.flightNumber}
                                  onChange={(event) =>
                                    setEmissionDraft((prev) => ({
                                      ...prev,
                                      flightNumber: event.target.value,
                                    }))
                                  }
                                  placeholder="AZ123"
                                />
                              </div>
                            </div>
                            <hr className="my-5 border-blue-100" />
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3 rounded-xl border border-white/70 bg-white/80 p-4 shadow-inner">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-700">Ida *</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2.5">
                                    <label className="text-xs font-medium text-slate-600">Data de embarque</label>
                                    <Input
                                      type="date"
                                      value={emissionDraft.departureDate}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          departureDate: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2.5">
                                    <label className="text-xs font-medium text-slate-600">Hora de embarque</label>
                                    <Input
                                      type="time"
                                      value={emissionDraft.outboundDepartureTime}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          outboundDepartureTime: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2.5 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-600">Hora de chegada</label>
                                    <Input
                                      type="time"
                                      value={emissionDraft.outboundArrivalTime}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          outboundArrivalTime: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3 rounded-xl border border-white/70 bg-white/80 p-4 shadow-inner">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-700">Volta *</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2.5">
                                    <label className="text-xs font-medium text-slate-600">Data de retorno</label>
                                    <Input
                                      type="date"
                                      value={emissionDraft.returnDate}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          returnDate: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2.5">
                                    <label className="text-xs font-medium text-slate-600">Hora de embarque</label>
                                    <Input
                                      type="time"
                                      value={emissionDraft.returnDepartureTime}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          returnDepartureTime: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2.5 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-600">Hora de chegada</label>
                                    <Input
                                      type="time"
                                      value={emissionDraft.returnArrivalTime}
                                      onChange={(event) =>
                                        setEmissionDraft((prev) => ({
                                          ...prev,
                                          returnArrivalTime: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>
                    )}

                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}