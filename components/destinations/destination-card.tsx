"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plane,
  Star,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogClose,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [favoriteState, setFavoriteState] = useState(Boolean(destination.isFavorite));

  const photos = destination.photos.length > 0 ? destination.photos : ["/placeholder.jpg"];

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
  const stayLabel = `${formattedStartDate} • ${formattedEndDate}`;
  const hasMultiplePhotos = photos.length > 1;

  const handlePrevious = () => {
    setActiveIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % photos.length);
  };

  useEffect(() => {
    setFavoriteState(Boolean(destination.isFavorite));
  }, [destination.isFavorite]);

  useEffect(() => {
    if (!isDialogOpen) {
      setActiveIndex(0);
    }
  }, [isDialogOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div
        className={cn(
          "relative flex min-h-full min-w-[17rem] max-w-[23rem] flex-col gap-3",
          fullHeight ? "h-full" : "h-auto",
          className
        )}
      >
        <div className="relative">
          <DialogTrigger asChild>
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-[28px] bg-slate-900/10 text-left shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 hover:-translate-y-1 hover:scale-[1.02]"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={photos[0]}
                  alt={destination.name}
                  fill
                  sizes="(min-width: 768px) 360px, 90vw"
                  className={cn(
                    "object-cover transition duration-700 ease-out",
                    isPreviewLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  )}
                  onLoadingComplete={() => setIsPreviewLoaded(true)}
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] tracking-[0.38em] text-white/70">
                    Evastur Originals
                  </span>
                  <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[10px] tracking-[0.38em] text-white/70 sm:inline">
                    {stayLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-balance text-2xl font-semibold text-white drop-shadow-[0_8px_20px_rgba(15,23,42,0.8)]">
                    {destination.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                      <Star className="size-4 text-amber-300" />
                      {destination.rating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                      <CalendarRange className="size-4" /> {formattedStartDate}
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 sm:inline-flex">
                      <Users className="size-4" /> Até {destination.peopleCount}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-sm font-semibold text-white/90 shadow-lg shadow-black/30">
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </DialogTrigger>

          <div className="pointer-events-none absolute inset-y-6 left-0 w-24 bg-gradient-to-r from-black/40 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
          <div className="pointer-events-none absolute inset-y-6 right-0 w-24 bg-gradient-to-l from-black/40 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />

          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            <MapPin className="size-3.5" />
            <span className="max-w-[10rem] truncate" title={destination.city}>
              {destination.city}
            </span>
          </div>

          <div className="absolute right-5 top-5">
            <FavoriteButton
              destinationId={destination.id}
              initialIsFavorite={favoriteState}
              canFavorite={canFavorite}
              onStatusChange={(isFavorite) => {
                setFavoriteState(isFavorite);
                onFavoriteChange?.(destination.id, isFavorite);
              }}
            />
          </div>
        </div>

        <PurchaseButton
          destination={destination}
          label="Reservar agora"
          className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-500/90 hover:to-cyan-500/90"
        />
      </div>

      <DialogContent
        className="max-w-5xl overflow-hidden border-none bg-slate-950 p-0 text-slate-100 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)]"
        showCloseButton={false}
      >
        <div className="relative">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={photos[activeIndex]}
              alt={destination.name}
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <Plane className="size-4" />
                {destination.city}
              </div>
              <div className="flex items-center gap-3">
                <FavoriteButton
                  destinationId={destination.id}
                  initialIsFavorite={favoriteState}
                  canFavorite={canFavorite}
                  onStatusChange={(isFavorite) => {
                    setFavoriteState(isFavorite);
                    onFavoriteChange?.(destination.id, isFavorite);
                  }}
                />
                <DialogClose
                  className="inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Fechar detalhes do destino"
                >
                  <span aria-hidden className="text-2xl leading-none">
                    ×
                  </span>
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              </div>
            </div>

            {hasMultiplePhotos && (
              <div className="absolute inset-y-0 left-0 flex w-full items-center justify-between px-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex size-12 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Ver foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex size-12 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Ver próxima foto"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-8">
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <Star className="size-4 text-amber-300" /> {destination.rating.toFixed(1)} / 5
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <CalendarRange className="size-4" /> {formattedStartDate}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <CalendarRange className="size-4" /> {formattedEndDate}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <Users className="size-4" /> Até {destination.peopleCount} pessoas
                </span>
              </div>

              <DialogHeader className="gap-3 text-left">
                <DialogTitle className="text-3xl font-semibold text-white drop-shadow-[0_8px_20px_rgba(15,23,42,0.8)]">
                  {destination.name}
                </DialogTitle>
                <DialogDescription className="text-base text-white/70">
                  Uma produção exclusiva Evastur para viajantes que buscam experiências inesquecíveis.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-10 bg-slate-950 p-8">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6 text-sm leading-relaxed text-white/80">
              <p className="text-base text-white/80">
                {destination.description}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_-25px_rgba(15,23,42,0.9)]">
                  <div className="flex items-center gap-3">
                    <MapPin className="size-5 text-sky-300" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Cidade</p>
                      <p className="text-sm font-medium text-white">{destination.city}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_-25px_rgba(15,23,42,0.9)]">
                  <div className="flex items-center gap-3">
                    <CalendarRange className="size-5 text-sky-300" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Período</p>
                      <p className="text-sm font-medium text-white">{formattedStartDate} até {formattedEndDate}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_-25px_rgba(15,23,42,0.9)]">
                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-sky-300" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Capacidade</p>
                      <p className="text-sm font-medium text-white">Até {destination.peopleCount} viajantes</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_-25px_rgba(15,23,42,0.9)]">
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-5 text-sky-300" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Atualizado</p>
                      <p className="text-sm font-medium text-white">{dateFormatter.format(new Date(destination.updatedAt))}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_-25px_rgba(14,116,144,0.8)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/50">
                  Investimento sugerido
                </p>
                <p className="text-3xl font-bold text-white">{formattedPrice}</p>
                <p className="text-xs text-white/60">
                  Valores podem variar conforme personalização, disponibilidade e temporada selecionada.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/50">
                  Pré-visualização das cenas
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "relative h-20 w-32 overflow-hidden rounded-xl border-2 border-transparent transition hover:border-sky-400",
                        index === activeIndex && "border-sky-400 shadow-lg shadow-sky-400/40"
                      )}
                      aria-label={`Selecionar foto ${index + 1}`}
                    >
                      <Image
                        src={photo}
                        alt={`${destination.name} foto ${index + 1}`}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_-25px_rgba(59,130,246,0.6)]">
                <h4 className="text-lg font-semibold text-white">O que está incluso</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="inline-flex size-2 rounded-full bg-sky-300" aria-hidden />
                    Hospedagem selecionada pela curadoria Evastur
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex size-2 rounded-full bg-sky-300" aria-hidden />
                    Suporte 24h durante a viagem
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex size-2 rounded-full bg-sky-300" aria-hidden />
                    Roteiro personalizado com experiências premium
                  </li>
                </ul>
              </div>

              <PurchaseButton
                destination={destination}
                label="Solicitar proposta"
                className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-base font-semibold text-white shadow-xl transition hover:from-sky-500/90 hover:to-cyan-500/90"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
