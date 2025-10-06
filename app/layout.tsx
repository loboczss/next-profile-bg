import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import "./globals.css";

// Metadados globais utilizados pelo Next.js para configurar título e descrição padrão.
export const metadata: Metadata = {
  title: "Evastur",
  description: "Gerencie foto de perfil e background com Next.js",
};

// Layout raiz que envolve todas as páginas com a barra de navegação e estilos globais.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Recupera a sessão para passar o usuário autenticado ao componente Navbar.
  const session = await auth();
  let favoriteCount = 0;

  if (session?.user?.id) {
    try {
      favoriteCount = await prisma.favorite.count({
        where: { userId: Number(session.user.id) },
      });
    } catch (error) {
      console.error("Erro ao contar favoritos do usuário", error);
    }
  }

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Navbar user={session?.user ?? null} favoriteCount={favoriteCount} />
        <div className="pt-20 lg:pt-24">{children}</div>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
