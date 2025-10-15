"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  BadgeCheck,
  CalendarRange,
  Camera,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plane,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { PurchaseButton } from "@/components/purchases/purchase-button";
import { FavoriteButton } from "./favorite-button";

interface DestinationCardProps {
  destination: SerializedDestination;
  canFavorite?: boolean;
  onFavoriteChange?: (destinationId: number, isFavorite: boolean) => void;
  className?: string;
  fullHeight?: boolean;
  isActive?: boolean;
}

export function DestinationCard({
  destination,
  canFavorite = true,
  onFavoriteChange,
  className,
  fullHeight = false,
  isActive = false,
}: DestinationCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const photos = destination.photos.length > 0 ? destination.photos : ["/placeholder.jpg"];
  const initialFavorite = Boolean(destination.isFavorite);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
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

  const handleStep = (direction: -1 | 1) => {
    setActiveImageIndex((current) => {
      const nextIndex = (current + direction + photos.length) % photos.length;
      return nextIndex;
    });
  };

  const handleSelectImage = (index: number) => {
    setActiveImageIndex(index);
  };

  const activeImage = photos[activeImageIndex];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative isolate flex w-full cursor-pointer overflow-hidden rounded-[32px] bg-slate-950 text-left transition duration-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            "before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:bg-sky-500/30 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-700",
            "hover:before:opacity-100",
            fullHeight ? "h-full" : "min-h-[260px]",
            isActive ? "scale-100 shadow-[0_40px_120px_-50px_rgba(14,165,233,0.7)]" : "scale-[0.92] sm:scale-[0.95]",
            isActive ? "ring-1 ring-sky-400/70" : "hover:scale-[0.98] hover:ring-1 hover:ring-sky-400/50",
            className
          )}
        >
          <div className="absolute inset-0">
            <Image
              src={activeImage}
              alt={destination.name}
              fill
              priority={false}
              sizes="(min-width: 1280px) 420px, (min-width: 768px) 320px, 90vw"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-950/60 to-slate-950/95" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent opacity-0 transition duration-700 group-hover:opacity-100" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 text-slate-100">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                  <Sparkles className="size-4 text-sky-300" />
                  Destaque
                </span>
                <div className="space-y-1">
                  <p className="text-lg font-semibold leading-tight sm:text-xl">
                    {destination.name}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                    <MapPin className="size-4 text-sky-300" />
                    {destination.city}
                  </span>
                </div>
              </div>
              <div onClick={(event) => event.stopPropagation()}>
                <FavoriteButton
                  destinationId={destination.id}
                  initialIsFavorite={initialFavorite}
                  canFavorite={canFavorite}
                  onStatusChange={(isFavorite) =>
                    onFavoriteChange?.(destination.id, isFavorite)
                  }
                />
              </div>
            </div>

            <div className="space-y-4 text-slate-200">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.32em] text-slate-300">
                <span className="rounded-full bg-white/10 px-3 py-1">{stayLabel}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Até {destination.peopleCount} {destination.peopleCount === 1 ? "viajante" : "viajantes"}
                </span>
              </div>

              <p className="line-clamp-3 text-sm text-slate-200/80">
                {destination.description}
              </p>

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    A partir de
                  </span>
                  <span className="text-2xl font-bold text-white">{formattedPrice}</span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-[0_20px_40px_-20px_rgba(16,185,129,0.7)]">
                  <Star className="size-4 text-emerald-200" />
                  {destination.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl overflow-hidden rounded-[40px] border border-slate-900/40 bg-slate-950/95 p-0 text-slate-100 shadow-[0_50px_120px_-50px_rgba(6,182,212,0.75)]">
        <div className="relative h-[280px] w-full sm:h-[360px] lg:h-[420px]">
          <Image
            src={activeImage}
            alt={destination.name}
            fill
            priority
            sizes="(min-width: 1280px) 960px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-3xl font-semibold text-white sm:text-4xl">
                    {destination.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-300">
                    {destination.city} • {stayLabel} • {destination.peopleCount}{" "}
                    {destination.peopleCount === 1 ? "pessoa" : "pessoas"}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Star className="size-4 text-emerald-200" />
                    {destination.rating.toFixed(1)} / 5
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Plane className="size-4 text-sky-300" />
                    Pronto para embarcar
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <BadgeCheck className="size-4 text-sky-300" />
                    Curadoria Evastur
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 text-right sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                  Pacote a partir de
                </span>
                <span className="text-3xl font-bold text-white sm:text-4xl">{formattedPrice}</span>
                <span className="text-xs text-slate-400">Valores sujeitos a disponibilidade e personalização.</span>
              </div>
            </div>
          </div>

          {photos.length > 1 ? (
            <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-10 rounded-full border border-white/20 bg-slate-900/60 text-white backdrop-blur hover:bg-slate-900"
                onClick={() => handleStep(-1)}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-10 rounded-full border border-white/20 bg-slate-900/60 text-white backdrop-blur hover:bg-slate-900"
                onClick={() => handleStep(1)}
                aria-label="Próxima foto"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-slate-200">
              {destination.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-sky-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Cidade
                    </p>
                    <p className="text-sm font-medium text-white">{destination.city}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CalendarRange className="size-5 text-sky-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Ida
                    </p>
                    <p className="text-sm font-medium text-white">{formattedStartDate}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CalendarRange className="size-5 text-sky-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Volta
                    </p>
                    <p className="text-sm font-medium text-white">{formattedEndDate}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-sky-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Ideal para
                    </p>
                    <p className="text-sm font-medium text-white">
                      Até {destination.peopleCount}{" "}
                      {destination.peopleCount === 1 ? "viajante" : "viajantes"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Galeria do destino
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => handleSelectImage(index)}
                    className={cn(
                      "relative h-20 w-32 overflow-hidden rounded-2xl border border-white/10 transition",
                      index === activeImageIndex
                        ? "ring-2 ring-sky-400"
                        : "opacity-70 hover:opacity-100"
                    )}
                    aria-label={`Selecionar foto ${index + 1}`}
                  >
                    <Image src={photo} alt={destination.name} fill className="object-cover" sizes="128px" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/20" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/30 p-6 shadow-inner">
              <div className="flex items-center gap-3 text-slate-200">
                <Sparkles className="size-6 text-sky-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Experiência completa
                  </p>
                  <p className="text-lg font-semibold text-white">Reserve com a Evastur</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                Personalize hospedagem, passeios e serviços exclusivos com nossa equipe de especialistas.
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                  Investimento sugerido
                </p>
                <p className="mt-2 text-3xl font-bold text-white">{formattedPrice}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Parcelamento e condições especiais sob consulta.
                </p>
              </div>
            </div>

            <PurchaseButton
              destination={destination}
              label="Solicitar proposta personalizada"
              className="w-full justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(6,182,212,0.8)] transition hover:from-sky-500/90 hover:to-cyan-500/90"
            />

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <Camera className="size-5 text-sky-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
                  Informações rápidas
                </p>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-sky-400" />
                  <span>Datas flexíveis mediante disponibilidade.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-sky-400" />
                  <span>Equipe pronta para personalizar passeios e experiências VIP.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-sky-400" />
                  <span>Assistência 24/7 durante toda a viagem.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
