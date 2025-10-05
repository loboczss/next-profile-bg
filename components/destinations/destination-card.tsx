"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  destination: SerializedDestination;
  fullHeight?: boolean;
}

export function DestinationCard({
  destination,
  fullHeight = true,
}: DestinationCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handlePrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? photos.length - 1 : Math.max(current - 1, 0)
    );
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % photos.length);
  };

  const formattedPrice = priceFormatter.format(destination.price);
  const formattedStartDate = dateFormatter.format(new Date(destination.startDate));
  const formattedEndDate = dateFormatter.format(new Date(destination.endDate));
  const stayLabel = `${formattedStartDate} - ${formattedEndDate}`;

  const heroPhoto = photos[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* CARD (gatilho) — sem mudanças de contrato */}
        <Card
          className={cn(
            "group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-[0_25px_50px_-25px_rgba(14,116,144,0.35)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_40px_80px_-30px_rgba(2,132,199,0.45)]",
            fullHeight ? "h-full" : "h-auto"
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/20" />
          </div>

          <CardHeader className="gap-4 min-w-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/60 bg-slate-100 shadow-inner">
              <Image
                src={photos[activeIndex]}
                alt={destination.name}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 380px, (min-width: 768px) 320px, 100vw"
                priority={false}
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handlePrevious();
                    }}
                    className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white outline-none ring-0 transition hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/80"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white outline-none ring-0 transition hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/80"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </>
              )}

              {photos.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
                  {photos.map((photo, index) => (
                    <span
                      key={photo + index}
                      className={cn(
                        "h-2 w-2 rounded-full bg-white/40 backdrop-blur",
                        index === activeIndex && "bg-white"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <CardTitle className="truncate text-lg font-bold text-slate-900" title={destination.name}>
                {destination.name}
              </CardTitle>
              <CardDescription className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600">
                <MapPin className="shrink-0 size-4 text-primary" />
                <span className="truncate" title={destination.city}>{destination.city}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="mt-auto space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-lg font-bold text-slate-900">{formattedPrice}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100/80 px-3 py-1 text-sm font-semibold text-amber-600 shadow-sm">
                <Star className="size-4" />
                {destination.rating.toFixed(1)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1">
                <CalendarRange className="size-4 text-primary" />
                <span className="truncate">{stayLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1">
                <Users className="size-4 text-primary" />
                <span className="truncate">{destination.peopleCount} pessoas</span>
              </span>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-200/80 to-transparent" />
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* MODAL (grid: hero + conteúdo rolável) */}
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/40",
          "bg-gradient-to-br from-white via-white/95 to-sky-50/60 p-0",
          "shadow-[0_45px_90px_-40px_rgba(2,132,199,0.55)]",
          "grid grid-rows-[auto_minmax(0,1fr)]"
        )}
      >
        {/* Fechar */}
        <DialogClose asChild>
          <button
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </DialogClose>

        {/* HERO — preço sobre a foto */}
        <div className="relative h-[28vh] min-h-[180px] w-full bg-slate-100 sm:h-[30vh] md:h-[32vh] lg:h-[34vh] xl:h-[36vh]">
          <Image
            src={heroPhoto}
            alt={`${destination.name} - destaque`}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 640px, (min-width: 768px) 540px, 100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />

          {/* Badges inferiores (cidade, rating) */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-3 text-white">
            <span className="rounded-full bg-white/15 px-4 py-1 text-sm font-semibold backdrop-blur">
              {destination.city}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/90 px-4 py-1 text-sm font-semibold text-slate-900 shadow-lg">
              <Star className="size-4" />
              {destination.rating.toFixed(1)}
            </span>
          </div>

          {/* PREÇO EM DESTAQUE SOBRE A FOTO */}
          <div className="absolute left-4 top-4 flex max-w-[80%] flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700 shadow">
              Investimento
            </span>
            <div
              className={cn(
                "relative inline-flex w-fit items-center rounded-2xl",
                "border border-sky-200/70 bg-gradient-to-br from-white/95 via-sky-50/90 to-cyan-50/80",
                "px-4 py-2 shadow-[0_18px_40px_-18px_rgba(2,132,199,0.55)]",
                "motion-safe:animate-pulse hover:animate-none",
                "transition-transform duration-300 hover:scale-[1.02]",
                "ring-1 ring-sky-100/80 backdrop-blur"
              )}
              title={formattedPrice}
            >
              <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-700 via-cyan-600 to-blue-600">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>

        {/* CONTEÚDO — apenas DESCRIÇÃO com visual bonito */}
        <div className="min-h-0 overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="space-y-3 text-left min-w-0">
            <DialogTitle className="text-balance text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {destination.name}
            </DialogTitle>

            <DialogDescription className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 font-medium text-blue-700">
                <MapPin className="size-4" />
                <span className="truncate" title={destination.city}>{destination.city}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700">
                <CalendarRange className="size-4 text-primary" />
                <span className="truncate">{stayLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700">
                <Users className="size-4 text-primary" />
                <span className="truncate">Até {destination.peopleCount} pessoas</span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* BOX DE DESCRIÇÃO — glass premium + tipografia legível */}
          <section
            className={cn(
              "relative min-w-0 rounded-2xl border border-slate-200/70",
              "bg-white/75 p-6 shadow-lg shadow-sky-100 backdrop-blur",
              "ring-1 ring-white/60",
              "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-sky-50/60 before:via-transparent before:to-cyan-50/60"
            )}
          >
            <h4 className="mb-3 text-lg font-semibold text-slate-900">Descrição do destino</h4>
            <p className="min-w-0 break-words text-pretty text-[15px] leading-relaxed text-slate-700">
              {destination.description}
            </p>

            {/* separador sutil com gradiente */}
            <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
            {/* micro-meta opcional (não altera contrato, só visual) */}
            <div className="mt-2 text-xs text-slate-500">
              * Valores e condições sujeitos a disponibilidade do período informado.
            </div>
          </section>

          {/* GALERIA */}
          <section className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-semibold text-slate-900">Galeria de fotos</h4>
              <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">
                {photos.length} {photos.length === 1 ? "imagem" : "imagens"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  className="group relative aspect-video overflow-hidden rounded-2xl border border-white/60 bg-slate-100 shadow-inner transition-transform duration-300 hover:-translate-y-1"
                >
                  <Image
                    src={photo}
                    alt={`${destination.name} - foto ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 320px, (min-width: 768px) 280px, 100vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </section>

          {/* AÇÕES */}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Deseja visualizar o destino no mapa? Abra o Google Maps em uma nova aba.
            </p>

            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-w-[160px] rounded-full border-primary/40 bg-primary/5 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              onClick={() => {
                const url = `https://www.google.com/maps/search/${encodeURIComponent(
                  destination.city
                )}`;
                window.open(url, "_blank");
              }}
            >
              Ver no mapa
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
