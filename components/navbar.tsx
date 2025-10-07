"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  Crown,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface NavbarProps {
  user: Session["user"] | null;
  favoriteCount?: number;
}

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  badge?: string;
};

type UserMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
  user: Session["user"] | null;
  userDisplayName: string;
  hasFavorites: boolean;
  favoriteBadgeLabel: string;
};

const NAV_ANIMATION = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const MOBILE_PANEL_VARIANTS = {
  hidden: { opacity: 0, height: 0, transition: { duration: 0.25, ease: "easeInOut" } },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

function useScrollState(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isScrolled;
}

function MobileBackdrop({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function UserMenu({
  isOpen,
  onToggle,
  onClose,
  onSignOut,
  user,
  userDisplayName,
  hasFavorites,
  favoriteBadgeLabel,
}: UserMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userFirstName = useMemo(
    () => (userDisplayName.trim() ? userDisplayName.split(" ")[0] : "Usuário"),
    [userDisplayName],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-[2px] hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-cyan-500/20"
      >
        <span className="relative grid size-9 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-indigo-500/25 text-white shadow-inner shadow-white/10">
          {user?.image ? (
            <Image
              src={user.image}
              alt={userDisplayName}
              width={36}
              height={36}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <User className="size-4" />
          )}
          <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-400/30" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Olá</span>
          <span className="font-semibold text-foreground">{userFirstName}</span>
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="absolute right-0 top-[calc(100%+12px)] z-40 w-64 overflow-hidden rounded-3xl border border-white/10 bg-background/95 shadow-xl shadow-black/10 backdrop-blur-xl"
            {...NAV_ANIMATION}
          >
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <span className="relative grid size-12 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-indigo-500/25 text-white shadow-inner shadow-white/10">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={userDisplayName}
                      width={48}
                      height={48}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-6" />
                  )}
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-400/30" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{userDisplayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>

              <nav className="grid gap-1 text-sm">
                <Link
                  href="/usuario"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-white/5"
                >
                  <User className="size-4 text-cyan-400" />
                  Meu Perfil
                </Link>
                <Link
                  href="/favoritos"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-white/5"
                >
                  <Heart className="size-4 text-pink-400" />
                  <span className="flex items-center gap-2">
                    Favoritos
                    {hasFavorites ? (
                      <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-pink-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-pink-500">
                        {favoriteBadgeLabel}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </nav>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/[0.12]"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DesktopNavigation({
  navigationLinks,
  pathname,
}: {
  navigationLinks: NavLink[];
  pathname: string;
}) {
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 shadow-[inset_0_1px_0_theme(colors.white/10)]">
        {navigationLinks.map(({ href, label, icon: Icon, colorClass, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="nav-pill"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                  transition={{ duration: 0.28, ease: [0.45, 0.05, 0.35, 1] }}
                />
              ) : null}
              <Icon className={cn("size-4 transition-colors", isActive ? "text-primary" : colorClass)} />
              <span className="flex items-center gap-1">
                {label}
                {badge ? (
                  <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-pink-500/20 px-1.5 py-0.5 text-[0.65rem] font-semibold text-pink-500">
                    {badge}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileNavigation({
  navigationLinks,
  isOpen,
  onClose,
  pathname,
  isAuthenticated,
  onSignOut,
  user,
  userDisplayName,
  hasFavorites,
  favoriteBadgeLabel,
  adminLink,
  isAdmin,
}: {
  navigationLinks: NavLink[];
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  isAuthenticated: boolean;
  onSignOut: () => void;
  user: Session["user"] | null;
  userDisplayName: string;
  hasFavorites: boolean;
  favoriteBadgeLabel: string;
  adminLink: NavLink;
  isAdmin: boolean;
}) {
  const AdminIcon = adminLink.icon;
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          className="fixed inset-x-4 top-20 z-40 origin-top rounded-3xl border border-white/10 bg-background/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl lg:hidden"
          variants={MOBILE_PANEL_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="space-y-4">
            <nav className="grid gap-2">
              {navigationLinks.map(({ href, label, icon: Icon, colorClass, badge }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-base font-medium transition-all duration-200",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
                    )}
                  >
                    <span className="relative">
                      <Icon className={cn("size-5", isActive ? "text-primary" : colorClass)} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        {label}
                        {badge ? (
                          <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-pink-500/20 px-2 py-0.5 text-[0.7rem] font-semibold text-pink-500">
                            {badge}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            {isAuthenticated ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <span className="relative grid size-12 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-indigo-500/25 text-white shadow-inner shadow-white/10">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={userDisplayName}
                        width={48}
                        height={48}
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="size-5" />
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-400/30" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{userDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <Link
                    href="/usuario"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-white/5"
                  >
                    <User className="size-4 text-cyan-400" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-white/5"
                  >
                    <Heart className="size-4 text-pink-400" />
                    <span className="flex items-center gap-2">
                      Favoritos
                      {hasFavorites ? (
                        <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-pink-500/20 px-2 py-0.5 text-[0.7rem] font-semibold text-pink-500">
                          {favoriteBadgeLabel}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </div>

                {isAdmin ? (
                  <Link
                    href={adminLink.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-all duration-200",
                      pathname.startsWith("/dashboard")
                        ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-foreground",
                    )}
                  >
                    <AdminIcon className="size-4 text-amber-400" />
                    <span className="flex items-center gap-2">
                      {adminLink.label}
                      <Crown className="size-4 text-amber-300" />
                    </span>
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/[0.08] px-3 py-2 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/[0.15]"
                >
                  <LogOut className="size-4" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-base font-semibold text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground",
                  pathname.startsWith("/login") && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                <LogIn className="size-5" />
                Entrar
              </Link>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export function Navbar({ user, favoriteCount: favoriteCountProp = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isScrolled = useScrollState();

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin";

  const favoriteCountValue = Number.isFinite(favoriteCountProp)
    ? Math.max(0, Math.floor(favoriteCountProp))
    : 0;
  const hasFavorites = favoriteCountValue > 0;
  const favoriteBadgeLabel = favoriteCountValue > 99 ? "99+" : `${favoriteCountValue}`;

  const userDisplayName = user?.name?.trim() ? user.name : "Usuário";

  const baseLinks: NavLink[] = [
    { href: "/", label: "Início", icon: Home, colorClass: "text-blue-400" },
    { href: "/destinos", label: "Destinos", icon: MapPin, colorClass: "text-emerald-400" },
    { href: "/sobre-nos", label: "Sobre nós", icon: Info, colorClass: "text-purple-400" },
  ];

  const favoritesLink: NavLink | null = isAuthenticated
    ? {
        href: "/favoritos",
        label: "Favoritos",
        icon: Heart,
        colorClass: "text-pink-400",
        badge: hasFavorites ? favoriteBadgeLabel : undefined,
      }
    : null;

  const navigationLinks = favoritesLink ? [...baseLinks, favoritesLink] : baseLinks;

  const adminLink: NavLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
    colorClass: "text-amber-400",
  };
  const AdminIcon = adminLink.icon;

  const toggleUserMenu = useCallback(() => setUserMenuOpen((previous) => !previous), []);
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((previous) => !previous), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleSignOut = () => {
    void signOut({ redirectTo: "/" });
  };

  useEffect(() => {
    closeMobileMenu();
    closeUserMenu();
  }, [closeMobileMenu, closeUserMenu, pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        isScrolled ? "bg-background/80 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(15,23,42,0.45)]" : "bg-transparent",
      )}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group relative inline-flex items-center gap-3 rounded-full px-3 py-2"
        >
          <span className="relative">
            <span className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-r from-sky-500/20 via-transparent to-rose-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src="/evastur-logo.png"
              alt="Evastur"
              width={132}
              height={28}
              priority
              className="relative z-10 h-7 w-auto transition-transform duration-500 group-hover:scale-105"
            />
          </span>
          <span className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Evastur</span>
            <span className="text-sm font-medium text-foreground/80">Experiências premium ao redor do mundo</span>
          </span>
        </Link>

        <DesktopNavigation navigationLinks={navigationLinks} pathname={pathname} />

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  href={adminLink.href}
                  className={cn(
                    "hidden items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-100 shadow-[inset_0_1px_0_theme(colors.white/20)] transition-all duration-300 hover:-translate-y-[2px] hover:border-amber-300/70 hover:bg-amber-400/20 lg:flex",
                    pathname.startsWith("/dashboard") && "border-amber-400/60 bg-amber-500/20",
                  )}
                >
                  <AdminIcon className="size-4" />
                  {adminLink.label}
                  <Crown className="size-4" />
                </Link>
              ) : null}

              <div className="hidden lg:block">
                <UserMenu
                  isOpen={userMenuOpen}
                  onToggle={toggleUserMenu}
                  onClose={closeUserMenu}
                  onSignOut={handleSignOut}
                  user={user}
                  userDisplayName={userDisplayName}
                  hasFavorites={hasFavorites}
                  favoriteBadgeLabel={favoriteBadgeLabel}
                />
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                "hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-primary/10 hover:text-foreground lg:inline-flex",
                pathname.startsWith("/login") && "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              <LogIn className="size-4" />
              Entrar
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-foreground shadow-[inset_0_1px_0_theme(colors.white/10)] transition-all duration-300 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-primary/10 lg:hidden"
            aria-label="Abrir menu"
            onClick={toggleMobileMenu}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={mobileMenuOpen ? "close" : "menu"}
                {...NAV_ANIMATION}
                transition={{ duration: 0.2 }}
                className="grid place-items-center"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <MobileBackdrop isVisible={mobileMenuOpen} onClose={closeMobileMenu} />
      <MobileNavigation
        navigationLinks={navigationLinks}
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        onSignOut={handleSignOut}
        user={user}
        userDisplayName={userDisplayName}
        hasFavorites={hasFavorites}
        favoriteBadgeLabel={favoriteBadgeLabel}
        adminLink={adminLink}
        isAdmin={isAdmin}
      />
    </header>
  );
}
