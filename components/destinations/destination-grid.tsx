import { Compass } from "lucide-react";

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
  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center shadow-lg">
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

  return (
    <div className="relative">
      <div
        className={cn(
          "flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6", // mobile carousel
          "sm:grid sm:auto-rows-fr sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 xl:grid-cols-3 2xl:grid-cols-4"
        )}
        role="list"
        aria-label="Destinos disponíveis"
      >
        {destinations.map((destination) => {
          const card = onDelete ? (
            <ManageableDestinationCard
              destination={destination}
              action={onDelete}
              canFavorite={canFavorite}
              className="h-full"
              cardClassName="h-full"
            />
          ) : (
            <DestinationCard
              destination={destination}
              canFavorite={canFavorite}
              className="h-full"
            />
          );

          return (
            <div
              key={destination.id}
              role="listitem"
              className="snap-center shrink-0 basis-[calc(100%-3rem)] px-1 first:pl-2 last:pr-2 sm:snap-align-none sm:shrink sm:basis-auto sm:px-0"
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
