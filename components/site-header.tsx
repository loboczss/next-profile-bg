"use client";

import Link from "next/link";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initials = useMemo(() => {
    if (!user) return "";
    const source = user.name || user.email || "";
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          next-profile-bg
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-full border px-3 py-1.5">
                <Avatar className="size-9">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? user.email ?? "Usuário"} />
                  ) : (
                    <AvatarFallback>{initials || <LogIn className="h-4 w-4" />}</AvatarFallback>
                  )}
                </Avatar>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name ?? user.email}</p>
                  {user.email && user.name && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
              </div>
              <form action="/api/auth/signout" method="post">
                <Button variant="ghost" size="icon" title="Sair">
                  <LogOut className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost" title="Entrar" className="px-3">
              <Link href="/signin">
                <LogIn className="h-5 w-5" />
                Entrar
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => mounted && setTheme(theme === "light" ? "dark" : "light")}
            title="Alternar tema"
          >
            {mounted && theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
