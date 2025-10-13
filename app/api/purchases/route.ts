import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePurchase } from "@/lib/purchases";

const createPurchaseSchema = z.object({
  destinationId: z.number({ invalid_type_error: "Destino inválido." }).int().positive(),
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

  const destinationId = parsed.data.destinationId;
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

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        packageId: destinationId,
        status: "AGUARDANDO_EMISSAO",
        observacao: "",
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

    return NextResponse.json(
      {
        status: "success",
        message: "Compra registrada com sucesso!",
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
