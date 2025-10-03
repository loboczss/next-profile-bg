// app/signin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

const hasGoogleOAuth = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
const hasCredentialsAuth = Boolean(prisma);

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth (endpoints automáticos) */}
          {hasGoogleOAuth ? (
            <form action="/api/auth/signin/google" method="post">
              <input type="hidden" name="callbackUrl" value="/dashboard?login=success" />
              <Button type="submit" className="w-full">
                Entrar com Google
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure as variáveis <code>AUTH_GOOGLE_ID</code> e <code>AUTH_GOOGLE_SECRET</code>{" "}
              para habilitar o login com Google.
            </p>
          )}

          {/* Credenciais (endpoint automático) */}
          {hasCredentialsAuth ? (
            <form
              action="/api/auth/callback/credentials"
              method="post"
              className="space-y-2"
            >
              <input type="hidden" name="callbackUrl" value="/dashboard?login=success" />
              <input
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="senha"
                className="w-full border rounded px-3 py-2"
                required
              />
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Adicione um banco de dados e configure a variável <code>DATABASE_URL</code> para habilitar o login com credenciais.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
