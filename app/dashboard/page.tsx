// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { LoginSuccessToast } from "@/components/login-success-toast";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <LoginSuccessToast />
      <h1 className="text-2xl font-bold">
        Olá, {session.user.name ?? session.user.email}
      </h1>
      <p className="text-muted-foreground mt-2">Esta página está protegida.</p>

      <form action="/api/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-sm"
          title="Sair"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
