import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertImage, sanitizeExt } from "@/lib/file";
import { prisma } from "@/lib/prisma";
import { serializePurchase } from "@/lib/purchases";
import { storePaymentReceipt } from "@/lib/storage";

interface ProofContext {
  params: Promise<{ purchaseId: string }>;
}

export async function POST(request: Request, context: ProofContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "error", message: "Entre na sua conta para enviar o comprovante." },
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

  const { purchaseId: purchaseIdRaw } = await context.params;
  const purchaseId = Number(purchaseIdRaw);

  if (!purchaseIdRaw || Number.isNaN(purchaseId) || !Number.isInteger(purchaseId)) {
    return NextResponse.json(
      { status: "error", message: "Identificador de compra inválido." },
      { status: 400 }
    );
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      { status: "error", message: "Envie o comprovante usando um formulário válido." },
      { status: 400 }
    );
  }

  const proofFile = formData.get("proofFile");

  if (!(proofFile instanceof File) || proofFile.size === 0) {
    return NextResponse.json(
      { status: "error", message: "Selecione um arquivo de comprovante para enviar." },
      { status: 400 }
    );
  }

  try {
    assertImage(proofFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Formato de arquivo inválido.";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }

  const ext = sanitizeExt(proofFile.type);

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        payment: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { status: "error", message: "Compra não encontrada." },
        { status: 404 }
      );
    }

    if (purchase.userId !== Number(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Você não tem permissão para alterar esta compra." },
        { status: 403 }
      );
    }

    if (!purchase.payment) {
      return NextResponse.json(
        { status: "error", message: "Pagamento não localizado para esta compra." },
        { status: 400 }
      );
    }

    const arrayBuffer = await proofFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const receiptUrl = await storePaymentReceipt(
      String(purchase.userId),
      String(purchaseId),
      ext,
      buffer,
      { originalName: proofFile.name }
    );

    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "AGUARDANDO_EMISSAO",
        payment: {
          update: {
            receiptUrl,
            status: "PENDENTE",
          },
        },
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
        passengers: true,
        payment: true,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Comprovante recebido! Sua compra está aguardando emissão.",
      purchase: serializePurchase(updated),
    });
  } catch (error) {
    console.error("Erro ao anexar comprovante", error);
    return NextResponse.json(
      { status: "error", message: "Não foi possível salvar o comprovante. Tente novamente." },
      { status: 500 }
    );
  }
}
