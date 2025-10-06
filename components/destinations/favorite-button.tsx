"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  destinationId: number;
  initialIsFavorite: boolean;
  canFavorite: boolean;
  onStatusChange?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  destinationId,
  initialIsFavorite,
  canFavorite,
  onStatusChange,
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [optimisticFavorite, setOptimisticFavorite] = useState(initialIsFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
    setOptimisticFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const tooltipLabel = useMemo(
    () => (optimisticFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"),
    [optimisticFavorite]
  );

  const buildLoginRedirect = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const query = params.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handleUnauthorized = () => {
    toast.info("Entre na sua conta para gerenciar favoritos.");
    router.push(buildLoginRedirect());
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSubmitting) {
      return;
    }

    if (!canFavorite) {
      handleUnauthorized();
      return;
    }

    const nextState = !optimisticFavorite;
    setOptimisticFavorite(nextState);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/favorites", {
        method: nextState ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destinationId }),
      });

      const data = (await response.json().catch(() => null)) as
        | { status?: string; message?: string; destination?: { isFavorite?: boolean | null } }
        | null;

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
        } else {
          toast.error(data?.message ?? "Não foi possível atualizar seus favoritos.");
        }
        setOptimisticFavorite(isFavorite);
        return;
      }

      const serverState = data?.destination?.isFavorite ?? nextState;
      setIsFavorite(Boolean(serverState));
      setOptimisticFavorite(Boolean(serverState));
      onStatusChange?.(Boolean(serverState));

      toast.success(
        Boolean(serverState)
          ? "Destino adicionado aos favoritos!"
          : "Destino removido dos favoritos."
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar favorito", error);
      setOptimisticFavorite(isFavorite);
      toast.error("Não foi possível atualizar seus favoritos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "group/favorite relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white/85 text-slate-500 shadow-lg shadow-slate-900/5 transition",
        "hover:-translate-y-0.5 hover:border-pink-500/40 hover:bg-pink-500/15 hover:text-pink-500",
        optimisticFavorite &&
          "border-pink-500/40 bg-pink-500/15 text-pink-500 hover:bg-pink-500/20",
        isSubmitting && "pointer-events-none opacity-70"
      )}
      onClick={handleClick}
      onPointerDown={(event) => event.stopPropagation()}
      aria-pressed={optimisticFavorite}
      aria-label={tooltipLabel}
      title={tooltipLabel}
    >
      <Heart
        className={cn(
          "size-5 transition-transform duration-300",
          optimisticFavorite
            ? "scale-110 fill-current text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.35)]"
            : "text-slate-500"
        )}
      />
      <span className="sr-only">{tooltipLabel}</span>
    </button>
  );
}
