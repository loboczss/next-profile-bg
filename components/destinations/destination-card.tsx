"use client";

import Link from "next/link";
import Image from "next/image";
import type { KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Heart,
  Loader2,
  MapPin,
  PlaneTakeoff,
  Star,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  destinationDeleteInitialState,
  type DestinationDeleteAction,
  type SerializedDestination,
} from "@/lib/destinations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { PurchaseButton } from "@/components/purchases/purchase-button";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "R$ 0";
  }

  return currencyFormatter.format(Math.max(0, Math.round(value)));
}

interface DestinationCardProps {
  destination: SerializedDestination;
  canFavorite?: boolean;
  onFavoriteChange?: (destinationId: number, isFavorite: boolean) => void;
  onDelete?: DestinationDeleteAction;
  className?: string;
}

export function DestinationCard({
  destination,
  canFavorite = false,
  onFavoriteChange,
  onDelete,
  className,
}: DestinationCardProps) {
  const [isFavorite, setIsFavorite] = useState(Boolean(destination.isFavorite));
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setIsFavorite(Boolean(destination.isFavorite));
  }, [destination.isFavorite]);

  const imageUrl = useMemo(() => {
    const validPhoto = destination.photos.find((photo) => photo.trim());

    if (validPhoto) {
      return validPhoto;
    }

    return "https://images.unsplash.com/photo-1511735643442-503bb3bd3482?q=80&w=1200&auto=format&fit=crop";
  }, [destination.photos]);

  const installmentValue = useMemo(() => {
    const total = Number(destination.price);
    const installments = 10;

    if (!Number.isFinite(total) || total <= 0) {
      return {
        installments,
        installmentLabel: `${installments}x de R$ 0`,
        cashLabel: "ou à vista por R$ 0",
      };
    }

    const installmentPrice = total / installments;
    return {
      installments,
      installmentLabel: `${installments}x de ${formatCurrency(installmentPrice)}`,
      cashLabel: `ou à vista por ${formatCurrency(total)}`,
    };
  }, [destination.price]);

  const subtitle = useMemo(() => {
    const fallback = "Passagem + hospedagem";
    const trimmedDescription = destination.description.trim();

    if (!trimmedDescription) {
      return fallback;
    }

    const firstSentence = trimmedDescription.split(/\n|\.|!/)[0]?.trim();

    if (!firstSentence) {
      return fallback;
    }

    if (firstSentence.length > 48) {
      return `${firstSentence.slice(0, 45)}…`;
    }

    return firstSentence;
  }, [destination.description]);

  const formattedPrice = useMemo(() => formatCurrency(destination.price), [
    destination.price,
  ]);

  const startDate = useMemo(() => {
    const parsed = new Date(destination.startDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [destination.startDate]);

  const endDate = useMemo(() => {
    const parsed = new Date(destination.endDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [destination.endDate]);

  const formattedStartDate = useMemo(() => {
    if (!startDate) {
      return "Data indisponível";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
    }).format(startDate);
  }, [startDate]);

  const formattedEndDate = useMemo(() => {
    if (!endDate) {
      return "Data indisponível";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
    }).format(endDate);
  }, [endDate]);

  const tripDuration = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }

    const diffInMs = endDate.getTime() - startDate.getTime();
    if (diffInMs < 0) {
      return null;
    }

    const dayInMs = 1000 * 60 * 60 * 24;
    const diffInDays = Math.max(1, Math.round(diffInMs / dayInMs) + 1);

    return `${diffInDays} ${diffInDays === 1 ? "noite" : "noites"}`;
  }, [endDate, startDate]);

  const galleryPhotos = useMemo(
    () => destination.photos.filter((photo) => photo.trim()),
    [destination.photos]
  );

  const handleToggleFavorite = useCallback(() => {
    if (!canFavorite) {
      toast.info("Entre na sua conta para salvar destinos nos favoritos.");
      return;
    }

    startTransition(async () => {
      const previousValue = isFavorite;
      setIsFavorite((current) => !current);

      try {
        const response = await fetch("/api/favorites", {
          method: previousValue ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationId: destination.id }),
        });

        const data = await response.json();

        if (!response.ok || data?.status !== "success") {
          throw new Error(data?.message ?? "Não foi possível atualizar o favorito.");
        }

        setIsFavorite(Boolean(data.destination?.isFavorite));
        onFavoriteChange?.(destination.id, Boolean(data.destination?.isFavorite));

        if (!previousValue) {
          toast.success("Destino adicionado aos favoritos!");
        } else {
          toast.success("Destino removido dos favoritos.");
        }
      } catch (error) {
        console.error(error);
        setIsFavorite(previousValue);
        toast.error(
          previousValue
            ? "Não foi possível remover dos favoritos. Tente novamente."
            : "Não foi possível adicionar aos favoritos. Tente novamente."
        );
      }
    });
  }, [canFavorite, destination.id, isFavorite, onFavoriteChange, startTransition]);

  const handleDelete = useCallback(
    async (formData: FormData) => {
      if (!onDelete) {
        return;
      }

      try {
        setIsDeleting(true);
        await onDelete(destinationDeleteInitialState, formData);
        toast.success("Destino removido com sucesso.");
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível remover o destino.");
      } finally {
        setIsDeleting(false);
      }
    },
    [onDelete]
  );

  const handleCardClick = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsDialogOpen(true);
      }
    },
    []
  );

  const handleFavoriteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleToggleFavorite();
    },
    [handleToggleFavorite]
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <article
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className={cn(
          "group relative flex h-[320px] w-[240px] shrink-0 flex-col overflow-hidden rounded-[32px] bg-slate-900 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(10,22,70,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-white/70",
          className
        )}
        aria-label={`Ver detalhes completos de ${destination.name}`}
      >
        <Image
          src={imageUrl}
          alt={`Foto de ${destination.name}`}
          fill
          sizes="(max-width: 768px) 80vw, 240px"
          priority={false}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-[18px] bg-white/95 shadow-[0_10px_30px_rgba(4,58,167,0.25)]">
            <Image src="/evastur-logo.svg" alt="Logo Evastur" width={32} height={32} className="object-contain" />
          </span>
        </div>

        {onDelete ? (
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            <Link
              href={`/dashboard/destinos/${destination.id}/editar`}
              className="inline-flex items-center gap-1 rounded-[18px] bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[0_10px_30px_rgba(4,58,167,0.2)] transition hover:bg-white"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              Editar
            </Link>

            <form
              className="flex"
              action={async (formData) => {
                formData.set("destinationId", String(destination.id));
                await handleDelete(formData);
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <input type="hidden" name="destinationId" value={destination.id} />
              <button
                type="submit"
                className="flex size-10 items-center justify-center rounded-[18px] bg-white/80 text-slate-900 shadow-[0_10px_30px_rgba(4,58,167,0.25)] transition hover:bg-white"
                aria-label={`Remover ${destination.name}`}
                disabled={isDeleting}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                {isDeleting ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
              </button>
            </form>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleFavoriteButtonClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              handleToggleFavorite();
            }
          }}
          className="absolute bottom-[120px] right-5 flex size-11 items-center justify-center rounded-full bg-white/80 text-pink-600 shadow-[0_10px_30px_rgba(234,0,42,0.25)] transition hover:bg-white"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Heart
              className={cn("size-5", isFavorite ? "fill-current" : "stroke-current")}
            />
          )}
        </button>

        <div className="absolute bottom-4 left-4 right-4 rounded-[26px] bg-[rgba(5,19,60,0.88)] p-4 text-white shadow-[0_18px_40px_-22px_rgba(0,0,0,0.65)] backdrop-blur-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight">{destination.name}</h3>
            <p className="text-[13px] font-medium text-white/80">{subtitle}</p>
          </div>
          <div className="mt-4 space-y-1 text-sm font-semibold text-white">
            <p className="rounded-[14px] bg-[rgba(25,90,255,0.92)] px-3 py-1 text-center text-[15px] font-semibold tracking-wide">
              {installmentValue.installmentLabel}
            </p>
            <p className="text-[13px] font-medium text-white/80">{installmentValue.cashLabel}</p>
          </div>
        </div>
      </article>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur">
        <div className="relative h-56 w-full sm:h-64">
          <Image
            src={imageUrl}
            alt={`Paisagem do destino ${destination.name}`}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 640px, 100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-3 text-white sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Destaque Evastur
              </p>
              <h2 className="text-2xl font-semibold leading-snug sm:text-3xl">
                {destination.name}
              </h2>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-white/80">
                <MapPin className="size-4" />
                {destination.city}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow">
                <Star className="size-4 text-amber-500" /> {destination.rating.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-8 pt-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              {destination.city}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {subtitle}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-relaxed text-slate-700">
            {destination.description}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Período
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" /> Ida: {formattedStartDate}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" /> Volta: {formattedEndDate}
                </p>
                {tripDuration ? (
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    {tripDuration}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Informações
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <PlaneTakeoff className="size-4 text-primary" /> Saída: {destination.departureLocation}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Até {destination.peopleCount} {destination.peopleCount === 1 ? "pessoa" : "pessoas"}
                </p>
                <p className="flex items-center gap-2">
                  <Ticket className="size-4 text-primary" /> {destination.totalSeats} {destination.totalSeats === 1 ? "vaga" : "vagas"} totais
                </p>
                <p className="flex items-center gap-2">
                  <Star className="size-4 text-amber-500" /> Avaliação {destination.rating.toFixed(1)}
                </p>
                <p className="flex items-center gap-2">
                  <Heart className="size-4 text-pink-500" /> Pacote a partir de {formattedPrice}
                </p>
              </div>
            </div>
          </div>

          {galleryPhotos.length > 1 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Galeria
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {galleryPhotos.map((photo) => (
                  <div key={photo} className="relative h-28 w-40 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
                    <Image
                      src={photo}
                      alt={`Foto de ${destination.name}`}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setIsDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogClose>
            <PurchaseButton
              destination={destination}
              label="Adquirir destino"
              className="rounded-full"
              size="lg"
            />
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}