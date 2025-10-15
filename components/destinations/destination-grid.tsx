"use client";

import { useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Compass } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";

import { cn } from "@/lib/utils";

import { DestinationCard } from "./destination-card";
import { ManageableDestinationCard } from "./manageable-destination-card";

interface DestinationGridProps {
  destinations: SerializedDestination[];
  onDelete?: DestinationDeleteAction;
  canFavorite?: boolean;
}

export function DestinationGrid({
  destinations,
  onDelete,
  canFavorite = true,
}: DestinationGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const showNavigation = destinations.length > 1;

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollerRef.current;
    if (!container) return;

    const scrollAmount = Math.max(
      container.clientWidth * 0.85,
      320
    );

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const emptyState = useMemo(
    () => (
      <div className="relative flex flex-col items-center justify-center gap-6 rounded-[32px] border border-dashed border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-12 text-center shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="grid size-20 place-items-center rounded-full bg-slate-900/5 text-slate-700">
          <Compass className="size-9" />
        </div>
        <div className="space-y-3">
          <p className="text-2xl font-semibold text-slate-900">
            Nenhuma produção disponível ainda
          </p>
          <p className="text-sm text-slate-600">
            Assim que você cadastrar um destino, ele aparecerá aqui como um destaque cinematográfico.
          </p>
        </div>
      </div>
    ),
    []
  );

  if (destinations.length === 0) {
    return emptyState;
  }

  return (
    <div className="relative" role="list" aria-label="Destinos disponíveis">
      {showNavigation && (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 z-20 hidden items-center justify-between px-2 md:flex",
            isHovering ? "opacity-100" : "opacity-0",
            "transition-opacity duration-300"
          )}
          aria-hidden
        >
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="pointer-events-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-900/60 text-white shadow-lg shadow-slate-900/20 backdrop-blur transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            aria-label="Ver destinos anteriores"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="pointer-events-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-900/60 text-white shadow-lg shadow-slate-900/20 backdrop-blur transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            aria-label="Ver próximos destinos"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      <div
        ref={scrollerRef}
        className={cn(
          "group/destinations relative flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pt-2",
          "scroll-smooth"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="pointer-events-none absolute inset-y-2 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-2 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent" aria-hidden />

        {destinations.map((destination) => {
          const card = onDelete ? (
            <ManageableDestinationCard
              destination={destination}
              action={onDelete}
              canFavorite={canFavorite}
            />
          ) : (
            <DestinationCard
              destination={destination}
              canFavorite={canFavorite}
            />
          );

          return (
            <div
              key={destination.id}
              role="listitem"
              className="snap-start"
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
