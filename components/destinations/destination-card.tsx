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
}

export function DestinationCard({ destination }: DestinationCardProps) {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-[0_25px_50px_-25px_rgba(14,116,144,0.35)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_40px_80px_-30px_rgba(2,132,199,0.45)]">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/20" />
          </div>

          <CardHeader className="gap-4">
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
                    className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
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
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
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
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-900">
                {destination.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <MapPin className="size-4 text-primary" />
                <span>{destination.city}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900">{formattedPrice}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-3 py-1 text-sm font-semibold text-amber-600 shadow-sm">
                <Star className="size-4" />
                {destination.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1">
                <CalendarRange className="size-4 text-primary" />
                {stayLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1">
                <Users className="size-4 text-primary" />
                {destination.peopleCount} pessoas
              </span>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-200/80 to-transparent" />
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl space-y-6 rounded-3xl border border-white/40 bg-white/95 p-8 shadow-[0_40px_80px_-35px_rgba(15,118,190,0.45)]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-3xl font-bold text-slate-900">
            {destination.name}
          </DialogTitle>
          <DialogDescription className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <MapPin className="size-4" />
            <span>{destination.city}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700">
            <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CalendarRange className="size-4 text-primary" />
              {stayLabel}
            </p>
            <p className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Acomoda até {destination.peopleCount} pessoa(s)
            </p>
            <p className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              Nota média: {destination.rating.toFixed(1)}
            </p>
            <p>
              <span className="font-medium text-slate-900">Investimento:</span> {formattedPrice}
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-slate-900">Descrição</h4>
            <p className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
              {destination.description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-base font-semibold text-slate-900">Galeria de fotos</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="group relative aspect-video overflow-hidden rounded-2xl border border-white/60 bg-slate-100 shadow-inner"
              >
                <Image
                  src={photo}
                  alt={`${destination.name} - foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 480px, (min-width: 768px) 380px, 100vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-w-[160px] rounded-full border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
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
      </DialogContent>
    </Dialog>
  );
}
