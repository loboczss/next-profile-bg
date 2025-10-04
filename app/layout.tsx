import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { auth } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Next Profile BG",
  description: "Gerencie foto de perfil e background com Next.js",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Navbar user={session?.user ?? null} />
        <div className="pt-20 lg:pt-24">{children}</div>
      </body>
    </html>
  );
}
