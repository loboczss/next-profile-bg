import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import LoginPageClient from "./login-page-client";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

const DEFAULT_AUTHENTICATED_DESTINATION = "/usuario";
const ADMIN_DESTINATION = "/dashboard";

function resolveRedirectDestination(
  callbackUrl: string | undefined,
  role: string | null | undefined,
): string {
  if (callbackUrl && callbackUrl !== "/" && callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  if (role === "admin") {
    return ADMIN_DESTINATION;
  }

  return DEFAULT_AUTHENTICATED_DESTINATION;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    const destination = resolveRedirectDestination(searchParams?.callbackUrl, session.user.role);
    redirect(destination);
  }

  return <LoginPageClient />;
}
