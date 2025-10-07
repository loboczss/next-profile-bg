"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
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

const MOBILE_MENU_ID = "primary-navigation-mobile";

const MOBILE_DRAWER_VARIANTS = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: "0%",
    transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  },
};

function useScrollState(threshold = 12) {
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

function UserAvatar({
  image,
  name,
  size = "md",
}: {
  image: string | null | undefined;
  name: string;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "size-8" : "size-10";
  const responsiveSize = size === "sm" ? "32px" : "40px";
  return (
    <span
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-500",
        dimension,
      )}
      aria-hidden
    >
      {image ? (
        <Image src={image} alt={name} fill sizes={responsiveSize} className="object-cover" />
      ) : (
        <User className="h-4 w-4" />
      )}
    </span>
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
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="user-menu-panel"
        className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-blue-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:translate-y-[1px]"
      >
        <UserAvatar image={user?.image} name={userDisplayName} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[11px] uppercase tracking-wide text-slate-500">Olá</span>
          <span className="block font-semibold text-slate-800">{userDisplayName.split(" ")[0]}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-500 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="user-menu-panel"
            ref={menuRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserAvatar image={user?.image} name={userDisplayName} />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900">{userDisplayName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <nav className="mt-3 grid gap-1" aria-label="Menu do usuário">
              <Link
                href="/usuario"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <User className="h-4 w-4 text-blue-600" aria-hidden />
                Meu perfil
              </Link>
              <Link
                href="/favoritos"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <Heart className="h-4 w-4 text-rose-500" aria-hidden />
                <span className="flex items-center gap-2">
                  Favoritos
                  {hasFavorites ? (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-semibold text-rose-600">
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
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:translate-y-[1px]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DesktopNavigation({ navigationLinks, pathname }: { navigationLinks: NavLink[]; pathname: string }) {
  return (
    <nav className="hidden items-center gap-1 rounded-full border border-transparent bg-transparent px-1 py-0.5 lg:flex" aria-label="Principal">
      {navigationLinks.map(({ href, label, icon: Icon, badge }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
              isActive ? "text-slate-900" : undefined,
            )}
          >
            <Icon className="h-4 w-4 text-slate-400" aria-hidden />
            <span className="relative pb-1">
              <span className="inline-flex items-center gap-2">
                {label}
                {badge ? (
                  <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-rose-100 px-1.5 text-[0.65rem] font-semibold text-rose-600">
                    {badge}
                  </span>
                ) : null}
              </span>
              {isActive ? (
                <motion.span
                  layoutId="desktop-active-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600"
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                />
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation({
  isOpen,
  onClose,
  navigationLinks,
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
  isOpen: boolean;
  onClose: () => void;
  navigationLinks: NavLink[];
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
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);
  const AdminIcon = adminLink.icon;

  useEffect(() => {
    if (isOpen) {
      firstItemRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
            onClick={onClose}
          />
          <motion.aside
            key="mobile-nav"
            variants={MOBILE_DRAWER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Menu mobile"
            id={MOBILE_MENU_ID}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto border-l border-slate-200 bg-white px-4 pb-6 pt-4 shadow-xl focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>

            <nav className="grid gap-2" aria-label="Principal">
              {navigationLinks.map(({ href, label, icon: Icon, badge }, index) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    ref={index === 0 ? firstItemRef : undefined}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-base font-medium transition-colors",
                      "text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                      "active:translate-y-[1px]",
                      isActive && "border-blue-300 bg-blue-50 text-blue-700",
                    )}
                  >
                    <Icon className="h-5 w-5 text-slate-500" aria-hidden />
                    <span className="flex items-center gap-2">
                      {label}
                      {badge ? (
                        <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-rose-100 px-1.5 text-xs font-semibold text-rose-600">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {isAuthenticated ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar image={user?.image} name={userDisplayName} />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{userDisplayName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <Link
                    href="/usuario"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    <User className="h-4 w-4 text-blue-600" aria-hidden />
                    Meu perfil
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    <Heart className="h-4 w-4 text-rose-500" aria-hidden />
                    <span className="flex items-center gap-2">
                      Favoritos
                      {hasFavorites ? (
                        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-semibold text-rose-600">
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
                    className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  >
                    <AdminIcon className="h-4 w-4" aria-hidden />
                    {adminLink.label}
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sair
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  <LogIn className="h-5 w-5" aria-hidden />
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </motion.aside>
        </>
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

  const favoriteCountValue = Number.isFinite(favoriteCountProp) ? Math.max(0, Math.floor(favoriteCountProp)) : 0;
  const hasFavorites = favoriteCountValue > 0;
  const favoriteBadgeLabel = favoriteCountValue > 99 ? "99+" : `${favoriteCountValue}`;

  const userDisplayName = useMemo(() => (user?.name?.trim() ? user.name : "Usuário"), [user?.name]);

  const baseLinks: NavLink[] = [
    { href: "/", label: "Início", icon: Home },
    { href: "/destinos", label: "Destinos", icon: MapPin },
    { href: "/sobre-nos", label: "Sobre nós", icon: Info },
  ];

  const favoritesLink: NavLink | null = isAuthenticated
    ? {
        href: "/favoritos",
        label: "Favoritos",
        icon: Heart,
        badge: hasFavorites ? favoriteBadgeLabel : undefined,
      }
    : null;

  const navigationLinks = favoritesLink ? [...baseLinks, favoritesLink] : baseLinks;

  const adminLink: NavLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
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
    if (!mobileMenuOpen) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    document.body.style.setProperty("overflow", "hidden");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    closeMobileMenu();
    closeUserMenu();
  }, [pathname, closeMobileMenu, closeUserMenu]);

  const headerClasses = cn(
    "fixed inset-x-0 top-0 z-50 border-b border-slate-200 transition-[padding,background,box-shadow] duration-200",
    isScrolled ? "bg-white/95 backdrop-blur-md shadow-[0_4px_18px_rgba(15,23,42,0.08)] py-2.5" : "bg-white py-4",
  );

  return (
    <header className={headerClasses}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-full px-2 py-1.5 text-slate-800 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <Image src="/evastur-logo.png" alt="Evastur" width={128} height={32} priority className="h-7 w-auto" />
          <span className="hidden flex-col text-left leading-tight sm:flex">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evastur</span>
            <span className="text-sm text-slate-600">Experiências premium ao redor do mundo</span>
          </span>
        </Link>

        <DesktopNavigation navigationLinks={navigationLinks} pathname={pathname} />

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  href={adminLink.href}
                  className={cn(
                    "hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 lg:inline-flex",
                    pathname.startsWith("/dashboard") && "border-amber-300 bg-amber-100",
                  )}
                >
                  <AdminIcon className="h-4 w-4" aria-hidden />
                  {adminLink.label}
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
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                  pathname.startsWith("/login") && "border-blue-300 text-blue-700",
                )}
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Entrar
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Criar conta
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 lg:hidden"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">{mobileMenuOpen ? "Fechar menu" : "Abrir menu"}</span>
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileNavigation
          isOpen={mobileMenuOpen}
          onClose={closeMobileMenu}
          navigationLinks={navigationLinks}
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
      </div>
    </header>
  );
}
