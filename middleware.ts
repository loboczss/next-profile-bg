import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

const protectedMatchers = [
  "/dashboard",
  "/api/profile",
  "/usuario",
  "/favoritos",
  "/api/favorites",
];
export default auth(async (request) => {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedMatchers.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (request.auth) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(redirectUrl);
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/profile/:path*",
    "/usuario/:path*",
    "/favoritos",
    "/api/favorites/:path*",
  ],
};
