"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [shown, setShown] = useState(false);

  const loginStatus = searchParams.get("login");

  useEffect(() => {
    if (shown) return;
    if (loginStatus !== "success") return;

    toast.success("Login realizado com sucesso!");
    setShown(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("login");
    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [loginStatus, pathname, router, searchParams, shown]);

  return null;
}
