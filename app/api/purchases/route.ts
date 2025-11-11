import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePurchase } from "@/lib/purchases";
import { createCoraPayment, paymentMethodSchema } from "@/lib/payments";

const passengerSchema = z.object({
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

const createPurchaseSchema = z
  .object({
    destinationId: z
      .coerce
      .number({ invalid_type_error: "Destino inválido." })
      .int()
      .positive(),
    quantity: z
      .coerce
      .number({ invalid_type_error: "Informe a quantidade de vagas." })
      .int("A quantidade deve ser um número inteiro.")
      .min(1, "Selecione ao menos uma vaga."),
    passengers: z
      .array(passengerSchema, { invalid_type_error: "Informe os dados dos passageiros." })
      .min(1, "Informe ao menos um passageiro."),
    paymentMethod: paymentMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (data.passengers.length !== data.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passengers"],
        message: "A quantidade de passageiros deve corresponder ao número de vagas selecionadas.",
      });
    }
  });

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "error", message: "Você precisa estar autenticado para comprar um pacote." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      {
        status: "error",
        message: "Banco de dados indisponível. Tente novamente em instantes.",
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createPurchaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos para criar a compra.",
      },
      { status: 400 }
    );
  }

  const { destinationId, quantity, passengers, paymentMethod } = parsed.data;
  const userId = Number(session.user.id);

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return NextResponse.json(
        { status: "error", message: "Destino não encontrado." },
        { status: 404 }
      );
    }

    const purchasesAggregate = await prisma.purchase.aggregate({
      where: { packageId: destinationId },
      _sum: { seatCount: true },
    });

    const seatsAlreadyReserved = purchasesAggregate._sum.seatCount ?? 0;
    const seatsAvailable = destination.totalSeats - seatsAlreadyReserved;

    if (quantity > seatsAvailable) {
      return NextResponse.json(
        {
          status: "error",
          message:
            seatsAvailable > 0
              ? `Restam apenas ${seatsAvailable} ${seatsAvailable === 1 ? "vaga" : "vagas"} para este destino.`
              : "Não há mais vagas disponíveis para este destino.",
        },
        { status: 400 }
      );
    }

    const unitPrice = new Prisma.Decimal(destination.price);
    const totalAmountDecimal = unitPrice.mul(quantity);
    const amountInCents = Number(totalAmountDecimal.mul(100).toFixed(0));

    const coraPayment = await createCoraPayment({
      amountInCents,
      method: paymentMethod,
      description: `Compra do pacote ${destination.name}`,
      customerName: session.user.fullName ?? session.user.username ?? "Cliente",
      customerEmail: session.user.email ?? "",
    });

    const purchase = await prisma.$transaction(async (tx) => {
      const purchaseRecord = await tx.purchase.create({
        data: {
          userId,
          packageId: destinationId,
          seatCount: quantity,
          status: "AGUARDANDO_EMISSAO",
          observacao: "",
          passengers: {
            create: passengers.map((passenger) => ({
              fullName: passenger.fullName,
              cpf: passenger.cpf,
              birthDate: passenger.birthDate,
              phone: passenger.phone,
              email: passenger.email,
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          purchaseId: purchaseRecord.id,
          method: paymentMethod,
          status: coraPayment.status,
          amount: totalAmountDecimal,
          externalReference: coraPayment.externalReference,
        },
      });

      return tx.purchase.findUniqueOrThrow({
        where: { id: purchaseRecord.id },
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
    });

    const message =
      coraPayment.status === "CONCLUIDO"
        ? "Compra registrada e pagamento confirmado com sucesso!"
        : "Compra registrada! Estamos aguardando a confirmação do pagamento.";

    return NextResponse.json(
      {
        status: "success",
        message,
        purchase: serializePurchase(purchase),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar compra", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Não foi possível registrar sua compra. Tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "error", message: "Você precisa estar autenticado para visualizar compras." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      {
        status: "error",
        message: "Banco de dados indisponível. Tente novamente em instantes.",
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const isAdminScope = scope === "admin";

  if (isAdminScope && session.user.role !== "admin") {
    return NextResponse.json(
      {
        status: "error",
        message: "Apenas administradores podem visualizar todas as compras.",
      },
      { status: 403 }
    );
  }

  const whereClause = isAdminScope
    ? undefined
    : {
        userId: Number(session.user.id),
      };

  try {
    const purchases = await prisma.purchase.findMany({
      where: whereClause,
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
      orderBy: { dataCompra: "desc" },
    });

    return NextResponse.json({
      status: "success",
      purchases: purchases.map(serializePurchase),
    });
  } catch (error) {
    console.error("Erro ao listar compras", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Não foi possível carregar as compras.",
      },
      { status: 500 }
    );
  }
}
