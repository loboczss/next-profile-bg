import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

const protectedMatchers = ["/dashboard", "/api/profile"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedMatchers.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const session = await auth(request);
  if (session?.user?.id) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/profile/:path*"],
};
