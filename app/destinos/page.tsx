import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { CreateDestinationForm } from "@/components/destinations/create-destination-form";
import { DestinationGrid } from "@/components/destinations/destination-grid";
import {
  DestinationFormState,
  destinationFormSchema,
  type DestinationDeleteState,
  serializeDestination,
  type SerializedDestination,
} from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertImage, sanitizeExt } from "@/lib/file";
import { storeDestinationPhoto } from "@/lib/storage";

export const runtime = "nodejs";

// Ação server-side responsável por criar novos destinos a partir do formulário da página.
async function createDestination(
  _prevState: DestinationFormState,
  formData: FormData
): Promise<DestinationFormState> {
  "use server";

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
      const imageUrl = await storeDestinationPhoto(String(session.user.id), ext, buffer, {
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

  // Junta e remove duplicidades entre URLs manuais e fotos recém-enviadas.
  const photos = Array.from(new Set([...manualPhotos, ...uploadedPhotos]));

  // Faz o parse dos campos utilizando o schema do Zod para garantir consistência.
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
    // Retorna os erros de validação para que o formulário mostre mensagens ao usuário.
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      errors,
    };
  }

  try {
    // Persiste o destino no banco, convertendo valores numéricos quando necessário.
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

  // Atualiza o cache das páginas que exibem a lista de destinos.
  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino criado com sucesso!",
  };
}

// Ação server-side responsável por remover destinos cadastrados pelo usuário.
async function deleteDestination(
  _prevState: DestinationDeleteState,
  formData: FormData
): Promise<DestinationDeleteState> {
  "use server";

  // Verifica se há um usuário autenticado antes de realizar a exclusão.
  const session = await auth();
  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Você precisa estar autenticado para excluir um destino.",
    };
  }

  const destinationIdRaw = formData.get("destinationId");
  const destinationId = Number(destinationIdRaw);

  if (!destinationIdRaw || Number.isNaN(destinationId) || !Number.isInteger(destinationId)) {
    // Bloqueia requisições com identificadores inválidos.
    return {
      status: "error",
      message: "Destino inválido.",
    };
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, userId: true },
    });

    if (!destination) {
      return {
        status: "error",
        message: "Destino não encontrado.",
      };
    }

    if (destination.userId !== Number(session.user.id)) {
      // Impede que um usuário exclua destinos de terceiros.
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

  // Revalida as páginas que exibem o destino removido.
  revalidatePath("/destinos");
  revalidatePath("/");

  return {
    status: "success",
    message: "Destino excluído com sucesso!",
  };
}

// Página que lista todos os destinos cadastrados e oferece formulários para criação e exclusão.
export default async function DestinationsPage() {
  // Recupera a sessão para saber se o usuário pode gerenciar destinos.
  const session = await auth();

  let destinations: SerializedDestination[] = [];
  let destinationsError = false;
  try {
    // Busca todos os destinos ordenados por data de criação.
    const destinationsFromDb = await prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
    });
    destinations = destinationsFromDb.map(serializeDestination);
  } catch (error) {
    console.error("Erro ao buscar destinos", error);
    destinationsError = true;
  }

  return (
    // Estrutura principal composta por cabeçalho, formulário e grid de destinos.
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
          // Usuários logados visualizam o formulário de criação.
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
            // Mensagem exibida quando a consulta ao banco falha.
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Não foi possível carregar os destinos no momento. Tente novamente mais tarde.
            </p>
          ) : (
            // Grid de destinos com suporte a exclusão quando o usuário está autenticado.
            <DestinationGrid
              destinations={destinations}
              onDelete={session?.user ? deleteDestination : undefined}
            />
          )}
        </div>
      </section>
    </main>
  );
}
