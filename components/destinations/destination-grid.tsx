"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowLeft, ArrowRight, Compass } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const hasDestinations = destinations.length > 0;

  const updateScrollButtons = useCallback(() => {
    const container = scrollRef.current;
    if (!container) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollPrev(scrollLeft > 8);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    updateScrollButtons();

    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    updateScrollButtons();
  }, [destinations.length, updateScrollButtons]);

  if (!hasDestinations) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200/70 bg-white/80 p-12 text-center shadow-lg">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600 shadow-inner">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-900">
            Nenhum destino cadastrado ainda
          </p>
          <p className="text-sm text-slate-600">
            Cadastre novas experiências pelo dashboard para montar uma vitrine encantadora por aqui.
          </p>
        </div>
      </div>
    );
  }

  if (onDelete) {
    return (
      <div
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        role="list"
        aria-label="Destinos disponíveis para gerenciamento"
      >
        {destinations.map((destination) => (
          <div key={destination.id} role="listitem" className="flex w-full">
            <ManageableDestinationCard
              destination={destination}
              action={onDelete}
              canFavorite={canFavorite}
              className="w-full"
              cardClassName="w-full"
            />
          </div>
        ))}
      </div>
    );
  }

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const offset = Math.max(container.clientWidth * 0.8, 320);
    const behavior: ScrollBehavior = "smooth";

    container.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior,
    });
  };

  return (
    <div className="relative" aria-label="Carrossel de destinos">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent" aria-hidden="true" />

      <div className="relative flex items-center gap-4">
        <button
          type="button"
          className={cn(
            "hidden size-12 -translate-x-6 items-center justify-center rounded-full border border-slate-200/70 bg-white/95 text-slate-600 shadow-xl transition hover:-translate-x-7 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 lg:flex",
            !canScrollPrev && "pointer-events-none opacity-0"
          )}
          aria-label="Ver destinos anteriores"
          onClick={() => scrollBy("left")}
        >
          <ArrowLeft className="size-5" />
        </button>

        <div
          ref={scrollRef}
          role="list"
          aria-label="Destinos disponíveis"
          className="group/track flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-8 pt-4 [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollbarWidth: "none" }}
        >
          <style jsx>{`
            .group\/track::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {destinations.map((destination) => (
            <div
              key={destination.id}
              role="listitem"
              className="snap-start"
            >
              <DestinationCard destination={destination} canFavorite={canFavorite} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cn(
            "hidden size-12 translate-x-6 items-center justify-center rounded-full border border-slate-200/70 bg-white/95 text-slate-600 shadow-xl transition hover:translate-x-7 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 lg:flex",
            !canScrollNext && "pointer-events-none opacity-0"
          )}
          aria-label="Ver mais destinos"
          onClick={() => scrollBy("right")}
        >
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
