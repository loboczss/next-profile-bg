"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PURCHASE_STATUS_LABELS, type PurchaseStatusValue, type SerializedPurchase } from "@/lib/purchases";
import { cn } from "@/lib/utils";

interface AdminPurchasesTableProps {
  purchases: SerializedPurchase[];
}

type PurchaseRowState = {
  purchase: SerializedPurchase;
  draftStatus: PurchaseStatusValue;
  draftObservacao: string;
};

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
    }))
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRows(
      purchases.map((purchase) => ({
        purchase,
        draftStatus: purchase.status,
        draftObservacao: purchase.observacao,
      }))
    );
  }, [purchases]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
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

  const handleSave = async (row: PurchaseRowState) => {
    if (savingId !== null) {
      return;
    }

    const payload: Record<string, unknown> = {};

    if (row.draftStatus !== row.purchase.status) {
      payload.status = row.draftStatus;
    }

    if (row.draftObservacao !== row.purchase.observacao) {
      payload.observacao = row.draftObservacao;
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
    <div className="overflow-x-auto rounded-3xl border border-slate-200/70 bg-white/85 shadow-xl">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50/90">
          <tr className="text-xs uppercase tracking-[0.3em] text-slate-500">
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
            <th scope="col" className="px-6 py-4 font-semibold">
              Observação
            </th>
            <th scope="col" className="px-6 py-4 font-semibold">
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

            return (
              <tr key={purchase.id} className="align-top text-sm text-slate-700">
                <td className="px-6 py-5">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{buyerName}</p>
                    <p className="text-xs text-slate-500">{buyerEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                      <Image src={cover} alt={purchase.package.name} fill className="object-cover" sizes="160px" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{purchase.package.name}</p>
                      <p className="text-xs text-slate-500">{purchase.package.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {purchaseDate}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    value={row.draftStatus}
                    onChange={(event) =>
                      handleStatusChange(purchase.id, event.target.value as PurchaseStatusValue)
                    }
                    disabled={isSaving}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-5">
                  <textarea
                    className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    value={row.draftObservacao}
                    onChange={(event) => handleObservationChange(purchase.id, event.target.value)}
                    placeholder="Adicione uma observação para o cliente"
                    disabled={isSaving}
                  />
                </td>
                <td className="px-6 py-5">
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "rounded-full px-4",
                      hasChanges
                        ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                        : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                    )}
                    onClick={() => handleSave(row)}
                    disabled={!hasChanges || isSaving}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

