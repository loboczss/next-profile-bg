// app/signin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Entrar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth (endpoints automáticos) */}
          <form action="/api/auth/signin/google" method="post">
            <Button type="submit" className="w-full">Entrar com Google</Button>
          </form>
          <form action="/api/auth/signin/github" method="post">
            <Button type="submit" variant="secondary" className="w-full">Entrar com GitHub</Button>
          </form>

          {/* Credenciais (endpoint automático) */}
          <form action="/api/auth/callback/credentials" method="post" className="space-y-2">
            <input name="email" type="email" placeholder="email@exemplo.com" className="w-full border rounded px-3 py-2" required />
            <input name="password" type="password" placeholder="senha" className="w-full border rounded px-3 py-2" required />
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
