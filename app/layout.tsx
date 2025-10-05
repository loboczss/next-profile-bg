import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { auth } from "@/lib/auth";

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

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Navbar user={session?.user ?? null} />
        <div className="pt-20 lg:pt-24">{children}</div>
      </body>
    </html>
  );
}
