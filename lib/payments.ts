import type { PaymentStatus } from "@prisma/client";
import { z } from "zod";

export const paymentMethodValues = ["CARTAO", "PIX", "BOLETO", "CARNE"] as const;
export type PaymentMethodValue = (typeof paymentMethodValues)[number];
export const paymentMethodSchema = z.enum(paymentMethodValues, {
  required_error: "Selecione um método de pagamento.",
  invalid_type_error: "Selecione um método de pagamento válido.",
});

export const paymentStatusValues = ["PENDENTE", "CONCLUIDO", "FALHOU"] as const;
export type PaymentStatusValue = (typeof paymentStatusValues)[number];
export const paymentStatusSchema = z.enum(paymentStatusValues);

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  CARTAO: "Cartão de crédito",
  PIX: "Pix",
  BOLETO: "Boleto bancário",
  CARNE: "Carnê",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusValue, string> = {
  PENDENTE: "Pagamento combinado pela agência",
  CONCLUIDO: "Pagamento registrado",
  FALHOU: "Pagamento com falha",
};

export function mapPaymentStatusToLabel(status: PaymentStatus | PaymentStatusValue): string {
  const normalized = typeof status === "string" ? status : String(status);
  return PAYMENT_STATUS_LABELS[normalized as PaymentStatusValue] ?? normalized;
}

export function isPaymentCompleted(status: PaymentStatus | PaymentStatusValue | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return (typeof status === "string" ? status : String(status)) === "CONCLUIDO";
}

interface CreateCoraPaymentParams {
  amountInCents: number;
  method: PaymentMethodValue;
  description: string;
  customerName: string;
  customerEmail: string;
}

interface CreateCoraPaymentResult {
  status: PaymentStatusValue;
  externalReference: string;
}

function generatePaymentReference(method: PaymentMethodValue): string {
  const prefix = `cora_${method.toLowerCase()}_`;
  const globalCrypto = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;

  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return `${prefix}${globalCrypto.randomUUID()}`;
  }

  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}${randomSuffix}`;
}

// Mantemos a função por compatibilidade, mas ela agora gera apenas uma
// referência local para registrar a intenção de pagamento sem acionar
// qualquer provedor externo.
export async function createCoraPayment(
  params: CreateCoraPaymentParams
): Promise<CreateCoraPaymentResult> {
  const { method } = params;

  const status: PaymentStatusValue = "PENDENTE";
  const externalReference = generatePaymentReference(method);

  await new Promise((resolve) => setTimeout(resolve, 50));

  return { status, externalReference };
}
