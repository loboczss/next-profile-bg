import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createManualPaymentIntent } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

const PIX_TEST_AMOUNT_IN_CENTS = 500;
const PIX_TEST_AMOUNT_DECIMAL = new Prisma.Decimal(5);

export async function GET() {
  if (!prisma) {
    return NextResponse.json(
      {
        status: "error",
        message: "Banco de dados indisponível. Tente novamente em instantes.",
      },
      { status: 503 }
    );
  }

  try {
    const count = await prisma.pixTestPayment.count({
      where: { status: "CONCLUIDO" },
    });

    return NextResponse.json({ status: "success", count });
  } catch (error) {
    console.error("Erro ao buscar contador do teste de Pix", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Não foi possível carregar o total de pagamentos confirmados.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (!prisma) {
    return NextResponse.json(
      {
        status: "error",
        message: "Banco de dados indisponível. Tente novamente em instantes.",
      },
      { status: 503 }
    );
  }

  try {
    const payment = await createManualPaymentIntent({
      amountInCents: PIX_TEST_AMOUNT_IN_CENTS,
      method: "PIX",
      description: "Teste Pix do site",
      customerName: "Visitante Evastur",
      customerEmail: "pagamentos@evastur.com",
    });

    const rawResponse: Prisma.InputJsonValue = {
      status: payment.status,
      externalReference: payment.externalReference,
    };

    await prisma.pixTestPayment.create({
      data: {
        amount: PIX_TEST_AMOUNT_DECIMAL,
        status: payment.status,
        externalReference: payment.externalReference,
        rawResponse,
      },
    });

    const confirmedPayments = await prisma.pixTestPayment.count({
      where: { status: "CONCLUIDO" },
    });

    const message =
      payment.status === "CONCLUIDO"
        ? "Pix confirmado com sucesso!"
        : "Pagamento registrado! Aguardando confirmação.";

    return NextResponse.json(
      {
        status: "success",
        message,
        count: confirmedPayments,
        payment: {
          reference: payment.externalReference,
          status: payment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao gerar pagamento de teste", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Não foi possível gerar o Pix de teste. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}
