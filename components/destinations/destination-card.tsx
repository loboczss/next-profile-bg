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
} from "lucide-react";

import { Card, CardTitle } from "@/components/ui/card";
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
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
        "backdrop-blur",
        fullHeight ? "h-full" : "h-auto",
        className
      )}
    >
      <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-slate-200/70 bg-slate-100 lg:aspect-auto lg:border-b-0 lg:border-r lg:min-h-[360px]">
          <Image
            src={photos[activeIndex]}
            alt={destination.name}
            fill
            className={cn(
              "object-cover transition duration-700 ease-out",
              isImageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
            )}
            sizes="(min-width: 1280px) 480px, (min-width: 768px) 360px, 100vw"
            onLoadingComplete={() => setIsImageLoaded(true)}
            priority={false}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/40" />

          <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
            <span className="inline-flex max-w-[70%] items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-white shadow">
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

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/95 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow">
              <Star className="size-4" />
              {destination.rating.toFixed(1)}
            </span>

            {hasMultiplePhotos && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
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

        <div className="flex h-full flex-col justify-between gap-6 p-6 lg:p-8">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-balance text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                    {destination.name}
                  </CardTitle>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Pacote exclusivo
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-right shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Investimento
                  </p>
                  <p className="text-lg font-bold text-slate-900 sm:text-2xl">{formattedPrice}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium">
                  <CalendarRange className="size-4 text-primary" />
                  {stayLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium">
                  <Users className="size-4 text-primary" />
                  Até {destination.peopleCount} pessoas
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical] overflow-hidden text-pretty">
              {destination.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                Pronto para embarcar?
              </p>
              <p>Garanta sua reserva com atendimento dedicado antes, durante e depois da viagem.</p>
            </div>
            <PurchaseButton
              destination={destination}
              label="Quero este destino"
              className="w-full justify-center bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg transition hover:from-sky-500/90 hover:to-cyan-500/90 sm:w-auto"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
