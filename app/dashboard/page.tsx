import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-slate-600">
        Olá, <strong>{session.user.name ?? "usuário"}</strong>. Esta rota está protegida pelo middleware.
      </p>
    </div>
  );
}
