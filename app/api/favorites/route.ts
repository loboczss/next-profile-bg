import { NextResponse } from "next/server";
import { z } from "zod";

import { serializeDestination } from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  destinationId: z.coerce.number().int().positive(),
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonResponse(
      {
        status: "error",
        message: "É necessário estar autenticado para favoritar destinos.",
      },
      401
    );
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const body = await request.json();
    const result = bodySchema.safeParse(body);
    if (!result.success) {
      return jsonResponse(
        {
          status: "error",
          message: "Dados inválidos enviados para favoritar o destino.",
          errors: result.error.flatten().fieldErrors,
        },
        400
      );
    }
    parsedBody = result.data;
  } catch {
    return jsonResponse(
      {
        status: "error",
        message: "Não foi possível ler os dados enviados.",
      },
      400
    );
  }

  const userId = Number(session.user.id);
  const { destinationId } = parsedBody;

  if (!prisma) {
    return jsonResponse(
      {
        status: "error",
        message: "Banco de dados indisponível. Configure o DATABASE_URL.",
      },
      500,
    );
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return jsonResponse(
        {
          status: "error",
          message: "Destino não encontrado.",
        },
        404
      );
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_destinationId: {
          userId,
          destinationId,
        },
      },
    });

    const favorite =
      existingFavorite ??
      (await prisma.favorite.create({
        data: {
          userId,
          destinationId,
        },
      }));

    const serializedDestination = {
      ...serializeDestination(destination),
      isFavorite: true,
      favoriteCreatedAt: favorite.createdAt.toISOString(),
    };

    return jsonResponse({
      status: "success",
      destination: serializedDestination,
    });
  } catch (error) {
    console.error("Erro ao favoritar destino", error);
    return jsonResponse(
      {
        status: "error",
        message: "Não foi possível adicionar o destino aos favoritos.",
      },
      500
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonResponse(
      {
        status: "error",
        message: "É necessário estar autenticado para remover favoritos.",
      },
      401
    );
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const body = await request.json();
    const result = bodySchema.safeParse(body);
    if (!result.success) {
      return jsonResponse(
        {
          status: "error",
          message: "Dados inválidos enviados para remover o favorito.",
          errors: result.error.flatten().fieldErrors,
        },
        400
      );
    }
    parsedBody = result.data;
  } catch {
    return jsonResponse(
      {
        status: "error",
        message: "Não foi possível ler os dados enviados.",
      },
      400
    );
  }

  const userId = Number(session.user.id);
  const { destinationId } = parsedBody;

  if (!prisma) {
    return jsonResponse(
      {
        status: "error",
        message: "Banco de dados indisponível. Configure o DATABASE_URL.",
      },
      500,
    );
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return jsonResponse(
        {
          status: "error",
          message: "Destino não encontrado.",
        },
        404
      );
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_destinationId: {
          userId,
          destinationId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
    }

    const serializedDestination = {
      ...serializeDestination(destination),
      isFavorite: false,
      favoriteCreatedAt: null,
    };

    return jsonResponse({
      status: "success",
      destination: serializedDestination,
    });
  } catch (error) {
    console.error("Erro ao remover favorito", error);
    return jsonResponse(
      {
        status: "error",
        message: "Não foi possível remover o destino dos favoritos.",
      },
      500
    );
  }
}
