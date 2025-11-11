import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseStatusSchema, serializePurchase } from "@/lib/purchases";

const passengerUpdateSchema = z.object({
  id: z.coerce.number({ invalid_type_error: "Passageiro inválido." }).int().positive(),
  fullName: z
    .string({ required_error: "Informe o nome do passageiro." })
    .trim()
    .min(1, "Informe o nome do passageiro."),
  cpf: z
    .string({ required_error: "Informe o CPF." })
    .trim()
    .min(11, "Informe um CPF válido."),
  birthDate: z.coerce.date({ invalid_type_error: "Informe uma data de nascimento válida." }),
  phone: z
    .string({ required_error: "Informe o telefone." })
    .trim()
    .min(8, "Informe um telefone válido."),
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .email("Informe um e-mail válido."),
});

const updatePurchaseSchema = z
  .object({
    status: purchaseStatusSchema.optional(),
    observacao: z
      .string()
      .max(1000, "A observação pode ter no máximo 1000 caracteres.")
      .optional(),
    passengers: z
      .array(passengerUpdateSchema, {
        invalid_type_error: "Informe os dados atualizados dos passageiros.",
      })
      .min(1, "Informe ao menos um passageiro para atualizar.")
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.observacao !== undefined ||
      data.passengers !== undefined,
    {
      message: "Informe pelo menos um campo para atualizar.",
    }
  );

class PassengerNotFoundError extends Error {
  constructor() {
    super("PASSENGER_NOT_FOUND");
  }
}

class PurchaseNotFoundError extends Error {
  constructor() {
    super("PURCHASE_NOT_FOUND");
  }
}

class PaymentNotConfirmedError extends Error {
  constructor() {
    super("PAYMENT_NOT_CONFIRMED");
  }
}

type PurchaseRouteContext = {
  params: Promise<{ purchaseId: string }>;
};

export async function PATCH(
  request: Request,
  context: PurchaseRouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "error", message: "Você precisa estar autenticado para atualizar uma compra." },
      { status: 401 }
    );
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { status: "error", message: "Apenas administradores podem atualizar compras." },
      { status: 403 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      {
        status: "error",
        message: "Banco de dados indisponível. Tente novamente mais tarde.",
      },
      { status: 503 }
    );
  }

  const { purchaseId: purchaseIdRaw } = await context.params;
  const purchaseId = Number(purchaseIdRaw);

  if (!purchaseIdRaw || Number.isNaN(purchaseId) || !Number.isInteger(purchaseId)) {
    return NextResponse.json(
      { status: "error", message: "Identificador de compra inválido." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePurchaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos para atualização.",
      },
      { status: 400 }
    );
  }

  const { status, observacao, passengers } = parsed.data;

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const passengerUpdates = passengers ?? [];

      if (passengerUpdates.length > 0) {
        for (const passenger of passengerUpdates) {
          const result = await tx.passenger.updateMany({
            where: { id: passenger.id, purchaseId },
            data: {
              fullName: passenger.fullName,
              cpf: passenger.cpf,
              birthDate: passenger.birthDate,
              phone: passenger.phone,
              email: passenger.email,
            },
          });

          if (result.count === 0) {
            throw new PassengerNotFoundError();
          }
        }
      }

      const dataToUpdate: Record<string, unknown> = {};

      if (status) {
        if (status === "EMITIDA") {
          const purchaseWithPayment = await tx.purchase.findUnique({
            where: { id: purchaseId },
            include: { payment: true },
          });

          if (!purchaseWithPayment) {
            throw new PurchaseNotFoundError();
          }

          if (purchaseWithPayment.payment?.status !== "CONCLUIDO") {
            throw new PaymentNotConfirmedError();
          }
        }

        dataToUpdate.status = status;
      }

      if (observacao !== undefined) {
        dataToUpdate.observacao = observacao;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        return tx.purchase.update({
          where: { id: purchaseId },
          data: dataToUpdate,
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
      }

      const purchaseRecord = await tx.purchase.findUnique({
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

      if (!purchaseRecord) {
        throw new PurchaseNotFoundError();
      }

      return purchaseRecord;
    });

    return NextResponse.json({
      status: "success",
      message: "Compra atualizada com sucesso.",
      purchase: serializePurchase(purchase),
    });
  } catch (error) {
    if (error instanceof PassengerNotFoundError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Passageiro não encontrado para esta compra.",
        },
        { status: 404 }
      );
    }

    if (error instanceof PurchaseNotFoundError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Compra não encontrada.",
        },
        { status: 404 }
      );
    }

    if (error instanceof PaymentNotConfirmedError) {
      return NextResponse.json(
        {
          status: "error",
          message: "O pagamento ainda não foi concluído. Conclua o pagamento para emitir a compra.",
        },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar compra", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Não foi possível atualizar a compra. Verifique se ela ainda existe.",
      },
      { status: 500 }
    );
  }
}
