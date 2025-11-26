import type { DashboardNavItem } from "./_components/dashboard-shell";

export const dashboardNavItems: DashboardNavItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    icon: "overview",
    href: "/dashboard#overview",
  },
  {
    id: "destinations",
    label: "Cadastro de destinos",
    icon: "destinations",
    href: "/dashboard/destinos",
  },
  {
    id: "purchases",
    label: "Compras",
    icon: "purchases",
    href: "/dashboard/compras",
  },
  {
    id: "backgrounds",
    label: "Backgrounds",
    icon: "backgrounds",
    href: "/dashboard/backgrounds",
  },
];
