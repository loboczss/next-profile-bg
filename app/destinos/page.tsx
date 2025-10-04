import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import {
  DestinationActionResult,
  DestinationFormState,
  destinationFormSchema,
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function createDestination(
  _prevState: DestinationFormState,
  formData: FormData
): Promise<DestinationFormState> {
  "use server";

  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para criar um destino.",
    };
  }

  const photosRaw = String(formData.get("photos") ?? "");
  const photos = photosRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  const parsed = destinationFormSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    description: formData.get("description"),
    price: formData.get("price"),
    peopleCount: formData.get("peopleCount"),
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

  try {
    await prisma.destination.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        description: parsed.data.description,
        price: new Prisma.Decimal(parsed.data.price),
        peopleCount: parsed.data.peopleCount,
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

  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino criado com sucesso!",
  };
}

async function deleteDestination(destinationId: number): Promise<DestinationActionResult> {
  "use server";

  const session = await auth();
  const userId = Number(session?.user?.id ?? NaN);

  if (!Number.isInteger(userId)) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para excluir um destino.",
    };
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      select: { userId: true },
    });

    if (!destination || destination.userId !== userId) {
      return {
        status: "error",
        message: "Você não tem permissão para excluir este destino.",
      };
    }

    await prisma.destination.delete({
      where: { id: destinationId },
    });
  } catch (error) {
    console.error("Erro ao excluir destino", error);
    return {
      status: "error",
      message: "Não foi possível excluir o destino. Tente novamente mais tarde.",
    };
  }

  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino excluído com sucesso!",
  };
}

export default async function DestinationsPage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  let destinations: SerializedDestination[] = [];
  let destinationsError = false;
  try {
    const destinationsFromDb = await prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
    });
    destinations = destinationsFromDb.map(serializeDestination);
  } catch (error) {
    console.error("Erro ao buscar destinos", error);
    destinationsError = true;
  }

  return (
    <main className="bg-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Destinos exclusivos
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Explore e cadastre experiências inesquecíveis
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Descubra os melhores roteiros para seus clientes e mantenha o catálogo sempre atualizado com novos destinos, fotos e informações completas.
          </p>
        </header>

        {session?.user ? (
          <CreateDestinationForm action={createDestination} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-600">
            Faça login para cadastrar novos destinos e gerenciar o catálogo da agência.
          </div>
        )}

        <div className="space-y-4" id="destinos">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Destinos cadastrados</h2>
            <span className="text-sm text-slate-500">
              {destinations.length} destino(s) disponível(is)
            </span>
          </div>

          {destinationsError ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Não foi possível carregar os destinos no momento. Tente novamente mais tarde.
            </p>
          ) : (
            <DestinationGrid
              destinations={destinations}
              deleteDestinationAction={deleteDestination}
              currentUserId={userId}
            />
          )}
        </div>
      </section>
    </main>
  );
}
