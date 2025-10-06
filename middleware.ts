import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth(async (request) => {
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
