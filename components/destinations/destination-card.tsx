"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Ticket,
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
import { PurchaseButton } from "@/components/purchases/purchase-button";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const photos = destination.photos.length > 0 ? destination.photos : ["/placeholder.jpg"];
  const initialFavorite = Boolean(destination.isFavorite);
  const hasMultiplePhotos = photos.length > 1;

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
  const travelWindowLabel = `${formattedStartDate} → ${formattedEndDate}`;
  const ratingLabel = destination.rating.toFixed(1);

  const shortDescription = useMemo(() => {
    const text = destination.description.trim();
    if (text.length <= 160) {
      return text;
    }
    return `${text.slice(0, 157).trimEnd()}…`;
  }, [destination.description]);

  const goToPreviousPhoto = () => {
    setActiveIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
  };

  const goToNextPhoto = () => {
    setActiveIndex((current) => (current + 1) % photos.length);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative flex w-full max-w-[22rem] flex-col overflow-hidden rounded-[26px] bg-slate-950/70 text-left shadow-2xl shadow-slate-950/30 ring-1 ring-white/5 transition-all duration-300 hover:z-10 hover:-translate-y-2 hover:scale-[1.02] hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
            fullHeight ? "h-full" : "h-auto",
            className
          )}
        >
          <div className="relative h-64 w-full overflow-hidden">
            <Image
              src={photos[activeIndex]}
              alt={destination.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(min-width: 768px) 352px, 100vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/70" />

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
                <MapPin className="size-3.5" />
                <span className="truncate" title={destination.city}>
                  {destination.city}
                </span>
              </span>
              <FavoriteButton
                destinationId={destination.id}
                initialIsFavorite={initialFavorite}
                canFavorite={canFavorite}
                onStatusChange={(isFavorite) => onFavoriteChange?.(destination.id, isFavorite)}
              />
            </div>

            {hasMultiplePhotos && (
              <div className="absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-2 opacity-0 transition duration-200 group-hover:flex group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    goToPreviousPhoto();
                  }}
                  className="flex size-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    goToNextPhoto();
                  }}
                  className="flex size-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-lg transition hover:bg-white"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                <span>{travelWindowLabel}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px]">
                  <Users className="size-3.5" /> {destination.peopleCount}{" "}
                  {destination.peopleCount === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-balance text-2xl font-semibold leading-tight text-white">
                  {destination.name}
                </h3>
                <p className="text-sm text-white/80 line-clamp-2">{shortDescription}</p>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 shadow">
                  <Star className="size-4 text-amber-300" /> {ratingLabel}
                </span>
                <span className="text-base font-bold">{formattedPrice}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/5 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
              <Ticket className="size-3.5" /> Pacote cinematográfico
            </div>
            <PurchaseButton
              destination={destination}
              label="Reservar agora"
              variant="secondary"
              size="sm"
              className="w-full justify-center rounded-full bg-white/95 text-slate-900 transition hover:bg-white"
            />
            <span className="text-center text-xs text-white/60">Clique para ver todos os detalhes</span>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 p-0 text-white shadow-[0_50px_80px_-40px_rgba(0,0,0,0.6)]">
        <div className="relative flex flex-col gap-8">
          <div className="relative h-[340px] w-full overflow-hidden sm:h-[420px]">
            <Image
              src={photos[activeIndex]}
              alt={destination.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 896px, 100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-8">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <MapPin className="size-4" /> {destination.city}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <CalendarRange className="size-4" /> {travelWindowLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <Users className="size-4" /> Até {destination.peopleCount}{" "}
                  {destination.peopleCount === 1 ? "viajante" : "viajantes"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <Star className="size-4 text-amber-300" /> {ratingLabel} / 5
                </span>
              </div>

              <div className="space-y-3">
                <DialogHeader className="text-left text-white">
                  <DialogTitle className="text-3xl font-bold text-white">
                    {destination.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/70">
                    Uma experiência completa com saída em {formattedStartDate} e retorno em {formattedEndDate}.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-base leading-relaxed text-white/80">
                  {destination.description}
                </p>
              </div>
            </div>

            {hasMultiplePhotos && (
              <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4">
                <button
                  type="button"
                  onClick={() => goToPreviousPhoto()}
                  className="flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-slate-950/30 transition hover:bg-white"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToNextPhoto()}
                  className="flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-slate-950/30 transition hover:bg-white"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-8 px-8 pb-10">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-6">
                <div className="grid gap-4 text-sm text-white/80 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Período</p>
                    <p className="mt-2 text-base font-semibold text-white">{travelWindowLabel}</p>
                    <p className="mt-1 text-xs text-white/60">
                      Ajuste as datas com nossos especialistas em viagens.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Investimento</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-300">{formattedPrice}</p>
                    <p className="mt-1 text-xs text-white/60">
                      Valor médio para o pacote completo por pessoa.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Avaliação</p>
                    <p className="mt-2 text-base font-semibold text-white">{ratingLabel} de 5</p>
                    <p className="mt-1 text-xs text-white/60">
                      Nota baseada nas experiências de viajantes reais.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Capacidade</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      Até {destination.peopleCount} {destination.peopleCount === 1 ? "pessoa" : "pessoas"}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Personalize o roteiro para diferentes perfis de viagem.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="flex h-fit flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/80">
                  Pronto para garantir sua vaga? Nossa equipe prepara todos os detalhes enquanto você escolhe o melhor momento para embarcar.
                </p>
                <PurchaseButton
                  destination={destination}
                  label="Solicitar proposta personalizada"
                  className="w-full justify-center rounded-full bg-emerald-400 text-slate-950 transition hover:bg-emerald-300"
                />
              </aside>
            </div>

            {hasMultiplePhotos && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/60">
                  Galeria do destino
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "relative h-24 w-36 shrink-0 overflow-hidden rounded-2xl border-2 border-transparent transition",
                        index === activeIndex ? "border-white" : "opacity-70 hover:opacity-100"
                      )}
                      aria-label={`Selecionar foto ${index + 1}`}
                    >
                      <Image
                        src={photo}
                        alt={`${destination.name} - Foto ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
