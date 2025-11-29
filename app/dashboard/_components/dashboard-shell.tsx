"use client";

import { ReactNode, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Image,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  NotebookPen,
  Settings,
  ShoppingBag,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navIconComponents = {
  overview: LayoutDashboard,
  users: Users,
  backgrounds: Image,
  content: NotebookPen,
  settings: Settings,
  destinations: MapPin,
  purchases: ShoppingBag,
} as const satisfies Record<string, LucideIcon>;

export type DashboardNavIcon = keyof typeof navIconComponents;

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: DashboardNavIcon;
  href?: string;
};

interface DashboardShellProps {
  children: ReactNode;
  navItems: DashboardNavItem[];
  user: {
    name: string;
    role: string;
    imageUrl?: string | null;
  };
  backgroundUrl?: string | null;
  activeItemId?: string;
}

// Container principal responsável por organizar o layout com sidebar fixa,
// cabeçalho responsivo e área de conteúdo com animações suaves.
export function DashboardShell({
  children,
  navItems,
  user,
  backgroundUrl,
  activeItemId,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const initials = useMemo(() => {
    return user.name
      .split(" ")
      .map((chunk) => chunk.charAt(0)?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }, [user.name]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const renderNavItems = (variant: "desktop" | "mobile") =>
    navItems.map((item) => {
      const Icon = navIconComponents[item.icon] ?? LayoutDashboard;
      const href = item.href ?? `#${item.id}`;
      const isActive = item.id === activeItemId;

      const baseClasses =
        variant === "desktop"
          ? "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
          : "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition";

      const stateClasses =
        variant === "desktop"
          ? isActive
            ? "bg-white/80 text-slate-900 shadow-sm dark:bg-slate-900/70 dark:text-white"
            : "bg-white/30 text-slate-600 backdrop-blur-xl hover:bg-white/80 hover:text-slate-900 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white"
          : isActive
            ? "border-blue-300/70 bg-white/90 text-blue-700 dark:border-indigo-500/40 dark:bg-slate-900/90 dark:text-indigo-100"
            : "border-white/50 bg-white/80 text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200";

      return (
        <Link
          key={item.id}
          href={href}
          onClick={() => variant === "mobile" && setIsSidebarOpen(false)}
          className="group/nav block"
        >
          <span className={cn(baseClasses, stateClasses)} aria-current={isActive ? "page" : undefined}>
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        </Link>
      );
    });

  return (
    <div
      className={cn(
        "relative min-h-screen w-full bg-slate-100 transition-colors dark:bg-slate-950",
      )}
    >
      {/* Plano de fundo com imagem configurável e gradiente para manter o contraste. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/60 to-purple-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900",
            backgroundUrl ? "opacity-95" : "",
          )}
          style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl dark:bg-slate-950/70" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-2 sm:px-4 lg:px-8">
        {/* Sidebar fixa em telas grandes e drawer no mobile. */}
        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <motion.aside
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative hidden w-72 flex-col px-4 py-8 lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)]"
        >
          <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
            <div className="flex items-center gap-3 pb-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-xl">
                <span className="text-lg font-semibold">EV</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Painel</p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Administração</h1>
              </div>
            </div>

            <nav className="space-y-2">{renderNavItems("desktop")}</nav>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-500/90 via-indigo-500/90 to-purple-500/90 p-4 text-white shadow-2xl">
              <p className="text-xs uppercase tracking-wide opacity-70">Usuário ativo</p>
              <p className="mt-1 text-base font-semibold">{user.name}</p>
              <p className="text-sm opacity-80">Perfil: {user.role}</p>
            </div>
          </div>
        </motion.aside>

        {isSidebarOpen ? (
          <motion.nav
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-40 w-72 border-r border-white/60 bg-white/95 px-5 py-8 shadow-2xl backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
          >
            <div className="flex items-center justify-between pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Painel</p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administração</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Fechar menu lateral"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <nav className="grid gap-2">{renderNavItems("mobile")}</nav>
          </motion.nav>
        ) : null}

        {/* Conteúdo principal */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/40 bg-white/80 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                onClick={() => setIsSidebarOpen((state) => !state)}
                aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-slate-200/70 bg-white/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                  </div>
                  <Avatar className="h-10 w-10 border border-white/40">
                    <AvatarImage src={user.imageUrl ?? undefined} alt={user.name} />
                    <AvatarFallback>{initials || "EV"}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto px-4 py-10 sm:px-6 lg:px-12">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
