"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  type DestinationFormState,
  destinationFormSchema,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertImage, sanitizeExt } from "@/lib/file";
import { storeDestinationPhoto } from "@/lib/storage";

export async function createDestination(
  _prevState: DestinationFormState,
  formData: FormData
): Promise<DestinationFormState> {
  // Garante que apenas usuários autenticados possam cadastrar destinos.
  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para criar um destino.",
    };
  }

  // Normaliza as URLs de fotos informadas manualmente no formulário.
  const photosRaw = String(formData.get("photos") ?? "");
  const manualPhotos = photosRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  // Separa os arquivos enviados via upload para validação e armazenamento.
  const photoFiles = formData
    .getAll("photoFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const uploadedPhotos: string[] = [];
  const uploadErrors: string[] = [];

  for (const file of photoFiles) {
    try {
      // Valida o tipo do arquivo e encaminha para o storage configurado.
      assertImage(file);
      const ext = sanitizeExt(file.type);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageUrl = await storeDestinationPhoto(
        String(session.user.id),
        ext,
        buffer,
        {
          originalName: file.name,
        }
      );
      uploadedPhotos.push(imageUrl);
    } catch (error) {
      console.error("Erro ao enviar foto de destino", error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.";
      uploadErrors.push(`${file.name || "Arquivo"}: ${message}`);
    }
  }

  if (uploadErrors.length > 0) {
    return {
      status: "error",
      message: "Não foi possível enviar todas as imagens selecionadas.",
      errors: { photoFiles: uploadErrors },
    };
  }

  // Junta e remove duplicidades entre URLs manuais e fotos recém-enviadas.
  const photos = Array.from(new Set([...manualPhotos, ...uploadedPhotos]));

  // Faz o parse dos campos utilizando o schema do Zod para garantir consistência.
  const parsed = destinationFormSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    departureLocation: formData.get("departureLocation"),
    description: formData.get("description"),
    price: formData.get("price"),
    peopleCount: formData.get("peopleCount"),
    totalSeats: formData.get("totalSeats"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rating: formData.get("rating"),
    photos,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      errors,
    };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Banco de dados indisponível no momento. Tente novamente mais tarde.",
    };
  }

  try {
    // Persiste o destino no banco, convertendo valores numéricos quando necessário.
    await prisma.destination.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        departureLocation: parsed.data.departureLocation,
        description: parsed.data.description,
        price: new Prisma.Decimal(parsed.data.price),
        peopleCount: parsed.data.peopleCount,
        totalSeats: parsed.data.totalSeats,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        rating: parsed.data.rating,
        photos: parsed.data.photos,
        userId: Number(session.user.id),
      },
    });
  } catch (error) {
    console.error("Erro ao criar destino", error);
    return {
      status: "error",
      message: "Não foi possível criar o destino. Tente novamente mais tarde.",
    };
  }

  // Atualiza o cache das páginas que exibem a lista de destinos.
  revalidatePath("/destinos");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/destinos");

  return {
    status: "success",
    message: "Destino criado com sucesso!",
  };
}

export async function updateDestination(
  _prevState: DestinationFormState,
  formData: FormData
): Promise<DestinationFormState> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para editar um destino.",
    };
  }

  const destinationIdRaw = formData.get("destinationId");
  const destinationId = Number(destinationIdRaw);

  if (!destinationIdRaw || Number.isNaN(destinationId) || !Number.isInteger(destinationId)) {
    return {
      status: "error",
      message: "Destino inválido informado para edição.",
    };
  }

  const photosRaw = String(formData.get("photos") ?? "");
  const manualPhotos = photosRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  const photoFiles = formData
    .getAll("photoFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const uploadedPhotos: string[] = [];
  const uploadErrors: string[] = [];

  for (const file of photoFiles) {
    try {
      assertImage(file);
      const ext = sanitizeExt(file.type);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageUrl = await storeDestinationPhoto(String(user.id), ext, buffer, {
        originalName: file.name,
      });
      uploadedPhotos.push(imageUrl);
    } catch (error) {
      console.error("Erro ao enviar foto de destino", error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.";
      uploadErrors.push(`${file.name || "Arquivo"}: ${message}`);
    }
  }

  if (uploadErrors.length > 0) {
    return {
      status: "error",
      message: "Não foi possível enviar todas as imagens selecionadas.",
      errors: { photoFiles: uploadErrors },
    };
  }

  const photos = Array.from(new Set([...manualPhotos, ...uploadedPhotos]));

  const parsed = destinationFormSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    departureLocation: formData.get("departureLocation"),
    description: formData.get("description"),
    price: formData.get("price"),
    peopleCount: formData.get("peopleCount"),
    totalSeats: formData.get("totalSeats"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rating: formData.get("rating"),
    photos,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      errors,
    };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Banco de dados indisponível no momento. Tente novamente mais tarde.",
    };
  }

  try {
    const existingDestination = await prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, userId: true },
    });

    if (!existingDestination) {
      return {
        status: "error",
        message: "Destino não encontrado.",
      };
    }

    if (
      existingDestination.userId !== Number(user.id) &&
      user.role !== "admin"
    ) {
      return {
        status: "error",
        message: "Você não tem permissão para editar este destino.",
      };
    }

    await prisma.destination.update({
      where: { id: destinationId },
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        departureLocation: parsed.data.departureLocation,
        description: parsed.data.description,
        price: new Prisma.Decimal(parsed.data.price),
        peopleCount: parsed.data.peopleCount,
        totalSeats: parsed.data.totalSeats,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        rating: parsed.data.rating,
        photos: parsed.data.photos,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar destino", error);
    return {
      status: "error",
      message: "Não foi possível atualizar o destino. Tente novamente mais tarde.",
    };
  }

  revalidatePath("/destinos");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/destinos");
  revalidatePath(`/dashboard/destinos/${destinationId}/editar`);

  return {
    status: "success",
    message: "Destino atualizado com sucesso!",
  };
}
