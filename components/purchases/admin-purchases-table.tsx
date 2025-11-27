"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarClock,
  CheckCircle2,
  Filter,
  LocateIcon,
  Mail,
  MapPin,
  NotebookPen,
  Plane,
  Save,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PURCHASE_STATUS_LABELS,
  type PurchaseStatusValue,
  type SerializedPurchase,
  type TicketDetails,
} from "@/lib/purchases";
import { PAYMENT_STATUS_LABELS, type PaymentStatusValue } from "@/lib/payments";
import { cn } from "@/lib/utils";

interface AdminPurchasesTableProps {
  purchases: SerializedPurchase[];
}

type PassengerDraft = {
  id?: number;
  clientId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};

type PurchaseDraftState = {
  status: PurchaseStatusValue;
  ticketDetails: TicketDetails;
  passengers: PassengerDraft[];
  observacao: string;
};

type FilterStatus = PurchaseStatusValue | "ALL" | "CANCELADA";

type FiltersState = {
  search: string;
  status: FilterStatus;
  packageId: string;
  startDate: string;
  endDate: string;
};

const STATUS_COLORS: Record<PurchaseStatusValue | "CANCELADA", string> = {
  AGUARDANDO_EMISSAO: "bg-amber-100 text-amber-700 border-amber-200",
  EMITIDA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELADA: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "AGUARDANDO_EMISSAO", label: PURCHASE_STATUS_LABELS.AGUARDANDO_EMISSAO },
  { value: "EMITIDA", label: PURCHASE_STATUS_LABELS.EMITIDA },
  { value: "CANCELADA", label: "Cancelada" },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd'/'MMM'/'yyyy", { locale: ptBR });
}

function createTicketDetailsFromPurchase(purchase: SerializedPurchase): TicketDetails {
  return (
    purchase.ticketDetails ?? {
      locator: "",
      departureDate: purchase.package.startDate?.slice(0, 10) ?? "",
      returnDate: purchase.package.endDate?.slice(0, 10) ?? "",
      outboundDepartureTime: "",
      outboundArrivalTime: "",
      returnDepartureTime: "",
      returnArrivalTime: "",
      fareType: "",
      airline: "",
      flightNumber: "",
      passengerNames: purchase.passengers.map((passenger) => passenger.fullName),
    }
  );
}

function createPassengerDraftsFromPurchase(purchase: SerializedPurchase): PassengerDraft[] {
  return purchase.passengers.map((passenger) => ({
    id: passenger.id,
    clientId: passenger.id.toString(),
    fullName: passenger.fullName,
    cpf: passenger.cpf,
    birthDate: passenger.birthDate.slice(0, 10),
    phone: passenger.phone,
    email: passenger.email,
  }));
}

function sanitizeTicketDetails(details: TicketDetails): TicketDetails {
  return {
    locator: details.locator.trim(),
    departureDate: details.departureDate.trim(),
    returnDate: details.returnDate.trim(),
    outboundDepartureTime: details.outboundDepartureTime.trim(),
    outboundArrivalTime: details.outboundArrivalTime.trim(),
    returnDepartureTime: details.returnDepartureTime.trim(),
    returnArrivalTime: details.returnArrivalTime.trim(),
    fareType: details.fareType.trim(),
    airline: details.airline.trim(),
    flightNumber: details.flightNumber.trim(),
    passengerNames: details.passengerNames.map((name) => name.trim()).filter(Boolean),
  };
}

function areTicketDetailsEqual(first: TicketDetails, second: TicketDetails) {
  const a = sanitizeTicketDetails(first);
  const b = sanitizeTicketDetails(second);

  return (
    a.locator === b.locator &&
    a.departureDate === b.departureDate &&
    a.returnDate === b.returnDate &&
    a.outboundDepartureTime === b.outboundDepartureTime &&
    a.outboundArrivalTime === b.outboundArrivalTime &&
    a.returnDepartureTime === b.returnDepartureTime &&
    a.returnArrivalTime === b.returnArrivalTime &&
    a.fareType === b.fareType &&
    a.airline === b.airline &&
    a.flightNumber === b.flightNumber &&
    a.passengerNames.join("|") === b.passengerNames.join("|")
  );
}

function isTicketDetailsComplete(details: TicketDetails) {
  const sanitized = sanitizeTicketDetails(details);

  return (
    sanitized.locator &&
    sanitized.departureDate &&
    sanitized.returnDate &&
    sanitized.outboundDepartureTime &&
    sanitized.outboundArrivalTime &&
    sanitized.returnDepartureTime &&
    sanitized.returnArrivalTime &&
    sanitized.fareType &&
    sanitized.airline &&
    sanitized.flightNumber &&
    sanitized.passengerNames.length > 0
  );
}

function createPurchaseDraft(purchase: SerializedPurchase): PurchaseDraftState {
  return {
    status: purchase.status,
    ticketDetails: createTicketDetailsFromPurchase(purchase),
    passengers: createPassengerDraftsFromPurchase(purchase),
    observacao: purchase.observacao ?? "",
  };
}

export function AdminPurchasesTable({ purchases }: AdminPurchasesTableProps) {
  const [items, setItems] = useState<SerializedPurchase[]>(purchases);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    status: "ALL",
    packageId: "ALL",
    startDate: "",
    endDate: "",
  });
  const [draft, setDraft] = useState<PurchaseDraftState | null>(null);

  useEffect(() => {
    setItems(purchases);
    if (activeId) {
      const refreshed = purchases.find((purchase) => purchase.id === activeId);
      if (refreshed) {
        setDraft(createPurchaseDraft(refreshed));
      }
    }
  }, [purchases, activeId]);

  const packages = useMemo(() => {
    const unique = new Map<number, string>();
    purchases.forEach((purchase) => {
      unique.set(purchase.package.id, purchase.package.name);
    });
    return Array.from(unique.entries());
  }, [purchases]);

  const filteredItems = useMemo(() => {
    return items.filter((purchase) => {
      const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "";
      const buyerEmail = purchase.user?.email ?? "";
      const matchesSearch =
        filters.search.trim().length === 0 ||
        buyerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        buyerEmail.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "ALL" ||
        (filters.status === "CANCELADA" ? purchase.status === "CANCELADA" : purchase.status === filters.status);

      const matchesPackage =
        filters.packageId === "ALL" || purchase.package.id.toString() === filters.packageId;

      const startDate = filters.startDate ? new Date(filters.startDate).getTime() : null;
      const endDate = filters.endDate ? new Date(filters.endDate).getTime() : null;
      const travelDate = new Date(purchase.package.startDate).getTime();

      const matchesDate =
        (!startDate || travelDate >= startDate) && (!endDate || travelDate <= endDate);

      return matchesSearch && matchesStatus && matchesPackage && matchesDate;
    });
  }, [items, filters]);

  const selectedPurchase = activeId
    ? items.find((purchase) => purchase.id === activeId) ?? null
    : null;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }),
    []
  );

  const updateDraftTicketDetails = (field: keyof TicketDetails, value: string) => {
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            ticketDetails: {
              ...previous.ticketDetails,
              [field]: value,
            },
          }
        : previous
    );
  };

  const updateDraftPassenger = (clientId: string, field: keyof PassengerDraft, value: string) => {
    setDraft((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        passengers: previous.passengers.map((passenger) =>
          passenger.clientId === clientId
            ? {
                ...passenger,
                [field]: value,
              }
            : passenger
        ),
      };
    });
  };

  const addPassenger = () => {
    setDraft((previous) => {
      if (!previous) return previous;
      const clientId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `novo-${Date.now()}`;
      const newPassenger: PassengerDraft = {
        id: undefined,
        clientId,
        fullName: "",
        cpf: "",
        birthDate: "",
        phone: "",
        email: "",
      };

      return {
        ...previous,
        passengers: [...previous.passengers, newPassenger],
        ticketDetails: {
          ...previous.ticketDetails,
          passengerNames: [...previous.ticketDetails.passengerNames, ""],
        },
      };
    });
  };

  const removePassenger = (index: number) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const updated = [...previous.passengers];
      updated.splice(index, 1);
      return {
        ...previous,
        passengers: updated,
        ticketDetails: {
          ...previous.ticketDetails,
          passengerNames: previous.ticketDetails.passengerNames.filter((_, i) => i !== index),
        },
      };
    });
  };

  const updateTicketPassengerName = (index: number, value: string) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const updatedNames = [...previous.ticketDetails.passengerNames];
      updatedNames[index] = value;
      return {
        ...previous,
        ticketDetails: {
          ...previous.ticketDetails,
          passengerNames: updatedNames,
        },
      };
    });
  };

  const openDetails = (purchase: SerializedPurchase) => {
    setActiveId(purchase.id);
    setDraft(createPurchaseDraft(purchase));
    setOpen(true);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "ALL", packageId: "ALL", startDate: "", endDate: "" });
  };

  const buildPayload = (
    currentDraft: PurchaseDraftState,
    purchase: SerializedPurchase | null
  ): Record<string, unknown> | null => {
    if (!purchase) return null;

    const payload: Record<string, unknown> = {};

    if (currentDraft.status !== purchase.status) {
      payload.status = currentDraft.status;
    }

    const ticketDetailsChanged = !areTicketDetailsEqual(
      currentDraft.ticketDetails,
      purchase.ticketDetails ?? createTicketDetailsFromPurchase(purchase)
    );

    if (ticketDetailsChanged) {
      payload.ticketDetails = sanitizeTicketDetails(currentDraft.ticketDetails);
    }

    if ((currentDraft.observacao ?? "") !== (purchase.observacao ?? "")) {
      payload.observacao = currentDraft.observacao?.trim() ?? "";
    }

    const passengersById = new Map<number, (typeof purchase.passengers)[number]>();
    purchase.passengers.forEach((passenger) => passengersById.set(passenger.id, passenger));

    const passengerUpdates = currentDraft.passengers.filter((passenger) => {
      if (!passenger.id) {
        return true;
      }

      const original = passengersById.get(passenger.id);

      if (!original) return true;

      return (
        passenger.fullName !== original.fullName ||
        passenger.cpf !== original.cpf ||
        passenger.phone !== original.phone ||
        passenger.email !== original.email ||
        passenger.birthDate !== original.birthDate.slice(0, 10)
      );
    });

    if (passengerUpdates.length > 0) {
      payload.passengers = passengerUpdates.map((passenger) => ({
        id: passenger.id,
        fullName: passenger.fullName.trim(),
        cpf: passenger.cpf.trim(),
        birthDate: passenger.birthDate,
        phone: passenger.phone.trim(),
        email: passenger.email.trim(),
      }));
    }

    return payload;
  };

  const persistChanges = async (successMessage?: string, overrideDraft?: PurchaseDraftState) => {
    if (!selectedPurchase || !draft || saving) return;

    const currentDraft = overrideDraft ?? draft;
    const payload = buildPayload(currentDraft, selectedPurchase);

    if (!payload || Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    if (payload.status === "EMITIDA" && !isTicketDetailsComplete(draft.ticketDetails)) {
      toast.error("Preencha os dados obrigatórios de emissão antes de marcar como emitido.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/purchases/${selectedPurchase.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { status?: string; message?: string; purchase?: SerializedPurchase }
        | null;

      if (!response.ok) {
        toast.error(data?.message ?? "Não foi possível atualizar a compra.");
        return;
      }

      if (data?.purchase) {
        setItems((previous) =>
          previous.map((item) => (item.id === data.purchase!.id ? data.purchase! : item))
        );
        setDraft(createPurchaseDraft(data.purchase));
      }

      toast.success(successMessage ?? data?.message ?? "Alterações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar compra", error);
      toast.error("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const markAsIssued = () => {
    if (!draft) return;
    const updatedDraft: PurchaseDraftState = { ...draft, status: "EMITIDA" };
    setDraft(updatedDraft);
    void persistChanges("Compra marcada como emitida.", updatedDraft);
  };

  const badge = (status: PurchaseStatusValue | "CANCELADA") => (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", STATUS_COLORS[status]
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current"></span>
      {status === "CANCELADA"
        ? "Cancelada"
        : PURCHASE_STATUS_LABELS[status as PurchaseStatusValue] ?? status}
    </span>
  );

  const renderPayment = (purchase: SerializedPurchase) => {
    const paymentStatus = (purchase.payment?.status ?? "PENDENTE") as PaymentStatusValue;
    const paymentLabel = purchase.payment
      ? PAYMENT_STATUS_LABELS[paymentStatus]
      : PAYMENT_STATUS_LABELS.PENDENTE;

    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-700">{paymentLabel}</span>
        <span>Valor: {currencyFormatter.format(purchase.payment?.amount ?? purchase.package.price)}</span>
        {purchase.payment?.externalReference ? (
          <span className="text-slate-400">Ref.: {purchase.payment.externalReference}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Busca</p>
            <Input
              placeholder="Buscar por comprador ou e-mail"
              value={filters.search}
              onChange={(event) => setFilters((f) => ({ ...f, search: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Status</p>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={filters.status}
              onChange={(event) => setFilters((f) => ({ ...f, status: event.target.value as FilterStatus }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Pacote</p>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={filters.packageId}
              onChange={(event) => setFilters((f) => ({ ...f, packageId: event.target.value }))}
            >
              <option value="ALL">Todos</option>
              {packages.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Data inicial</p>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((f) => ({ ...f, startDate: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Data final</p>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((f) => ({ ...f, endDate: event.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="gap-2"
              onClick={() => toast.success("Filtros aplicados")}
              variant="secondary"
              type="button"
            >
              <Filter className="h-4 w-4" /> Aplicar filtros
            </Button>
            <button
              type="button"
              className="text-sm font-semibold text-slate-500 underline decoration-dotted underline-offset-4"
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-slate-50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/90 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
                <th className="px-6 py-4 font-semibold">Comprador</th>
                <th className="px-6 py-4 font-semibold">Pacote</th>
                <th className="px-6 py-4 font-semibold">Data da viagem</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Criada em</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredItems.map((purchase) => {
                const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "Cliente";
                const buyerEmail = purchase.user?.email ?? "—";
                const travelDate = formatDate(purchase.package.startDate);
                const purchaseDate = format(new Date(purchase.dataCompra), "dd/MM/yy HH:mm", { locale: ptBR });

                return (
                  <tr key={purchase.id} className="bg-white/90 text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{buyerName}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-4 w-4" /> {buyerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image
                            src={purchase.package.coverPhoto ?? "/placeholder.jpg"}
                            alt={purchase.package.name}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{purchase.package.name}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" /> {purchase.package.city}
                          </p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                            {purchase.seatCount} {purchase.seatCount === 1 ? "passageiro" : "passageiros"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CalendarClock className="h-4 w-4 text-slate-500" /> {travelDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">{badge(purchase.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{purchaseDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetails(purchase)}>
                          Detalhes
                        </Button>
                        {purchase.status !== "EMITIDA" ? (
                          <Button size="sm" className="gap-2" onClick={() => openDetails(purchase)}>
                            <CheckCircle2 className="h-4 w-4" /> Marcar como emitido
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Nenhuma compra encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl overflow-hidden border-0 bg-white p-0">
          {selectedPurchase && draft ? (
            <div className="grid h-full max-h-[90vh] grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-y-auto p-6 lg:p-8">
                <DialogHeader className="items-start gap-2 text-left">
                  <DialogTitle className="text-2xl font-bold text-slate-900">Detalhes da compra</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    Complete os dados obrigatórios para emissão, gerencie passageiros e acompanhe pagamentos.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Dados da compra</p>
                        <p className="text-lg font-semibold text-slate-900">Pacote {selectedPurchase.package.name}</p>
                      </div>
                      {badge(selectedPurchase.status)}
                    </div>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Código</dt>
                        <dd className="text-sm font-semibold text-slate-900">#{selectedPurchase.id}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Criada em</dt>
                        <dd className="text-sm text-slate-700">{formatDate(selectedPurchase.dataCompra)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Trechos</dt>
                        <dd className="text-sm text-slate-700">
                          Ida em {draft.ticketDetails.departureDate || "—"} • Volta em {draft.ticketDetails.returnDate || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Companhia e voo</dt>
                        <dd className="text-sm text-slate-700">
                          {draft.ticketDetails.airline || "Companhia não informada"} • {draft.ticketDetails.flightNumber || "Voo não informado"}
                        </dd>
                      </div>
                    </dl>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Observações gerais</label>
                      <Textarea
                        className="mt-2"
                        placeholder="Anote observações relevantes para a emissão ou atendimento."
                        value={draft.observacao}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, observacao: event.target.value } : prev))}
                        rows={3}
                      />
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">Dados para emissão</p>
                        <p className="text-sm text-slate-600">Campos obrigatórios para liberar o bilhete.</p>
                      </div>
                      <Plane className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Localizador (PNR)</label>
                        <Input
                          value={draft.ticketDetails.locator}
                          onChange={(event) => updateDraftTicketDetails("locator", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Companhia aérea</label>
                        <Input
                          value={draft.ticketDetails.airline}
                          onChange={(event) => updateDraftTicketDetails("airline", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Tipo de tarifa</label>
                        <Input
                          value={draft.ticketDetails.fareType}
                          onChange={(event) => updateDraftTicketDetails("fareType", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Número do voo</label>
                        <Input
                          value={draft.ticketDetails.flightNumber}
                          onChange={(event) => updateDraftTicketDetails("flightNumber", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 rounded-xl border border-white/50 bg-white/60 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Ida</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            type="date"
                            value={draft.ticketDetails.departureDate}
                            onChange={(event) => updateDraftTicketDetails("departureDate", event.target.value)}
                          />
                          <Input
                            type="time"
                            value={draft.ticketDetails.outboundDepartureTime}
                            onChange={(event) => updateDraftTicketDetails("outboundDepartureTime", event.target.value)}
                          />
                          <div className="sm:col-span-2">
                            <Input
                              type="time"
                              value={draft.ticketDetails.outboundArrivalTime}
                              onChange={(event) => updateDraftTicketDetails("outboundArrivalTime", event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-xl border border-white/50 bg-white/60 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Volta</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            type="date"
                            value={draft.ticketDetails.returnDate}
                            onChange={(event) => updateDraftTicketDetails("returnDate", event.target.value)}
                          />
                          <Input
                            type="time"
                            value={draft.ticketDetails.returnDepartureTime}
                            onChange={(event) => updateDraftTicketDetails("returnDepartureTime", event.target.value)}
                          />
                          <div className="sm:col-span-2">
                            <Input
                              type="time"
                              value={draft.ticketDetails.returnArrivalTime}
                              onChange={(event) => updateDraftTicketDetails("returnArrivalTime", event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Nome dos passageiros</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {draft.ticketDetails.passengerNames.map((name, index) => (
                          <Input
                            key={`${selectedPurchase.id}-ticket-passenger-${index}`}
                            value={name}
                            onChange={(event) => updateTicketPassengerName(index, event.target.value)}
                            placeholder={`Passageiro ${index + 1}`}
                          />
                        ))}
                      </div>
                      {draft.ticketDetails.passengerNames.length === 0 ? (
                        <p className="text-xs text-amber-600">Adicione ao menos um passageiro.</p>
                      ) : null}
                    </div>
                    <div className="flex justify-end">
                      <Button className="gap-2" onClick={() => persistChanges("Dados para emissão salvos.")}
                        disabled={saving}
                      >
                        <Save className="h-4 w-4" /> Salvar dados para emissão
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Passageiros vinculados</p>
                        <p className="text-sm text-slate-600">Gerencie dados enviados à companhia.</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" onClick={addPassenger}>
                        <UserRoundPlus className="h-4 w-4" /> Adicionar passageiro
                      </Button>
                    </div>

                    {draft.passengers.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {draft.passengers.map((passenger, index) => (
                          <div
                            key={passenger.clientId}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-semibold uppercase tracking-[0.2em]">Passageiro {index + 1}</span>
                              <button
                                type="button"
                                className="text-rose-500 hover:text-rose-600"
                                onClick={() => removePassenger(index)}
                              >
                                Remover
                              </button>
                            </div>
                            <div className="space-y-2">
                              <Input
                                placeholder="Nome completo"
                                value={passenger.fullName}
                                onChange={(event) =>
                                  updateDraftPassenger(passenger.clientId, "fullName", event.target.value)
                                }
                              />
                              <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                  placeholder="CPF"
                                  value={passenger.cpf}
                                  onChange={(event) =>
                                    updateDraftPassenger(passenger.clientId, "cpf", event.target.value)
                                  }
                                />
                                <Input
                                  type="date"
                                  value={passenger.birthDate}
                                  onChange={(event) =>
                                    updateDraftPassenger(passenger.clientId, "birthDate", event.target.value)
                                  }
                                />
                                <Input
                                  placeholder="Telefone"
                                  value={passenger.phone}
                                  onChange={(event) =>
                                    updateDraftPassenger(passenger.clientId, "phone", event.target.value)
                                  }
                                />
                                <Input
                                  type="email"
                                  placeholder="E-mail"
                                  value={passenger.email}
                                  onChange={(event) =>
                                    updateDraftPassenger(passenger.clientId, "email", event.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                        Nenhum passageiro registrado.
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button variant="outline" className="gap-2" onClick={() => persistChanges("Passageiros atualizados.")}>
                        <Save className="h-4 w-4" /> Salvar passageiros
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Pagamento</p>
                    {renderPayment(selectedPurchase)}
                  </section>

                  <section className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">Ações gerais</p>
                    <div className="flex flex-wrap gap-3">
                      <Button className="gap-2" onClick={markAsIssued} disabled={saving}>
                        <CheckCircle2 className="h-4 w-4" /> Marcar como emitido
                      </Button>
                      <Button variant="outline" className="gap-2 text-rose-600" disabled={saving}>
                        <XCircle className="h-4 w-4" /> Cancelar compra
                      </Button>
                      <Button variant="secondary" className="gap-2" onClick={() => persistChanges()} disabled={saving}>
                        <Save className="h-4 w-4" /> Salvar todas as alterações
                      </Button>
                    </div>
                  </section>
                </div>
              </div>

              <aside className="hidden border-l border-slate-200 bg-slate-50/60 p-6 lg:block">
                <div className="mb-6 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Resumo do pacote</p>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-32 w-full">
                      <Image
                        src={selectedPurchase.package.coverPhoto ?? "/placeholder.jpg"}
                        alt={selectedPurchase.package.name}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                    </div>
                    <div className="space-y-2 p-4 text-sm text-slate-700">
                      <p className="text-base font-semibold text-slate-900">{selectedPurchase.package.name}</p>
                      <p className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4" /> {selectedPurchase.package.city}
                      </p>
                      <p className="flex items-center gap-2 text-slate-500">
                        <LocateIcon className="h-4 w-4" /> {selectedPurchase.package.departureLocation ?? "Local de partida não informado"}
                      </p>
                      <p className="flex items-center gap-2 text-slate-500">
                        <NotebookPen className="h-4 w-4" /> {selectedPurchase.package.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Contato do comprador</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {selectedPurchase.user?.fullName ?? selectedPurchase.user?.username ?? "Cliente"}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-4 w-4" /> {selectedPurchase.user?.email ?? "E-mail não informado"}
                  </p>
                </div>
              </aside>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
