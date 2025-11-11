import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

import { PurchaseForm } from "@/components/purchases/purchase-form";
import { serializeDestination } from "@/lib/destinations";
import { prisma } from "@/lib/prisma";

type PageParams = {
  destinationId: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

async function getDestination(destinationId: number) {
  const prismaClient = prisma;

  if (!prismaClient) {
    return null;
  }

  try {
    return await prismaClient.destination.findUnique({ where: { id: destinationId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.warn("Não foi possível conectar ao banco de dados para carregar o destino.", error.message);
      return null;
    }

    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const destinationId = Number(resolvedParams.destinationId);

  if (!Number.isFinite(destinationId) || !Number.isInteger(destinationId) || destinationId <= 0) {
    return {
      title: "Destino não encontrado",
    };
  }

  const destination = await getDestination(destinationId);

  if (!destination) {
    return {
      title: "Destino não encontrado",
    };
  }

  return {
    title: `Comprar pacote: ${destination.name}`,
    description: `Finalize a compra do pacote para ${destination.name}.`,
  };
}

export default async function DestinationPurchasePage({ params }: PageProps) {
  const resolvedParams = await params;
  const destinationId = Number(resolvedParams.destinationId);

  if (!Number.isFinite(destinationId) || !Number.isInteger(destinationId) || destinationId <= 0) {
    notFound();
  }

  const destination = await getDestination(destinationId);

  if (!destination) {
    notFound();
  }

  const serializedDestination = serializeDestination(destination);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white py-12">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <PurchaseForm destination={serializedDestination} />
      </div>
    </main>
  );
}
