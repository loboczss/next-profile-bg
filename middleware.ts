import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { authSecret } from "./lib/auth-secret";

const protectedMatchers = [
  "/dashboard",
  "/api/profile",
  "/usuario",
  "/favoritos",
  "/api/favorites",
];



async function isAuthenticated(request: NextRequest) {
  try {
    if (!authSecret) {
      console.error(
        "AUTH_SECRET ou NEXTAUTH_SECRET não está definido. Configure a variável para proteger as rotas privadas.",
      );
      return false;
    }

    const token = await getToken({ req: request, secret: authSecret });
    return Boolean(token?.userId ?? token?.sub);
  } catch (error) {
    console.error("Erro ao validar token na middleware", error);
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedMatchers.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (await isAuthenticated(request)) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/profile/:path*",
    "/usuario/:path*",
    "/favoritos",
    "/api/favorites/:path*",
  ],
};
