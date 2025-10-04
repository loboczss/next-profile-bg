import Image from "next/image";
import Link from "next/link";

import {
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  User,
} from "lucide-react";

import type { Session } from "next-auth";

import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: Session["user"] | null;
}

async function handleSignOut() {
  "use server";

  await signOut({ redirectTo: "/" });
}

export function Navbar({ user }: NavbarProps) {
  const isAuthenticated = Boolean(user);

  const primaryLinks = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/destinos",
      label: "Destinos",
      icon: MapPin,
    },
    {
      href: "/sobre-nos",
      label: "Sobre nós",
      icon: Info,
    },
  ];

  const userDisplayName = user?.name?.trim() ? user.name : "Usuário";

  const adminLink = {
    href: "/dashboard",
    label: "Painel Admin",
    icon: LayoutDashboard,
  } as const;
  const AdminIcon = adminLink.icon;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:flex-nowrap sm:gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
            <Image
              src="/globe.svg"
              alt="Logo da empresa"
              width={32}
              height={32}
              className="size-6 text-primary"
            />
          </span>
          <span className="text-lg font-semibold tracking-tight transition-colors duration-200 group-hover:text-primary">
            Next Profile BG
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center justify-end gap-2 text-sm font-medium md:gap-4">
          <div className="flex items-center gap-2">
            {primaryLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {label}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                href="/usuario"
                className="group flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={userDisplayName}
                    className="h-8 w-8 rounded-full border object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className="font-medium">{userDisplayName}</span>
              </Link>
              <Link
                href={adminLink.href}
                className="group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <AdminIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {adminLink.label}
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <LogIn className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Login
              </Link>
            )}
            {isAuthenticated && (
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className={cn(
                    "group flex items-center gap-2 rounded-full border border-transparent px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-destructive/30 hover:bg-destructive/10 text-destructive",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive/60",
                  )}
                >
                  <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  Sair
                </button>
              </form>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
