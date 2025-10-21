"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Clapperboard, Sparkles } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";
import { cn } from "@/lib/utils";

import { DestinationCard } from "./destination-card";
import { ManageableDestinationCard } from "./manageable-destination-card";

interface DestinationCarouselProps {
  destinations: SerializedDestination[];
  onDelete?: DestinationDeleteAction;
  canFavorite?: boolean;
}

export function DestinationCarousel({
  destinations,
  onDelete,
  canFavorite = true,
}: DestinationCarouselProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const canNavigate = destinations.length > 1;

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const container = listRef.current;
    if (!container) return;

    const child = container.children[index] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({
        behavior,
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleNavigate = (direction: -1 | 1) => {
    setActiveIndex((current) => {
      const next = (current + direction + destinations.length) % destinations.length;
      requestAnimationFrame(() => scrollToIndex(next));
      return next;
    });
  };

  useEffect(() => {
    scrollToIndex(activeIndex, "auto");
  }, [activeIndex, destinations.length]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleScroll = () => {
      const center = container.scrollLeft + container.clientWidth / 2;
      const children = Array.from(container.children) as HTMLElement[];

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const distance = Math.abs(center - childCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveIndex(nearestIndex);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [destinations.length]);

  const cards = useMemo(
    () =>
      destinations.map((destination, index) => {
        const card = onDelete ? (
          <ManageableDestinationCard
            destination={destination}
            action={onDelete}
            canFavorite={canFavorite}
            cardClassName="h-full"
            isActive={index === activeIndex}
          />
        ) : (
          <DestinationCard
            destination={destination}
            canFavorite={canFavorite}
            isActive={index === activeIndex}
          />
        );

        return (
          <div
            key={destination.id}
            className="snap-center"
            role="listitem"
            aria-label={`Destino ${destination.name}`}
          >
            <div
              className={cn(
                "w-[min(80vw,300px)] sm:w-[320px] md:w-[340px] lg:w-[360px]",
                onDelete ? "pb-16" : "pb-10"
              )}
            >
              {card}
            </div>
          </div>
        );
      }),
    [activeIndex, canFavorite, destinations, onDelete]
  );

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          <Sparkles className="size-4 text-sky-300" />
          <span>Catálogo de destinos</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Clapperboard className="size-4 text-sky-300" />
          <span>
            {activeIndex + 1} / {destinations.length}
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white via-white/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />

        <div
          ref={listRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4"
          role="list"
          aria-label="Galeria de destinos"
        >
          {cards}
        </div>

        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-sky-200 bg-white/80 p-3 text-slate-600 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Ver destino anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-sky-200 bg-white/80 p-3 text-slate-600 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Ver próximo destino"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
