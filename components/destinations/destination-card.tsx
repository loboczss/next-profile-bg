"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ComponentType, KeyboardEvent, SVGProps } from "react";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  PlaneLanding,
  PlaneTakeoff,
  Star,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

import { PurchaseButton } from "@/components/purchases/purchase-button";

import { FavoriteButton } from "./favorite-button";

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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
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

  const handlePhotoChange = (nextIndex: number) => {
    setActivePhotoIndex((current) => {
      const safeIndex = ((nextIndex % photos.length) + photos.length) % photos.length;
      return photos[safeIndex] ? safeIndex : current;
    });
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsDialogOpen(true);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div
        className={cn(
          "relative w-[260px] shrink-0 text-left sm:w-[300px]",
          fullHeight ? "h-full" : "h-auto",
          className
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsDialogOpen(true)}
          onKeyDown={handleCardKeyDown}
          className={cn(
            "group/card isolate flex h-full min-h-[420px] flex-col overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-[0_25px_45px_-30px_rgba(15,23,42,0.9)] transition-all duration-500",
            "hover:z-20 hover:scale-[1.04] hover:shadow-[0_50px_100px_-60px_rgba(15,23,42,0.95)] focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40"
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="relative h-[210px] w-full overflow-hidden bg-slate-900">
            <Image
              src={photos[activePhotoIndex]}
              alt={destination.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
              sizes="(min-width: 768px) 300px, 100vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
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

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-sm font-semibold text-amber-300 shadow-lg">
                <Star className="size-4" />
                {destination.rating.toFixed(1)}
              </span>

              {photos.length > 1 ? (
                <div className="flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/70"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePhotoChange(activePhotoIndex - 1);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/70"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePhotoChange(activePhotoIndex + 1);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>

            {photos.length > 1 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-2">
                {photos.map((photo, index) => (
                  <span
                    key={`${photo}-${index}`}
                    className={cn(
                      "h-[6px] w-[26px] rounded-full bg-white/30 transition-opacity",
                      index === activePhotoIndex ? "bg-white" : "opacity-40"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-5 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 px-6 pb-6 pt-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400/80">Destino exclusivo</p>
                <h3 className="text-2xl font-semibold leading-tight text-white">
                  {destination.name}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300/80">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1">
                  <CalendarRange className="size-4 text-sky-400" />
                  {stayLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1">
                  <Users className="size-4 text-sky-400" />
                  Até {destination.peopleCount} pessoas
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden text-pretty">
                {destination.description}
              </p>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/70 px-5 py-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400/70">A partir de</span>
                  <p className="text-2xl font-semibold text-white">{formattedPrice}</p>
                </div>
                <PurchaseButton
                  destination={destination}
                  label="Reservar"
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-sky-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-lg hover:bg-sky-500"
                />
              </div>

              {photos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      className={cn(
                        "relative h-14 w-20 overflow-hidden rounded-xl border-2 border-transparent bg-slate-800/70 transition-all hover:border-sky-400/70",
                        index === activePhotoIndex && "border-sky-400 shadow-lg"
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePhotoChange(index);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Image
                        src={photo}
                        alt={`${destination.name} prévia ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <DialogContent className="max-h-[90vh] w-[min(100vw-2rem,960px)] overflow-hidden rounded-[2.5rem] border border-slate-800/70 bg-slate-950/95 p-0 text-slate-100 shadow-[0_45px_120px_-60px_rgba(15,23,42,0.95)]">
        <div className="relative h-[260px] w-full overflow-hidden bg-slate-900 sm:h-[360px]">
          <Image
            src={photos[activePhotoIndex]}
            alt={destination.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 960px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />

          <div className="absolute left-8 right-8 top-8 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-1 backdrop-blur">
              <MapPin className="size-4" />
              {destination.city}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-1 backdrop-blur">
              <Star className="size-4 text-amber-400" />
              Nota {destination.rating.toFixed(1)}
            </span>
          </div>

          {photos.length > 1 ? (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6">
              <button
                type="button"
                aria-label="Foto anterior"
                className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/70"
                onClick={() => handlePhotoChange(activePhotoIndex - 1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Próxima foto"
                className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-black/70"
                onClick={() => handlePhotoChange(activePhotoIndex + 1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent px-8 pb-6 pt-12">
            <DialogHeader className="text-left text-slate-100">
              <DialogTitle className="text-3xl font-semibold leading-tight text-white">
                {destination.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-white/70">
                {stayLabel} • {destination.peopleCount}{" "}
                {destination.peopleCount === 1 ? "viajante" : "viajantes"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="grid gap-10 px-8 pb-12 pt-10 lg:grid-cols-[1.65fr_1fr] lg:gap-12">
          <div className="space-y-6 text-sm text-slate-200">
            <p className="text-base leading-relaxed text-slate-200/90">
              {destination.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile
                icon={PlaneTakeoff}
                label="Data de partida"
                value={formattedStartDate}
              />
              <InfoTile
                icon={PlaneLanding}
                label="Data de retorno"
                value={formattedEndDate}
              />
              <InfoTile
                icon={CalendarRange}
                label="Duração"
                value={stayLabel}
              />
              <InfoTile
                icon={Users}
                label="Capacidade"
                value={`Até ${destination.peopleCount} ${destination.peopleCount === 1 ? "pessoa" : "pessoas"}`}
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                    Investimento
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-white">{formattedPrice}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  <CircleDollarSign className="size-4" />
                  Melhor custo
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Valores sujeitos a alteração mediante disponibilidade e personalização do roteiro.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                Galeria do destino
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    className={cn(
                      "relative h-20 overflow-hidden rounded-xl border border-transparent transition-all hover:border-sky-400/60",
                      index === activePhotoIndex && "border-sky-400 shadow-lg"
                    )}
                    onClick={() => handlePhotoChange(index)}
                  >
                    <Image
                      src={photo}
                      alt={`${destination.name} imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm font-semibold text-white/90">
                Nota média
              </p>
              <div className="mt-3 flex items-baseline gap-3 text-white">
                <span className="text-4xl font-bold">{destination.rating.toFixed(1)}</span>
                <span className="text-sm text-white/60">de 5</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Avaliações de viajantes reais que viveram essa experiência.
              </p>
            </div>

            <PurchaseButton
              destination={destination}
              label="Solicitar proposta completa"
              className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-xl transition hover:from-sky-500/90 hover:to-cyan-500/90"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoTileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

function InfoTile({ icon: Icon, label, value }: InfoTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
      <span className="grid size-12 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/50">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  );
}
