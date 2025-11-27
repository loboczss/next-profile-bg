import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseStatusSchema, serializePurchase, type TicketDetails } from "@/lib/purchases";

const ticketDetailsSchema = z.object({
  locator: z.string({ required_error: "Informe o localizador (PNR)." }).trim().min(1, "Informe o localizador."),
  departureDate: z
    .string({ required_error: "Informe a data de embarque." })
    .trim()
    .min(1, "Informe a data de embarque."),
  returnDate: z
    .string({ required_error: "Informe a data de retorno." })
    .trim()
    .min(1, "Informe a data de retorno."),
  outboundDepartureTime: z
    .string({ required_error: "Informe a hora de embarque do trecho de ida." })
    .trim()
    .min(1, "Informe a hora de embarque do trecho de ida."),
  outboundArrivalTime: z
    .string({ required_error: "Informe a hora de chegada do trecho de ida." })
    .trim()
    .min(1, "Informe a hora de chegada do trecho de ida."),
  returnDepartureTime: z
    .string({ required_error: "Informe a hora de embarque do trecho de volta." })
    .trim()
    .min(1, "Informe a hora de embarque do trecho de volta."),
  returnArrivalTime: z
    .string({ required_error: "Informe a hora de chegada do trecho de volta." })
    .trim()
    .min(1, "Informe a hora de chegada do trecho de volta."),
  fareType: z
    .string({ required_error: "Informe o tipo de tarifa." })
    .trim()
    .min(1, "Informe o tipo de tarifa."),
  airline: z
    .string({ required_error: "Informe a companhia aérea." })
    .trim()
    .min(1, "Informe a companhia aérea."),
  flightNumber: z
    .string({ required_error: "Informe o número do voo." })
    .trim()
    .min(1, "Informe o número do voo."),
  passengerNames: z
    .array(
      z
        .string({ required_error: "Informe o nome do passageiro." })
        .trim()
        .min(1, "Informe o nome do passageiro."),
      { invalid_type_error: "Informe os nomes dos passageiros." }
    )
    .min(1, "Informe ao menos um passageiro."),
});

const passengerUpdateSchema = z.object({
  id: z.coerce.number({ invalid_type_error: "Passageiro inválido." }).int().positive().optional(),
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
    ticketDetails: ticketDetailsSchema.optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.observacao !== undefined ||
      data.passengers !== undefined ||
      data.ticketDetails !== undefined,
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

class TicketDetailsRequiredError extends Error {
  constructor() {
    super("TICKET_DETAILS_REQUIRED");
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

  const { status, observacao, passengers, ticketDetails } = parsed.data;

  const sanitizedTicketDetails: TicketDetails | undefined = ticketDetails
    ? {
        locator: ticketDetails.locator.trim(),
        departureDate: ticketDetails.departureDate.trim(),
        returnDate: ticketDetails.returnDate.trim(),
        outboundDepartureTime: ticketDetails.outboundDepartureTime.trim(),
        outboundArrivalTime: ticketDetails.outboundArrivalTime.trim(),
        returnDepartureTime: ticketDetails.returnDepartureTime.trim(),
        returnArrivalTime: ticketDetails.returnArrivalTime.trim(),
        fareType: ticketDetails.fareType.trim(),
        airline: ticketDetails.airline.trim(),
        flightNumber: ticketDetails.flightNumber.trim(),
        passengerNames: ticketDetails.passengerNames.map((name) => name.trim()).filter(Boolean),
      }
    : undefined;

  if (sanitizedTicketDetails && sanitizedTicketDetails.passengerNames.length === 0) {
    return NextResponse.json(
      {
        status: "error",
        message: "Informe os nomes completos dos passageiros.",
      },
      { status: 400 }
    );
  }

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const passengerUpdates = passengers ?? [];
      const passengersToCreate = passengerUpdates.filter((passenger) => !passenger.id);
      const passengersToUpdate = passengerUpdates.filter((passenger) => passenger.id);

      if (passengersToUpdate.length > 0) {
        for (const passenger of passengersToUpdate) {
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

      if (passengersToCreate.length > 0) {
        await tx.passenger.createMany({
          data: passengersToCreate.map((passenger) => ({
            purchaseId,
            fullName: passenger.fullName,
            cpf: passenger.cpf,
            birthDate: passenger.birthDate,
            phone: passenger.phone,
            email: passenger.email,
          })),
        });
      }

      const dataToUpdate: Record<string, unknown> = {};

      if (status) {
        if (status === "EMITIDA") {
          const purchaseWithDetails = await tx.purchase.findUnique({
            where: { id: purchaseId },
            include: { payment: true },
          });

          if (!purchaseWithDetails) {
            throw new PurchaseNotFoundError();
          }

          const existingDetails =
            sanitizedTicketDetails ?? (purchaseWithDetails.ticketDetails as TicketDetails | null);

          if (!existingDetails || existingDetails.passengerNames.length === 0) {
            throw new TicketDetailsRequiredError();
          }
        }

        dataToUpdate.status = status;
      }

      if (observacao !== undefined) {
        dataToUpdate.observacao = observacao;
      }

      if (sanitizedTicketDetails) {
        dataToUpdate.ticketDetails = sanitizedTicketDetails;
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

    if (error instanceof TicketDetailsRequiredError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Preencha os detalhes obrigatórios da passagem para concluir a emissão.",
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
