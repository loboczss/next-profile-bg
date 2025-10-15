"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Users,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

import { FavoriteButton } from "./favorite-button";
import { PurchaseButton } from "@/components/purchases/purchase-button";

interface DestinationCardProps {
  destination: SerializedDestination;
  fullHeight?: boolean;
  canFavorite?: boolean;
  onFavoriteChange?: (destinationId: number, isFavorite: boolean) => void;
  className?: string;
}

export function DestinationCard({
  destination,
  fullHeight = true,
  canFavorite = true,
  onFavoriteChange,
  className,
}: DestinationCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const photos = destination.photos.length > 0 ? destination.photos : ["/placeholder.jpg"];
  const initialFavorite = Boolean(destination.isFavorite);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    []
  );

  const formattedPrice = priceFormatter.format(destination.price);
  const formattedStartDate = dateFormatter.format(new Date(destination.startDate));
  const formattedEndDate = dateFormatter.format(new Date(destination.endDate));
  const stayLabel = `${formattedStartDate} a ${formattedEndDate}`;

  const handlePrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? photos.length - 1 : Math.max(current - 1, 0)
    );
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % photos.length);
  };

  useEffect(() => {
    setIsImageLoaded(false);
  }, [activeIndex]);

  const hasMultiplePhotos = photos.length > 1;

  return (
    <Card
      className={cn(
        "group relative flex h-full w-full max-w-[26rem] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-[0_35px_120px_rgba(15,23,42,0.22)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_45px_140px_rgba(14,23,42,0.28)]",
        "backdrop-blur-xl",
        "before:absolute before:-inset-px before:-z-10 before:rounded-[36px] before:border before:border-white/60 before:bg-gradient-to-br before:from-white before:via-white before:to-slate-100 before:opacity-95 before:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        "after:pointer-events-none after:absolute after:-right-24 after:top-0 after:-z-10 after:h-64 after:w-64 after:rounded-full after:bg-sky-100/60 after:blur-3xl",
        fullHeight ? "h-full" : "h-auto",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-24 bottom-10 -z-10 h-56 w-56 rounded-full bg-cyan-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-6 -z-10 h-24 w-24 rounded-full bg-white/60 blur-xl" />
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={photos[activeIndex]}
          alt={destination.name}
          fill
          className={cn(
            "rounded-t-[32px] object-cover transition duration-700 ease-out",
            isImageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
          )}
          sizes="(min-width: 768px) 416px, 100vw"
          onLoadingComplete={() => setIsImageLoaded(true)}
          priority={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_55%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.25),transparent_50%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <span className="inline-flex max-w-[70%] items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white shadow">
            <MapPin className="size-3.5" />
            <span className="truncate" title={destination.city}>
              {destination.city}
            </span>
          </span>
          <FavoriteButton
            destinationId={destination.id}
            initialIsFavorite={initialFavorite}
            canFavorite={canFavorite}
            onStatusChange={(isFavorite) =>
              onFavoriteChange?.(destination.id, isFavorite)
            }
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-lg">
            <Star className="size-4 text-amber-500" />
            {destination.rating.toFixed(1)}
          </span>

          {hasMultiplePhotos && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                aria-label="Próxima foto"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        {hasMultiplePhotos && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 px-4">
            {photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver foto ${index + 1}`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-white/40 bg-white/40 transition",
                  index === activeIndex ? "bg-white shadow" : "hover:bg-white/70"
                )}
              >
                <span className="sr-only">{`Foto ${index + 1}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-4">
          <div className="space-y-3">
            <CardTitle className="text-balance text-3xl font-semibold leading-tight text-slate-900">
              {destination.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              <span className="rounded-full border border-white/70 bg-white/80 px-4 py-1 text-slate-500 shadow-sm">
                Coleção encantada
              </span>
              <span className="rounded-full border border-white/70 bg-white/80 px-4 py-1 text-slate-500 shadow-sm">
                Atualizado {dateFormatter.format(new Date(destination.updatedAt))}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 font-medium shadow-sm">
              <CalendarRange className="size-4 text-sky-500" />
              {stayLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 font-medium shadow-sm">
              <Users className="size-4 text-sky-500" />
              Até {destination.peopleCount} pessoas
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 font-medium shadow-sm">
              <Star className="size-4 text-sky-500" />
              Avaliação {destination.rating.toFixed(1)} / 5
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 [display:-webkit-box] [-webkit-line-clamp:4] [-webkit-box-orient:vertical] overflow-hidden text-pretty">
            {destination.description}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-400">
                Investimento
              </p>
              <p className="text-2xl font-semibold text-slate-900">{formattedPrice}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 shadow-inner">
              <Sparkles className="size-4" />
              Curadoria premium
            </span>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center rounded-full border-white/80 bg-white/95 px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition hover:border-slate-200 hover:bg-white"
              >
                Ver detalhes completos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl overflow-hidden border border-white/80 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-0 shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
              <div className="flex flex-col">
                <div className="relative h-56 w-full overflow-hidden bg-slate-200 sm:h-64">
                  <Image
                    src={photos[activeIndex]}
                    alt={destination.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 640px, 100vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                        <MapPin className="size-3.5" />
                        {destination.city}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900">
                        <Star className="size-4 text-amber-500" />
                        {destination.rating.toFixed(1)} / 5
                      </span>
                    </div>
                  </div>

                  {hasMultiplePhotos && (
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="flex size-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow transition hover:bg-white"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        {photos.map((photo, index) => (
                          <button
                            key={`${photo}-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                              "h-2.5 w-2.5 rounded-full border border-white/60",
                              index === activeIndex ? "bg-white" : "bg-white/40"
                            )}
                            aria-label={`Ver foto ${index + 1}`}
                          >
                            <span className="sr-only">{`Foto ${index + 1}`}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex size-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow transition hover:bg-white"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6 p-6 sm:p-8">
                  <DialogHeader className="gap-3 text-left">
                    <DialogTitle className="text-3xl font-semibold text-slate-900">
                      {destination.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                      {stayLabel} • {destination.peopleCount} {destination.peopleCount === 1 ? "pessoa" : "pessoas"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 text-sm text-slate-600">
                    <p className="text-base leading-relaxed text-slate-600">
                      {destination.description}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <MapPin className="size-5 text-sky-500" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                              Localização
                            </p>
                            <p className="text-sm font-medium text-slate-700">{destination.city}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <CalendarRange className="size-5 text-sky-500" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                              Período sugerido
                            </p>
                            <p className="text-sm font-medium text-slate-700">{stayLabel}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Users className="size-5 text-sky-500" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                              Ideal para
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                              Até {destination.peopleCount} {destination.peopleCount === 1 ? "viajante" : "viajantes"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Star className="size-5 text-sky-500" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                              Avaliação média
                            </p>
                            <p className="text-sm font-medium text-slate-700">{destination.rating.toFixed(1)} de 5</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                        Investimento aproximado
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{formattedPrice}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Valores sujeitos a atualização conforme disponibilidade e personalização do roteiro.
                      </p>
                    </div>
                  </div>

                  <PurchaseButton
                    destination={destination}
                    label="Solicitar proposta personalizada"
                    className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(56,189,248,0.45)] transition hover:from-sky-500/95 hover:via-sky-400/95 hover:to-cyan-500/95"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <PurchaseButton
            destination={destination}
            label="Quero este destino"
            className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(56,189,248,0.4)] transition hover:from-sky-500/95 hover:via-sky-400/95 hover:to-cyan-500/95"
          />
        </div>
      </div>
    </Card>
  );
}
