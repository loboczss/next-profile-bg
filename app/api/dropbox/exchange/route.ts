// app/api/dropbox/exchange/route.ts
import { NextResponse } from "next/server";

function basicAuth(appKey: string, appSecret: string) {
  return Buffer.from(`${appKey}:${appSecret}`).toString("base64");
}

export async function GET(req: Request) {
  // Por simplicidade, aceito ?code=... via GET
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const redirectUri = searchParams.get("redirect_uri") 
    // se não vier na query, tento deduzir o callback padrão local
    ?? "http://localhost:3000/api/dropbox/callback";

  if (!code) {
    return new NextResponse("Faltou ?code=...", { status: 400 });
  }

  const APP_KEY = process.env.DROPBOX_APP_KEY;
  const APP_SECRET = process.env.DROPBOX_APP_SECRET;
  if (!APP_KEY || !APP_SECRET) {
    return new NextResponse(
      "Configure DROPBOX_APP_KEY e DROPBOX_APP_SECRET no .env",
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", redirectUri);

  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(APP_KEY, APP_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const txt = await res.text();
    return new NextResponse(
      `Falha ao trocar code por token.\n\n${txt}`,
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const json = await res.json();

  // Mostro em texto para você copiar fácil no navegador
  const out = [
    "Cole no seu .env (ou salve no cofre de segredos):",
    "",
    `DROPBOX_REFRESH_TOKEN=${json.refresh_token || "<NÃO VEIO>"}`,
    "",
    "Access token atual (expira em ~4h):",
    json.access_token,
    "",
    "Dica: guarde SOMENTE o refresh_token em produção; gere access tokens sob demanda.",
  ].join("\n");

  return new NextResponse(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
