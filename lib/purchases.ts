import type { Destination, Purchase, PurchaseStatus, User } from "@prisma/client";
import { z } from "zod";

export const purchaseStatusValues = [
  "AGUARDANDO_EMISSAO",
  "EMITIDA",
] as const;

export type PurchaseStatusValue = (typeof purchaseStatusValues)[number];

export const purchaseStatusSchema = z.enum(purchaseStatusValues);

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatusValue, string> = {
  AGUARDANDO_EMISSAO: "Aguardando emissão",
  EMITIDA: "Emitida",
};

export type PurchaseWithRelations = Purchase & {
  package: Destination;
  user?: User | null;
};

export type SerializedPurchase = {
  id: number;
  userId: number;
  packageId: number;
  status: PurchaseStatusValue;
  observacao: string;
  dataCompra: string;
  package: {
    id: number;
    name: string;
    city: string;
    price: number;
    coverPhoto: string | null;
  };
  user: {
    id: number;
    fullName: string | null;
    username: string;
    email: string | null;
  } | null;
};

export function serializePurchase(purchase: PurchaseWithRelations): SerializedPurchase {
  return {
    id: purchase.id,
    userId: purchase.userId,
    packageId: purchase.packageId,
    status: purchase.status as PurchaseStatusValue,
    observacao: purchase.observacao,
    dataCompra: purchase.dataCompra.toISOString(),
    package: {
      id: purchase.package.id,
      name: purchase.package.name,
      city: purchase.package.city,
      price: Number(purchase.package.price),
      coverPhoto: purchase.package.photos[0] ?? null,
    },
    user: purchase.user
      ? {
          id: purchase.user.id,
          fullName: purchase.user.fullName,
          username: purchase.user.username,
          email: purchase.user.email,
        }
      : null,
  };
}

export function mapPurchaseStatusToLabel(status: PurchaseStatus | PurchaseStatusValue): string {
  const normalizedStatus = typeof status === "string" ? status : status.toString();
  return PURCHASE_STATUS_LABELS[normalizedStatus as PurchaseStatusValue] ?? normalizedStatus;
}

