"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">next-profile-bg</Link>
        <nav className="flex items-center gap-2">
          <Link href="/signin">
            <Button variant="ghost" size="icon" title="Login">
              <LogIn className="h-5 w-5" />
            </Button>
          </Link>
          <form action="/api/auth/signout" method="post">
            <Button variant="ghost" size="icon" title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
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
