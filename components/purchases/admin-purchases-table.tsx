"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PURCHASE_STATUS_LABELS, type PurchaseStatusValue, type SerializedPurchase } from "@/lib/purchases";
import { PAYMENT_STATUS_LABELS, isPaymentCompleted, type PaymentStatusValue } from "@/lib/payments";
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

type PurchaseRowState = {
  purchase: SerializedPurchase;
  draftStatus: PurchaseStatusValue;
  draftObservacao: string;
  draftPassengers: PassengerDraft[];
};

type PassengerField = Exclude<keyof PassengerDraft, "id">;

type PassengerUpdatePayload = {
  id: number;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};

type PurchaseUpdatePayload = {
  status?: PurchaseStatusValue;
  observacao?: string;
  passengers?: PassengerUpdatePayload[];
};

function formatDateToInputValue(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createPassengerDraftsFromPurchase(purchase: SerializedPurchase): PassengerDraft[] {
  return purchase.passengers.map((passenger) => ({
    id: passenger.id,
    fullName: passenger.fullName,
    cpf: passenger.cpf,
    birthDate: formatDateToInputValue(passenger.birthDate),
    phone: passenger.phone,
    email: passenger.email,
  }));
}

const STATUS_OPTIONS: { value: PurchaseStatusValue; label: string }[] = [
  { value: "AGUARDANDO_EMISSAO", label: PURCHASE_STATUS_LABELS.AGUARDANDO_EMISSAO },
  { value: "EMITIDA", label: PURCHASE_STATUS_LABELS.EMITIDA },
];

export function AdminPurchasesTable({ purchases }: AdminPurchasesTableProps) {
  const [rows, setRows] = useState<PurchaseRowState[]>(() =>
    purchases.map((purchase) => ({
      purchase,
      draftStatus: purchase.status,
      draftObservacao: purchase.observacao,
      draftPassengers: createPassengerDraftsFromPurchase(purchase),
    }))
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  useEffect(() => {
    setRows(
      purchases.map((purchase) => ({
        purchase,
        draftStatus: purchase.status,
        draftObservacao: purchase.observacao,
        draftPassengers: createPassengerDraftsFromPurchase(purchase),
      }))
    );
    setExpandedRowIds((previous) => {
      const validIds = new Set(purchases.map((purchase) => purchase.id));
      const updated = new Set<number>();

      previous.forEach((id) => {
        if (validIds.has(id)) {
          updated.add(id);
        }
      });

      return updated;
    });
  }, [purchases]);

  const toggleRowExpansion = (purchaseId: number) => {
    setExpandedRowIds((previous) => {
      const updated = new Set(previous);

      if (updated.has(purchaseId)) {
        updated.delete(purchaseId);
      } else {
        updated.add(purchaseId);
      }

      return updated;
    });
  };

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

  const handleStatusChange = (purchaseId: number, status: PurchaseStatusValue) => {
    setRows((previous) =>
      previous.map((row) =>
        row.purchase.id === purchaseId
          ? {
              ...row,
              draftStatus: status,
            }
          : row
      )
    );
  };

  const handleObservationChange = (purchaseId: number, observacao: string) => {
    setRows((previous) =>
      previous.map((row) =>
        row.purchase.id === purchaseId
          ? {
              ...row,
              draftObservacao: observacao,
            }
          : row
      )
    );
  };

  const handlePassengerFieldChange = (
    purchaseId: number,
    passengerId: number,
    field: PassengerField,
    value: string
  ) => {
    setRows((previous) =>
      previous.map((row) => {
        if (row.purchase.id !== purchaseId) {
          return row;
        }

        return {
          ...row,
          draftPassengers: row.draftPassengers.map((passenger) =>
            passenger.id === passengerId
              ? {
                  ...passenger,
                  [field]: value,
                }
              : passenger
          ),
        };
      })
    );
  };

  const handleSave = async (row: PurchaseRowState) => {
    if (savingId !== null) {
      return;
    }

    if (row.draftStatus === "EMITIDA" && row.purchase.payment?.status !== "CONCLUIDO") {
      toast.error("Não é possível emitir a compra sem o pagamento confirmado.");
      return;
    }

    const payload: PurchaseUpdatePayload = {};

    if (row.draftStatus !== row.purchase.status) {
      payload.status = row.draftStatus;
    }

    if (row.draftObservacao !== row.purchase.observacao) {
      payload.observacao = row.draftObservacao;
    }

    const passengerUpdates = row.draftPassengers.filter((passengerDraft) => {
      const originalPassenger = row.purchase.passengers.find(
        (current) => current.id === passengerDraft.id
      );

      if (!originalPassenger) {
        return true;
      }

      return (
        passengerDraft.fullName !== originalPassenger.fullName ||
        passengerDraft.cpf !== originalPassenger.cpf ||
        passengerDraft.phone !== originalPassenger.phone ||
        passengerDraft.email !== originalPassenger.email ||
        passengerDraft.birthDate !== formatDateToInputValue(originalPassenger.birthDate)
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

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    setSavingId(row.purchase.id);

    try {
      const response = await fetch(`/api/purchases/${row.purchase.id}`, {
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

      if (!data?.purchase) {
        toast.success(data?.message ?? "Compra atualizada com sucesso.");
        router.refresh();
        return;
      }

      const updatedPurchase: SerializedPurchase = data.purchase;

      setRows((previous) =>
        previous.map((current) =>
          current.purchase.id === row.purchase.id
            ? {
                purchase: updatedPurchase,
                draftStatus: updatedPurchase.status,
                draftObservacao: updatedPurchase.observacao,
                draftPassengers: createPassengerDraftsFromPurchase(updatedPurchase),
              }
            : current
        )
      );

      toast.success(data.message ?? "Compra atualizada com sucesso.");
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar compra", error);
      toast.error("Não foi possível atualizar a compra. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-10 text-center shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Nenhuma compra encontrada</h2>
        <p className="mt-2 text-sm text-slate-600">As solicitações dos clientes aparecerão aqui assim que forem registradas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.35)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/70 backdrop-blur">
            <tr className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
              <th scope="col" className="px-6 py-4 font-semibold">
                Comprador
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Pacote
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Data
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Status
              </th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {rows.map((row) => {
              const { purchase } = row;
              const cover = purchase.package.coverPhoto ?? "/placeholder.jpg";
              const buyerName = purchase.user?.fullName ?? purchase.user?.username ?? "Cliente";
              const buyerEmail = purchase.user?.email ?? "—";
              const purchaseDate = dateFormatter.format(new Date(purchase.dataCompra));
              const hasChanges =
                row.draftStatus !== purchase.status || row.draftObservacao !== purchase.observacao;
              const isSaving = savingId === purchase.id;
              const passengerCountLabel = `${purchase.seatCount} ${
                purchase.seatCount === 1 ? "vaga" : "vagas"
              }`;
              const paymentStatus = (purchase.payment?.status ?? "PENDENTE") as PaymentStatusValue;
              const paymentLabel = purchase.payment
                ? PAYMENT_STATUS_LABELS[paymentStatus]
                : PAYMENT_STATUS_LABELS.PENDENTE;
              const canEmitPurchase = isPaymentCompleted(paymentStatus);
              const passengerDrafts = row.draftPassengers;
              const passengersChanged = passengerDrafts.some((passengerDraft) => {
                const originalPassenger = purchase.passengers.find(
                  (current) => current.id === passengerDraft.id
                );

                if (!originalPassenger) {
                  return true;
                }

                return (
                  passengerDraft.fullName !== originalPassenger.fullName ||
                  passengerDraft.cpf !== originalPassenger.cpf ||
                  passengerDraft.phone !== originalPassenger.phone ||
                  passengerDraft.email !== originalPassenger.email ||
                  passengerDraft.birthDate !== formatDateToInputValue(originalPassenger.birthDate)
                );
              });

              const rowHasChanges = hasChanges || passengersChanged;
              const isExpanded = expandedRowIds.has(purchase.id);

              return (
                <Fragment key={purchase.id}>
                  <tr
                    className={cn(
                      "align-middle text-sm text-slate-700 transition-colors",
                      isExpanded ? "bg-blue-50/60" : "bg-white",
                      rowHasChanges && !isExpanded && "bg-emerald-50/40"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-slate-900">{buyerName}</p>
                        <p className="text-xs text-slate-500">{buyerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-20 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 shadow-sm">
                          <Image src={cover} alt={purchase.package.name} fill className="object-cover" sizes="160px" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{purchase.package.name}</p>
                          <p className="text-xs text-slate-500">{purchase.package.city}</p>
                          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                            {passengerCountLabel}
                          </span>
                          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                            {paymentLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-inner ring-1 ring-slate-200/70">
                        {purchaseDate}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        className="w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus-visible:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                        value={row.draftStatus}
                        onChange={(event) =>
                          handleStatusChange(purchase.id, event.target.value as PurchaseStatusValue)
                        }
                        disabled={isSaving}
                        title={!canEmitPurchase ? "O pagamento precisa ser confirmado para emitir a compra." : undefined}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={!canEmitPurchase && option.value === "EMITIDA"}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "rounded-full border border-slate-200 bg-white/70 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/80 hover:text-slate-900",
                            isExpanded && "border-blue-300 bg-blue-50/80 text-slate-900",
                            isSaving && "pointer-events-none opacity-60"
                          )}
                          onClick={() => toggleRowExpansion(purchase.id)}
                          aria-expanded={isExpanded}
                        >
                          <ChevronRight
                            className={cn("size-4 transition-transform", isExpanded && "rotate-90")}
                          />
                          {isExpanded ? "Ocultar" : "Detalhes"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            "rounded-full px-4",
                            rowHasChanges
                              ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                              : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                          )}
                          onClick={() => handleSave(row)}
                          disabled={!rowHasChanges || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="size-4" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="bg-blue-50/40 text-sm text-slate-700">
                      <td colSpan={5} className="px-6 pb-8 pt-2">
                        <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-6 shadow-inner">
                          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">
                                  Observações do atendimento
                                </p>
                                <Textarea
                                  className="min-h-[140px] rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-700 shadow-sm focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-200"
                                  value={row.draftObservacao}
                                  onChange={(event) => handleObservationChange(purchase.id, event.target.value)}
                                  placeholder="Adicione uma observação para o cliente"
                                  disabled={isSaving}
                                />
                              </div>
                              <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-600 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">
                                  Pagamento
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-inner">
                                    {paymentLabel}
                                  </span>
                                  {purchase.payment?.externalReference ? (
                                    <span className="text-xs text-slate-500">
                                      Ref.: {purchase.payment.externalReference}
                                    </span>
                                  ) : null}
                                  <span className="text-xs text-slate-500">
                                    Valor registrado: {currencyFormatter.format(purchase.payment?.amount ?? purchase.package.price)}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">
                                    Passageiros vinculados
                                  </p>
                                  <span className="text-xs font-medium text-slate-500">
                                    {passengerDrafts.length} {passengerDrafts.length === 1 ? "pessoa" : "pessoas"}
                                  </span>
                                </div>
                                {passengerDrafts.length > 0 ? (
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    {passengerDrafts.map((passenger, index) => (
                                      <div
                                        key={passenger.id}
                                        className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-white p-5 shadow-sm"
                                      >
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                                          Passageiro {index + 1}
                                        </p>
                                        <div className="space-y-3">
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                              Nome completo
                                            </label>
                                            <Input
                                              value={passenger.fullName}
                                              onChange={(event) =>
                                                handlePassengerFieldChange(
                                                  purchase.id,
                                                  passenger.id,
                                                  "fullName",
                                                  event.target.value
                                                )
                                              }
                                              placeholder="Nome completo"
                                              disabled={isSaving}
                                            />
                                          </div>
                                          <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                                CPF
                                              </label>
                                              <Input
                                                value={passenger.cpf}
                                                onChange={(event) =>
                                                  handlePassengerFieldChange(
                                                    purchase.id,
                                                    passenger.id,
                                                    "cpf",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="CPF"
                                                disabled={isSaving}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                                Data de nascimento
                                              </label>
                                              <Input
                                                type="date"
                                                value={passenger.birthDate}
                                                onChange={(event) =>
                                                  handlePassengerFieldChange(
                                                    purchase.id,
                                                    passenger.id,
                                                    "birthDate",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="Data de nascimento"
                                                disabled={isSaving}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                                Telefone
                                              </label>
                                              <Input
                                                value={passenger.phone}
                                                onChange={(event) =>
                                                  handlePassengerFieldChange(
                                                    purchase.id,
                                                    passenger.id,
                                                    "phone",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="Telefone"
                                                disabled={isSaving}
                                              />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                                E-mail
                                              </label>
                                              <Input
                                                type="email"
                                                value={passenger.email}
                                                onChange={(event) =>
                                                  handlePassengerFieldChange(
                                                    purchase.id,
                                                    passenger.id,
                                                    "email",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="E-mail"
                                                disabled={isSaving}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-5 py-6 text-sm text-slate-400">
                                    Sem passageiros cadastrados.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-inner">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">
                                Dados da compra
                              </p>
                              <dl className="space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-4">
                                  <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Código</dt>
                                  <dd className="font-semibold text-slate-900">#{purchase.id}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Status atual</dt>
                                  <dd className="font-semibold text-slate-900">
                                    {PURCHASE_STATUS_LABELS[row.draftStatus] ?? row.draftStatus}
                                  </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                  <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Observação</dt>
                                  <dd className="max-w-[220px] text-right text-sm text-slate-500">
                                    {row.draftObservacao?.trim() ? row.draftObservacao : "Nenhuma"}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Criada em</dt>
                                  <dd className="text-sm font-medium text-slate-700">{purchaseDate}</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

