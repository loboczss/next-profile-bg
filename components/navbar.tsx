"use client"; // necessário para usar usePathname (torna Client Component)

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  User,
  Sparkles,
  Crown,
} from "lucide-react";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: Session["user"] | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const isAuthenticated = Boolean(user);

  const handleSignOut = () => {
    void signOut({ redirectTo: "/" });
  };

  const primaryLinks = [
    { href: "/", label: "Início", icon: Home },
    { href: "/destinos", label: "Destinos", icon: MapPin },
    { href: "/sobre-nos", label: "Sobre nós", icon: Info },
  ];

  const userDisplayName = user?.name?.trim() ? user.name : "Usuário";

  const adminLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
  } as const;
  const AdminIcon = adminLink.icon;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/70 before:to-transparent",
      )}
    >
      <div className="relative border-b border-white/10 bg-gradient-to-b from-background/60 to-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:py-4">
          {/* LOGO */}
          <Link
            href="/"
            className="group relative flex items-center gap-3 rounded-2xl px-2 py-1 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_theme(colors.white/10)]">
              <span className="pointer-events-none absolute -inset-[120%] bg-[conic-gradient(from_90deg,theme(colors.primary/0),theme(colors.primary/25),theme(colors.primary/0))] animate-[spin_8s_linear_infinite]" />
              <Image
                src="/evastur-logo.png"
                alt="Evastur"
                width={32}
                height={32}
                priority
                className="relative z-10 size-8 select-none object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.06]"
              />
            </span>
            <span className="flex flex-col">
              <span className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Evastur
                </span>
                <Sparkles className="size-4 opacity-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </span>
              <span className="text-[11px] font-medium leading-4 text-muted-foreground">
                Experiências que brilham ✦
              </span>
            </span>
          </Link>

          {/* NAV LINKS */}
          <nav className="flex flex-1 items-center justify-end gap-2 md:gap-3">
            <div className="hidden items-center gap-1 md:flex">
              {primaryLinks.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group/nav relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/10 bg-white/[0.02] shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5",
                      isActive && "text-primary border-primary/30 bg-primary/5",
                    )}
                  >
                    {/* highlight radial */}
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100 bg-[radial-gradient(60%_120%_at_50%_150%,theme(colors.primary/20),transparent)]",
                        isActive && "opacity-100",
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-4 transition-transform duration-300 group-hover/nav:scale-110",
                        isActive && "text-primary",
                      )}
                    />
                    <span>{label}</span>
                    {/* sublinhado persistente */}
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-px left-1/2 h-[2px] w-0 -translate-x-1/2 rounded bg-primary/70 transition-all duration-500 group-hover/nav:w-4/5",
                        isActive && "w-4/5",
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            {/* AÇÕES DO USUÁRIO */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/usuario"
                  className="group/user inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                >
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={userDisplayName}
                      className="size-8 rounded-full border border-white/15 object-cover transition-transform duration-300 group-hover/user:scale-[1.06]"
                    />
                  ) : (
                    <User className="size-4 transition-transform duration-300 group-hover/user:scale-110" />
                  )}
                  <span className="font-medium">{userDisplayName}</span>
                </Link>

                <Link
                  href={adminLink.href}
                  className={cn(
                    "group/admin inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5",
                    pathname.startsWith("/dashboard") &&
                      "text-primary border-primary/30 bg-primary/5",
                  )}
                >
                  <AdminIcon className="size-4 transition-transform duration-300 group-hover/admin:scale-110" />
                  {adminLink.label}
                  <Crown className="ml-1 size-3 opacity-60 group-hover/admin:opacity-100 transition-opacity duration-300" />
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                    className="group/logout inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.06] px-4 py-2 text-sm font-medium text-red-500 shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-red-500/10"
                >
                  <LogOut className="size-4 transition-transform duration-300 group-hover/logout:scale-110" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "group/login inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5",
                  pathname.startsWith("/login") &&
                    "text-primary border-primary/30 bg-primary/5",
                )}
              >
                <LogIn className="size-4 transition-transform duration-300 group-hover/login:scale-110" />
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
