import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { authSecret } from "./lib/auth-secret";

const LOGIN_PATH = "/login";

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));

  if (!hasSessionCookie) {
    return false;
  }

  if (!authSecret) {
    return true;
  }

  const token = await getToken({
    req: request,
    secureCookie: request.nextUrl.protocol === "https:",
    secret: authSecret,
  });

  return Boolean(token);
}

export async function middleware(request: NextRequest) {
  if (await isAuthenticated(request)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
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
