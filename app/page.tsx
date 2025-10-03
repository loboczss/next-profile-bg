import Link from "next/link";
import { getServerSession } from "next-auth";
import { User, Image as ImageIcon, Brush } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginSuccessToast } from "@/components/login-success-toast";
import { prisma } from "@/lib/db";
import { authOptions } from "@/auth";

async function getDemoUser() {
  if (!process.env.DATABASE_URL || !prisma) {
    return { user: null, activeBg: null, totalBgs: 0 } as const;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: "demo@site.com" },
      include: {
        profile: { include: { activeBg: true } },
        backgrounds: true,
      },
    });

    return {
      user,
      activeBg: user?.profile?.activeBg ?? null,
      totalBgs: user?.backgrounds?.length ?? 0,
    } as const;
  } catch (error) {
    console.error("Failed to load demo user", error);
    return { user: null, activeBg: null, totalBgs: 0 } as const;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const loggedInUser = session?.user ?? null;
  const { user, activeBg, totalBgs } = await getDemoUser();

  return (
    <main className="min-h-dvh flex flex-col">
      <SiteHeader />
      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <LoginSuccessToast />
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Next Profile BG</h1>
            <p className="text-muted-foreground mt-2">
              Base visual + banco de dados pronto (Prisma + Postgres).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{loggedInUser ? "Sua conta" : "Usuário Demo"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loggedInUser ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                      {loggedInUser.image ? (
                        <AvatarImage
                          src={loggedInUser.image}
                          alt={loggedInUser.name ?? loggedInUser.email ?? "Usuário"}
                        />
                      ) : (
                        <AvatarFallback className="text-lg">
                          {(loggedInUser.name || loggedInUser.email || "?")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{loggedInUser.name ?? loggedInUser.email}</p>
                      {loggedInUser.email && loggedInUser.name && (
                        <p className="text-sm text-muted-foreground">{loggedInUser.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <p>
                      <strong>Email:</strong> {user?.email ?? "—"}
                    </p>
                    <p>
                      <strong>Nome:</strong> {user?.name ?? "—"}
                    </p>
                    <p>
                      <strong>Backgrounds salvos:</strong> {totalBgs}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Background Ativo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {activeBg ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeBg.imageUrl} alt="Background ativo" className="w-full h-48 object-cover rounded-xl border" />
                    <p className="text-sm text-muted-foreground break-all">{activeBg.imageUrl}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhum background ativo.</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="default" asChild>
                    <Link href={loggedInUser ? "/dashboard" : "/signin"}>
                      <User className="mr-2 h-4 w-4" />
                      {loggedInUser ? "Minha conta" : "Login"}
                    </Link>
                  </Button>
                  <Button variant="secondary"><ImageIcon className="mr-2 h-4 w-4" /> Trocar Foto de Perfil</Button>
                  <Button variant="outline"><Brush className="mr-2 h-4 w-4" /> Alterar Background</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
