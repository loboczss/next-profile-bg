"use client";

import { useRef } from "react";

import { ChevronLeft, ChevronRight, Compass } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";


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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const amount = container.clientWidth * 0.9;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-[32px] border border-dashed border-white/10 bg-slate-950/80 p-12 text-center text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
        <div className="grid size-20 place-items-center rounded-full bg-white/10 text-sky-300 shadow-inner">
          <Compass className="size-10" />
        </div>
        <div className="space-y-3">
          <p className="text-xl font-semibold">Nenhum destino cadastrado ainda</p>
          <p className="text-sm text-white/70">
            Cadastre novas experiências pelo dashboard para montar uma vitrine inspiradora por aqui.
          </p>
        </div>
      </div>
    );
  }

  if (onDelete) {
    return (
      <div
        className="grid gap-6 lg:grid-cols-2"
        role="list"
        aria-label="Destinos disponíveis"
      >
        {destinations.map((destination) => (
          <div key={destination.id} role="listitem" className="flex flex-col">
            <ManageableDestinationCard
              destination={destination}
              action={onDelete}
              canFavorite={canFavorite}
              className="h-full"
              cardClassName="h-full"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent md:block"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent md:block"
        aria-hidden="true"
      />

      <div className="relative">
        <div
          ref={scrollRef}
          role="list"
          aria-label="Coleção de destinos em destaque"
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pt-2 [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          {destinations.map((destination) => (
            <div
              key={destination.id}
              role="listitem"
              className="snap-start"
              style={{ scrollSnapAlign: "start" }}
            >
              <DestinationCard
                destination={destination}
                canFavorite={canFavorite}
                className="h-full"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 md:flex">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl shadow-slate-950/40 transition hover:bg-white"
            aria-label="Rolagem para a esquerda"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl shadow-slate-950/40 transition hover:bg-white"
            aria-label="Rolagem para a direita"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
