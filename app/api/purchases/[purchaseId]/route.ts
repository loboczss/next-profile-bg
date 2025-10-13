import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseStatusSchema, serializePurchase } from "@/lib/purchases";

const updatePurchaseSchema = z
  .object({
    status: purchaseStatusSchema.optional(),
    observacao: z
      .string()
      .max(1000, "A observação pode ter no máximo 1000 caracteres.")
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.observacao !== undefined, {
    message: "Informe pelo menos um campo para atualizar.",
  });

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

  const { status, observacao } = parsed.data;

  try {
    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        ...(status ? { status } : {}),
        ...(observacao !== undefined ? { observacao } : {}),
      },
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
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Compra atualizada com sucesso.",
      purchase: serializePurchase(purchase),
    });
  } catch (error) {
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
