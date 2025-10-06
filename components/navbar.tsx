"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  Menu,
  X,
  ChevronDown,
  BookmarkIcon,
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
  const isAdmin = user?.role === "admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = () => {
    void signOut({ redirectTo: "/" });
  };

  const primaryLinks = [
    { href: "/", label: "Início", icon: Home, color: "text-blue-400" },
    { href: "/destinos", label: "Destinos", icon: MapPin, color: "text-emerald-400" },
    { href: "/sobre-nos", label: "Sobre nós", icon: Info, color: "text-purple-400" },
  ];

  const userDisplayName = user?.name?.trim() ? user.name : "Usuário";
  const userFirstName = userDisplayName.split(" ")[0];

  const adminLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
    color: "text-amber-400",
  } as const;
  const AdminIcon = adminLink.icon;

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const closeUserMenu = () => setUserMenuOpen(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/70 before:to-transparent",
      )}
    >
      <div className="relative border-b border-white/10 bg-gradient-to-b from-background/60 to-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 md:py-4">
          {/* LOGO - Compacta e Elegante */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group relative flex items-center gap-3 px-2 py-1.5 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Logo com animações sutis */}
            <span className="relative">
              {/* Glow azul suave de fundo 
              <span className="pointer-events-none absolute -inset-3 blur-xl opacity-0 transition-all duration-500 group-hover:opacity-60">
                <span className="absolute inset-0 bg-blue-500/40" />
                <span className="absolute inset-0 bg-red-500/25" />
              </span>
              */}
              
              {/* Anel de luz rotativo único */}
              <span className="pointer-events-none absolute -inset-6 opacity-0 transition-opacity duration-500 group-hover:opacity-70">
                <span className="absolute inset-0 animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,theme(colors.blue.400/30)_90deg,transparent_180deg,theme(colors.red.400/30)_270deg,transparent_360deg)]" />
              </span>
              
              {/* Logo principal */}
              <Image
                src="/evastur-logo.png"
                alt="Evastur"
                width={120}
                height={24}
                priority
                className="relative z-10 h-6 w-auto select-none object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_16px_rgba(59,130,246,0.6)] sm:h-7"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.25)) contrast(1.05) brightness(1.03)',
                  imageRendering: 'crisp-edges',
                }}
              />
              
              {/* Partículas de brilho sutis */}
              <span className="pointer-events-none absolute -right-2 -top-1 size-1.5 rounded-full bg-blue-400 opacity-0 shadow-[0_0_6px_theme(colors.blue.400)] transition-all duration-500 group-hover:opacity-80 group-hover:animate-ping" />
              <span className="pointer-events-none absolute -left-1 bottom-0 size-1 rounded-full bg-red-400 opacity-0 shadow-[0_0_4px_theme(colors.red.400)] transition-all duration-500 group-hover:opacity-80 group-hover:animate-ping" style={{ animationDelay: '0.3s' }} />
            </span>

            {/* Texto ao lado da logo 
              <span className="hidden flex-col sm:flex">
                <span className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-red-500 bg-clip-text text-transparent">
                    Evastur
                  </span>
                  <Sparkles className="size-4 text-yellow-400 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-muted-foreground transition-colors duration-300 group-hover:text-blue-300/60">
                  Experiências que brilham ✦
                </span>
              </span>
              */}
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden flex-1 items-center justify-end gap-2 lg:flex lg:gap-3">
            <div className="flex items-center gap-1">
              {primaryLinks.map(({ href, label, icon: Icon, color }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group/nav relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5",
                      isActive && "border-primary/30 bg-primary/5 text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(60%_120%_at_50%_150%,theme(colors.primary/20),transparent)] opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100",
                        isActive && "opacity-100",
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-4 transition-transform duration-300 group-hover/nav:scale-110",
                        isActive ? "text-primary" : color,
                      )}
                    />
                    <span>{label}</span>
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

            {/* DESKTOP USER ACTIONS - Melhorado */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    href={adminLink.href}
                    className={cn(
                      "group/admin inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-amber-500/5",
                      pathname.startsWith("/dashboard") &&
                        "border-amber-400/30 bg-amber-500/5 text-primary",
                    )}
                  >
                    <AdminIcon
                      className={cn(
                        "size-4 transition-transform duration-300 group-hover/admin:scale-110",
                        pathname.startsWith("/dashboard") ? "text-primary" : adminLink.color
                      )}
                    />
                    {adminLink.label}
                    <Crown className="ml-1 size-3 text-amber-400 opacity-60 transition-opacity duration-300 group-hover/admin:opacity-100" />
                  </Link>
                )}

                {/* Dropdown do Usuário */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleUserMenu}
                    className="group/user inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] px-3 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={userDisplayName}
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 rounded-full border-2 border-white/20 object-cover ring-2 ring-cyan-400/20 transition-all duration-300 group-hover/user:scale-[1.08] group-hover/user:border-cyan-400/40 group-hover/user:ring-cyan-400/40"
                      />
                    ) : (
                      <span className="grid size-8 place-items-center rounded-full border-2 border-white/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-400/20 transition-all duration-300 group-hover/user:scale-[1.08] group-hover/user:border-cyan-400/40 group-hover/user:ring-cyan-400/40">
                        <User className="size-4 text-cyan-400" />
                      </span>
                    )}
                    <span className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground">Olá,</span>
                      <span className="font-semibold leading-tight">{userFirstName}</span>
                    </span>
                    <ChevronDown className={cn(
                      "size-4 text-muted-foreground transition-transform duration-300",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={closeUserMenu}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-xl shadow-black/20 backdrop-blur-xl">
                        <div className="border-b border-white/10 p-4">
                          <p className="text-sm font-semibold">{userDisplayName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/usuario"
                            onClick={closeUserMenu}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                          >
                            <User className="size-4 text-cyan-400" />
                            Meu Perfil
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

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
                  "group/login inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-green-400/30 hover:bg-green-500/5",
                  pathname.startsWith("/login") &&
                    "border-primary/30 bg-primary/5 text-primary",
                )}
              >
                <LogIn className={cn(
                  "size-4 transition-transform duration-300 group-hover/login:scale-110",
                  pathname.startsWith("/login") ? "text-primary" : "text-green-400"
                )} />
                Entrar
              </Link>
            )}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] p-2.5 text-foreground shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out lg:hidden",
            mobileMenuOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <nav className="border-t border-white/10 bg-background/95 px-4 py-4 backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              {primaryLinks.map(({ href, label, icon: Icon, color }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "group/nav relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-base font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:border-primary/30 hover:bg-primary/5",
                      isActive && "border-primary/30 bg-primary/5 text-primary",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 transition-transform duration-300 group-hover/nav:scale-110",
                        isActive ? "text-primary" : color,
                      )}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <>
                  <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  {/* Card do Usuário no Mobile */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[inset_0_1px_0_theme(colors.white/10)]">
                    <div className="mb-3 flex items-center gap-3">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={userDisplayName}
                          width={48}
                          height={48}
                          unoptimized
                          className="size-12 rounded-full border-2 border-white/20 object-cover ring-2 ring-cyan-400/20"
                        />
                      ) : (
                        <span className="grid size-12 place-items-center rounded-full border-2 border-white/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-400/20">
                          <User className="size-6 text-cyan-400" />
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{userDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Link
                        href="/usuario"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                      >
                        <User className="size-4 text-cyan-400" />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/usuario/favoritos"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                      >
                        <BookmarkIcon className="size-4 text-pink-400" />
                        Favoritos
                      </Link>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      href={adminLink.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "group/admin flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-base font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:border-primary/30 hover:bg-primary/5",
                        pathname.startsWith("/dashboard") &&
                          "border-primary/30 bg-primary/5 text-primary",
                      )}
                    >
                      <AdminIcon
                        className={cn(
                          "size-5",
                          pathname.startsWith("/dashboard") ? "text-primary" : adminLink.color
                        )}
                      />
                      <span className="flex-1">{adminLink.label}</span>
                      <Crown className="size-4 text-amber-400 opacity-60" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-base font-medium text-red-500 shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    <LogOut className="size-5" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className={cn(
                      "group/login flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-base font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:border-primary/30 hover:bg-primary/5",
                      pathname.startsWith("/login") &&
                        "border-primary/30 bg-primary/5 text-primary",
                    )}
                  >
                    <LogIn className={cn(
                      "size-5",
                      pathname.startsWith("/login") ? "text-primary" : "text-green-400"
                    )} />
                    <span>Entrar</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}