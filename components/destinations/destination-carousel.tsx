"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";
import { cn } from "@/lib/utils";

import { DestinationCard } from "./destination-card";

interface DestinationCarouselProps {
  destinations: SerializedDestination[];
  canFavorite?: boolean;
  onFavoriteChange?: (destinationId: number, isFavorite: boolean) => void;
  onDelete?: DestinationDeleteAction;
  className?: string;
}

export function DestinationCarousel({
  destinations,
  canFavorite = false,
  onFavoriteChange,
  onDelete,
  className,
}: DestinationCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < maxScrollLeft - 8);
  }, []);

  useEffect(() => {
    updateScrollState();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, destinations.length]);

  const handleScroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const cardWidth = 240;
    const gap = 24;
    const scrollAmount = direction === "left" ? -(cardWidth + gap) : cardWidth + gap;

    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  const hasDestinations = destinations.length > 0;

  const carouselContent = useMemo(() => {
    if (!hasDestinations) {
      return (
        <div className="flex h-60 w-full items-center justify-center rounded-3xl border border-dashed border-slate-300/70 bg-white/70 text-center text-sm text-slate-500">
          Nenhum destino encontrado no momento.
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-3 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {destinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            canFavorite={canFavorite}
            onFavoriteChange={onFavoriteChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }, [canFavorite, destinations, hasDestinations, onDelete, onFavoriteChange]);

  return (
    <div className={cn("relative", className)}>
      {hasDestinations ? (
        <>
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute -left-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Ver destinos anteriores"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="size-6" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute -right-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Ver próximos destinos"
            disabled={!canScrollRight}
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}

      {hasDestinations ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/70 to-transparent" aria-hidden />
      ) : null}

      {carouselContent}
    </div>
  );
}