import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedMatchers = ["/dashboard", "/api/profile", "/usuario"];

async function isAuthenticated(request: NextRequest) {
  try {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req: request, secret });
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
  matcher: ["/dashboard/:path*", "/api/profile/:path*", "/usuario/:path*"],
};
