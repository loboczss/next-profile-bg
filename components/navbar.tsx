"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { dashboardNavItems } from "@/app/dashboard/nav-items";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: Session["user"] | null;
  favoriteCount?: number;
}

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AdminMenuLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const adminSubmenuIconMap: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  destinations: MapPin,
  purchases: ShoppingBag,
  backgrounds: ImageIcon,
};

const adminMenuDescriptions: Record<string, string> = {
  overview: "Panorama geral de métricas e atividade",
  destinations: "Curadoria e criação de novos destinos",
  purchases: "Pedidos e registros financeiros",
  backgrounds: "Personalização visual da vitrine",
};

const adminMenuLinks: AdminMenuLink[] = dashboardNavItems.map((item) => ({
  href: item.href ?? `/dashboard#${item.id}`,
  label: item.label,
  description: adminMenuDescriptions[item.id] ?? "Ir para a área", 
  icon: adminSubmenuIconMap[item.icon] ?? LayoutDashboard,
}));

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

const MOBILE_DRAWER_EASE = [0.4, 0, 0.2, 1] as const;

const MOBILE_DRAWER_VARIANTS = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: "0%",
    transition: { duration: 0.18, ease: MOBILE_DRAWER_EASE },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.16, ease: MOBILE_DRAWER_EASE },
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
        "relative grid place-items-center overflow-hidden rounded-full border border-[color:var(--brand-secondary-soft)] bg-white text-[color:var(--brand-secondary)]/70",
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
        className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-secondary-soft)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--brand-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand-primary)]/60 hover:shadow-md hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)] active:translate-y-[1px]"
      >
        <UserAvatar image={user?.image} name={userDisplayName} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[11px] uppercase tracking-wide text-[color:var(--brand-secondary)]/60">Olá</span>
          <span className="block font-semibold text-[color:var(--brand-secondary)]">{userDisplayName.split(" ")[0]}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-[color:var(--brand-secondary)]/60 transition-transform", isOpen && "rotate-180")}
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
            className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 rounded-2xl border border-[color:var(--brand-secondary-soft)] bg-white p-3 text-sm text-[color:var(--brand-secondary)]/80 shadow-lg shadow-[rgba(0,27,114,0.12)]"
          >
            <div className="flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--brand-secondary)_8%,white)] p-3">
              <UserAvatar image={user?.image} name={userDisplayName} />
              <div className="space-y-0.5">
                <p className="font-semibold text-[color:var(--brand-secondary)]">{userDisplayName}</p>
                <p className="text-xs text-[color:var(--brand-secondary)]/60">{user?.email}</p>
              </div>
            </div>

            <nav className="mt-3 grid gap-1" aria-label="Menu do usuário">
              <Link
                href="/usuario"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_10%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
              >
                <User className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                Meu perfil
              </Link>
              <Link
                href="/minhas-compras"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_10%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
              >
                <ShoppingBag className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                Minhas compras
              </Link>
              <Link
                href="/favoritos"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_10%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
              >
                <Heart className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                <span className="flex items-center gap-2">
                  Favoritos
                  {hasFavorites ? (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_25%,white)] px-2 text-xs font-semibold text-[color:var(--brand-primary)]">
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
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-[color:var(--brand-primary)]/30 bg-[color-mix(in_srgb,var(--brand-primary)_18%,white)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-primary)] transition-colors hover:border-[color:var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_25%,white)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)] active:translate-y-[1px]"
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
    <nav
      className="hidden items-center gap-3 rounded-full border border-transparent bg-transparent px-2 py-1 lg:flex"
      aria-label="Principal"
    >
      {navigationLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
              "text-[color:var(--brand-secondary)]/70 hover:text-[color:var(--brand-secondary)] hover:bg-[color-mix(in_srgb,var(--brand-secondary)_8%,white)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]",
              isActive && "bg-[color-mix(in_srgb,var(--brand-secondary)_12%,white)] text-[color:var(--brand-secondary)] shadow-sm",
            )}
          >
            <Icon
              className="h-4 w-4 text-[color:var(--brand-secondary)]/50 transition-transform duration-200 group-hover:-translate-y-0.5"
              aria-hidden
            />
            <span className="tracking-wide">{label}</span>
            {isActive ? (
              <motion.span
                layoutId="desktop-active-indicator"
                className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[color:var(--brand-primary)]"
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminMenu({
  isOpen,
  onToggle,
  onClose,
  adminLink,
  links,
  isActive,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  adminLink: NavLink;
  links: AdminMenuLink[];
  isActive: boolean;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const AdminIcon = adminLink.icon;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative hidden lg:block">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={cn(
          "group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#001b72] via-[#2436ad] to-[#ea002a] px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(0,27,114,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[rgba(234,0,42,0.4)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]",
          isActive && "ring-2 ring-[color:var(--brand-primary)]/70 ring-offset-2 ring-offset-white",
          isOpen && "translate-y-[1px] shadow-md",
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white transition-all group-hover:bg-white/25">
          <AdminIcon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="flex items-center gap-1">
          {adminLink.label}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
            aria-hidden
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-3 w-72 rounded-2xl border border-[color:var(--brand-secondary-soft)] bg-white/95 p-3 text-sm text-[color:var(--brand-secondary)] shadow-xl shadow-[rgba(0,27,114,0.15)] backdrop-blur"
          >
            <Link
              href={adminLink.href}
              onClick={onClose}
              className="flex items-center justify-between rounded-xl bg-[color-mix(in_srgb,var(--brand-secondary)_8%,white)] px-3 py-2 font-semibold text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_12%,white)]"
            >
              <span className="flex items-center gap-2">
                <AdminIcon className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                Ir para o painel
              </span>
              <ArrowUpRight className="h-4 w-4 text-[color:var(--brand-secondary)]/60" aria-hidden />
            </Link>

            <div className="mt-3 space-y-1">
              {links.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_10%,white)]"
                  >
                    <span className="flex items-center gap-2 text-[color:var(--brand-secondary)]">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--brand-secondary)_8%,white)] text-[color:var(--brand-secondary)]">
                        <ItemIcon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-xs text-[color:var(--brand-secondary)]/70">{item.description}</span>
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[color:var(--brand-secondary)]/50" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
}) {
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);

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
            className="fixed inset-0 z-40 bg-[rgba(0,16,58,0.55)] backdrop-blur-sm"
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
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto border-l border-[color:var(--brand-secondary-soft)] bg-white px-4 pb-6 pt-4 shadow-xl focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-[color:var(--brand-secondary)]/60">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--brand-secondary-soft)] text-[color:var(--brand-secondary)] transition-colors hover:border-[color:var(--brand-primary)]/50 hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>

            <nav className="grid gap-2" aria-label="Principal">
              {navigationLinks.map(({ href, label, icon: Icon }, index) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    ref={index === 0 ? firstItemRef : undefined}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-[color:var(--brand-secondary-soft)] px-4 py-3 text-base font-medium transition-colors",
                      "text-[color:var(--brand-secondary)] hover:border-[color:var(--brand-primary)]/50 hover:bg-[color-mix(in_srgb,var(--brand-secondary)_10%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]",
                      "active:translate-y-[1px]",
                      isActive && "border-[color:var(--brand-primary)]/50 bg-[color-mix(in_srgb,var(--brand-secondary)_12%,white)] text-[color:var(--brand-secondary)]",
                    )}
                  >
                    <Icon className="h-5 w-5 text-[color:var(--brand-secondary)]/60" aria-hidden />
                    <span className="flex items-center gap-2">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {isAuthenticated ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--brand-secondary-soft)] bg-[color-mix(in_srgb,var(--brand-secondary)_8%,white)] p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar image={user?.image} name={userDisplayName} />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[color:var(--brand-secondary)]">{userDisplayName}</p>
                    <p className="text-xs text-[color:var(--brand-secondary)]/60">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <Link
                    href="/usuario"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
                  >
                    <User className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                    Meu perfil
                  </Link>
                  <Link
                    href="/minhas-compras"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
                  >
                    <ShoppingBag className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                    Minhas compras
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[color:var(--brand-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,white)] hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
                  >
                    <Heart className="h-4 w-4 text-[color:var(--brand-primary)]" aria-hidden />
                    <span className="flex items-center gap-2">
                      Favoritos
                      {hasFavorites ? (
                        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_25%,white)] px-2 text-xs font-semibold text-[color:var(--brand-primary)]">
                          {favoriteBadgeLabel}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--brand-primary)]/30 bg-[color-mix(in_srgb,var(--brand-primary)_18%,white)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-primary)] transition-colors hover:border-[color:var(--brand-primary)]/45 hover:bg-[color-mix(in_srgb,var(--brand-primary)_25%,white)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]"
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
                  className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--brand-secondary-soft)] bg-white px-3 py-3 text-base font-semibold text-[color:var(--brand-secondary)] transition-colors hover:border-[color:var(--brand-primary)]/50 hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]"
                >
                  <LogIn className="h-5 w-5" aria-hidden />
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[color:var(--brand-primary)] px-3 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--brand-primary-strong)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]"
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
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const isScrolled = useScrollState();
  const headerRef = useRef<HTMLElement>(null);

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

  const navigationLinks = baseLinks;

  const adminLink: NavLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
  };

  const toggleUserMenu = useCallback(() => setUserMenuOpen((previous) => !previous), []);
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
  const toggleAdminMenu = useCallback(() => setAdminMenuOpen((previous) => !previous), []);
  const closeAdminMenu = useCallback(() => setAdminMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((previous) => !previous), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const updateNavbarHeight = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${headerRef.current.offsetHeight}px`,
        );
      }
    });
  }, []);

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
    closeAdminMenu();
  }, [pathname, closeMobileMenu, closeUserMenu, closeAdminMenu]);

  useEffect(() => {
    updateNavbarHeight();
  }, [updateNavbarHeight, isScrolled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => updateNavbarHeight();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateNavbarHeight]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.removeProperty("--navbar-height");
      }
    };
  }, []);

  const headerClasses = cn(
    "fixed inset-x-0 top-0 z-50 border-b border-[color:var(--brand-secondary-soft)] transition-[padding,background,box-shadow] duration-200",
    isScrolled ? "bg-white/95 backdrop-blur-md shadow-[0_6px_24px_rgba(0,16,58,0.12)] py-2.5" : "bg-white/98 py-4",
  );

  return (
    <header ref={headerRef} className={headerClasses}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-full px-2 py-1.5 text-[color:var(--brand-secondary)] transition-colors hover:text-[color:var(--brand-primary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]"
        >
          <Image src="/evastur-logo.svg" alt="Evastur" width={128} height={32} priority className="h-6 w-auto" />
          
        </Link>

        <DesktopNavigation navigationLinks={navigationLinks} pathname={pathname} />

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <AdminMenu
                    isOpen={adminMenuOpen}
                    onToggle={toggleAdminMenu}
                    onClose={closeAdminMenu}
                    adminLink={adminLink}
                    links={adminMenuLinks}
                    isActive={pathname.startsWith("/dashboard")}
                  />
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
                  "inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-secondary-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand-primary)]/50 hover:shadow-sm hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)]",
                  pathname.startsWith("/login") && "border-[color:var(--brand-primary)]/60",
                )}
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Entrar
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-primary-strong)] hover:shadow-sm focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-primary)]"
              >
                Criar conta
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--brand-secondary-soft)] text-[color:var(--brand-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand-primary)]/50 hover:text-[color:var(--brand-secondary)] focus-visible:outline focus-visible:[outline-width:2px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-secondary)] lg:hidden"
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
        />
      </div>
    </header>
  );
}
