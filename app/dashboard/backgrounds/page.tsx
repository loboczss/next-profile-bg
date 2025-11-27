import { redirect } from "next/navigation";

import { BackgroundGalleryManager } from "@/components/BackgroundGalleryManager";
import { auth } from "@/lib/auth";
import { DashboardAnimatedWrapper } from "../dashboard-animated-wrapper";
import { DashboardShell } from "../_components/dashboard-shell";
import { dashboardNavItems } from "../nav-items";

export default async function DashboardBackgroundsPage() {
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
    <DashboardAnimatedWrapper userName={session.user.name ?? "Administrador"}>
      <DashboardShell navItems={navItems} user={dashboardUserInfo} activeItemId="backgrounds">
        <section id="backgrounds" className="space-y-8">
          <BackgroundGalleryManager />
        </section>
      </DashboardShell>
    </DashboardAnimatedWrapper>
  );
}
