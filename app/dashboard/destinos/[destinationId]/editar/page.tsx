import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EditDestinationForm } from "@/components/destinations/create-destination-form";
import { DashboardAnimatedWrapper } from "@/app/dashboard/dashboard-animated-wrapper";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { dashboardNavItems } from "@/app/dashboard/nav-items";
import { updateDestination } from "@/app/dashboard/actions";
import { serializeDestination } from "@/lib/destinations";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface EditDestinationPageProps {
  params: { destinationId: string };
}

export default async function EditDestinationPage({
  params,
}: EditDestinationPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  if (!prisma) {
    return (
      <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
        <DashboardShell
          navItems={dashboardNavItems}
          user={{
            name:
              session.user.fullName ??
              session.user.name ??
              session.user.username ??
              "Administrador",
            role: session.user.role,
            imageUrl: session.user.image ?? null,
          }}
          activeItemId="destinations"
        >
          <section className="space-y-6">
            <div className="rounded-3xl border border-rose-200/70 bg-rose-50/90 p-8 text-rose-900 shadow-sm">
              <h1 className="text-2xl font-semibold">Edição de destinos indisponível</h1>
              <p className="mt-3 text-sm text-rose-700">
                Não foi possível se conectar ao banco de dados. Configure a variável
                <code className="mx-1 rounded bg-rose-100 px-1.5 py-0.5">DATABASE_URL</code>
                e tente novamente em instantes.
              </p>
            </div>
          </section>
        </DashboardShell>
      </DashboardAnimatedWrapper>
    );
  }

  const destinationId = Number(params.destinationId);

  if (!Number.isInteger(destinationId) || Number.isNaN(destinationId)) {
    notFound();
  }

  const destination = await prisma.destination.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    notFound();
  }

  const serializedDestination = serializeDestination(destination);

  const dashboardUserInfo = {
    name:
      session.user.fullName ??
      session.user.name ??
      session.user.username ??
      "Administrador",
    role: session.user.role,
    imageUrl: session.user.image ?? null,
  };

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell
        navItems={dashboardNavItems}
        user={dashboardUserInfo}
        activeItemId="destinations"
      >
        <section className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                Gestão de catálogo
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Editar destino</h1>
              <p className="text-sm text-slate-600">
                Altere as informações do pacote selecionado e mantenha a vitrine sempre atualizada.
              </p>
            </div>
            <Link
              href="/dashboard/destinos"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </div>

          <EditDestinationForm action={updateDestination} destination={serializedDestination} />
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
