import type { DashboardNavItem } from "./_components/dashboard-shell";

export const dashboardNavItems: DashboardNavItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    icon: "overview",
    href: "/dashboard#overview",
  },
  {
    id: "users",
    label: "Usuários",
    icon: "users",
    href: "/dashboard#users",
  },
  {
    id: "settings",
    label: "Configurações",
    icon: "settings",
    href: "/dashboard#settings",
  },
  {
    id: "destinations",
    label: "Cadastro de destinos",
    icon: "destinations",
    href: "/dashboard/destinos",
  },
  {
    id: "backgrounds",
    label: "Backgrounds",
    icon: "backgrounds",
    href: "/dashboard/backgrounds",
  },
];
