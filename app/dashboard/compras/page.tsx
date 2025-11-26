import { redirect } from "next/navigation";

import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { DashboardShell } from "../_components/dashboard-shell";
import { dashboardNavItems } from "../nav-items";
import { auth } from "@/lib/auth";
import { PurchasesPage } from "./purchases-page";

export const dynamic = "force-dynamic";

export default async function DashboardPurchasesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/usuario");
  }

  const navItems = dashboardNavItems;

  const dashboardUserInfo = {
    name: session.user.fullName ?? session.user.name ?? session.user.username ?? "Administrador",
    role: session.user.role,
    imageUrl: session.user.image ?? null,
  };

  return (
    <DashboardAnimatedWrapper userName={dashboardUserInfo.name}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="purchases">
        <section className="space-y-10">
          <PurchasesPage />
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
